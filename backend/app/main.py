import base64
import hashlib
import io
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from .analysis import AnalysisEngine, AnalysisUnavailable, input_revision_hash
from .auth import AuthService
from .extraction import (
    MAX_REQUIREMENTS,
    MAX_UPLOAD_BYTES,
    ExtractionError,
    UnsupportedFileError,
    clean_original_filename,
    extract_document,
)
from .middleware import UploadRequestSizeLimitMiddleware
from .repositories import MongoRepository
from .schemas import (
    AnalysisCreate,
    FindingReviewCreate,
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    RequirementCreate,
    RequirementDelete,
    RequirementMerge,
    RequirementSplit,
    RequirementUpdate,
)


logger = logging.getLogger(__name__)
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _now():
    return datetime.now(timezone.utc).isoformat()


def _public_id(record):
    result = dict(record)
    result['id'] = result.pop('_id')
    return result


def _as_requirement(record):
    result = dict(record)
    result['id'] = result.pop('_id')
    return result


def _public_document(record):
    fields = ('_id', 'project_id', 'original_name', 'sha256', 'format',
              'version', 'extraction_status', 'page_count', 'created_at')
    return _public_id({key: record[key] for key in fields if key in record})


def _remove_file(path):
    try:
        if path.exists():
            path.unlink()
    except OSError:
        logger.exception('Could not remove temporary uploaded file %s', path)


def _public_record(record):
    result = dict(record)
    if '_id' in result:
        result['id'] = result.pop('_id')
    return result


def _analysis_summary(run):
    fields = (
        '_id', 'document_id', 'status', 'created_at', 'source_document_sha256',
        'input_revision_hash', 'model_versions', 'rule_version', 'duplicate_threshold',
        'duplicate_threshold_status', 'findings_count', 'summary', 'error',
    )
    return _public_record({key: run[key] for key in fields if key in run})


def _render_analysis_chart(repository, run_id, kind):
    import matplotlib
    matplotlib.use('Agg')
    from matplotlib.figure import Figure
    from matplotlib.backends.backend_agg import FigureCanvasAgg

    findings, _ = repository.list_findings(run_id, None, 0, 20000)
    reviews = repository.latest_reviews(run_id)
    figure = Figure(figsize=(7.2, 4.2), tight_layout=True)
    axis = figure.subplots()
    axis.set_axisbelow(True)
    axis.grid(axis='x', color='#e8ebf2')
    if kind in ('classification', 'nfr'):
        labels = {}
        for item in findings:
            if item['kind'] != 'classification':
                continue
            payload = item['payload']
            value = payload.get('suggested_label')
            if kind == 'nfr' and value == 'NFR':
                value = payload.get('suggested_subtype') or 'NFR (subtype unavailable)'
            elif kind == 'nfr':
                continue
            labels[value] = labels.get(value, 0) + 1
        names = sorted(labels)
        axis.barh(names, [labels[name] for name in names], color='#5268e8')
        axis.set_xlabel('Suggested requirements')
        axis.set_title(
            'Model-suggested {}'.format(
                'classification' if kind == 'classification' else 'NFR subtypes'
            )
        )
        if not names:
            axis.text(
                0.5, 0.5, 'No {} suggestions in this run'.format(
                    'NFR subtype' if kind == 'nfr' else 'classification'
                ),
                transform=axis.transAxes, ha='center', va='center', color='#78849a',
            )
    elif kind == 'flags':
        counts = {
            'Ambiguity cues': sum(item['kind'] == 'ambiguity' for item in findings),
            'Duplicate candidates': sum(item['kind'] == 'duplicate' for item in findings),
        }
        names = list(counts)
        axis.barh(names, [counts[name] for name in names], color='#b68b37')
        axis.set_xlabel('Review cues (not confirmed defects)')
        axis.set_title('Quality review cues by type')
    else:
        decisions = {'Accepted': 0, 'Dismissed': 0, 'Corrected': 0, 'Not reviewed': 0}
        decision_labels = {
            'accept': 'Accepted',
            'dismiss': 'Dismissed',
            'correct': 'Corrected',
        }
        for item in findings:
            review = reviews.get(item['_id'])
            key = decision_labels.get(review['decision'], 'Not reviewed') if review else 'Not reviewed'
            decisions[key] = decisions.get(key, 0) + 1
        names = list(decisions)
        axis.barh(names, [decisions[name] for name in names], color='#2e9b72')
        axis.set_xlabel('Findings')
        axis.set_title('Reviewer decisions')
    axis.invert_yaxis()
    stream = io.BytesIO()
    FigureCanvasAgg(figure).print_png(stream)
    figure.clear()
    return stream.getvalue()


def create_app(repository=None, storage_dir=None, analysis_engine=None):
    app = FastAPI(title='ReqCheck API', version='0.1.0')
    app.state.repository = repository if repository is not None else MongoRepository(
        os.environ.get('MONGO_URI', 'mongodb://127.0.0.1:27017'),
        os.environ.get('MONGO_DB', 'reqcheck'),
    )
    app.state.storage_dir = Path(storage_dir or os.environ.get(
        'REQCHECK_STORAGE_DIR', str(PROJECT_ROOT / 'storage' / 'uploads')
    ))
    app.state.database_ready = repository is not None
    app.state.analysis_engine = analysis_engine
    app.state.analysis_error = None
    app.add_middleware(UploadRequestSizeLimitMiddleware)

    @app.on_event('startup')
    def initialize_repository():
        try:
            app.state.repository.initialize()
            app.state.database_ready = True
        except ServerSelectionTimeoutError:
            app.state.database_ready = False
            logger.exception('MongoDB is unavailable; start the configured local MongoDB server')
        if app.state.analysis_engine is None:
            try:
                app.state.analysis_engine = AnalysisEngine.from_artifacts()
                app.state.analysis_error = None
            except AnalysisUnavailable as exc:
                app.state.analysis_error = str(exc)
                logger.error('Analysis is unavailable: %s', exc)

    auth = AuthService(app.state.repository, app.state.storage_dir)
    app.state.auth = auth
    auth.install(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=['http://127.0.0.1:3000', 'http://localhost:3000'],
        allow_credentials=True,
        allow_methods=['GET', 'POST', 'PATCH', 'DELETE'],
        allow_headers=['Content-Type', 'X-CSRF-Token'],
    )

    @app.exception_handler(PyMongoError)
    async def database_error_handler(request, exc):
        logger.exception('MongoDB request failed')
        return JSONResponse(
            status_code=503,
            content={'detail': 'Database is unavailable; retry after it is ready.'},
        )

    @app.get('/health')
    def health():
        try:
            app.state.repository.health()
        except PyMongoError:
            app.state.database_ready = False
            raise HTTPException(
                status_code=503,
                detail={'status': 'not_ready', 'database': 'unavailable'},
            )
        app.state.database_ready = True
        if app.state.analysis_engine is None:
            raise HTTPException(
                status_code=503,
                detail={
                    'status': 'degraded',
                    'database': 'ready',
                    'analysis': 'unavailable',
                    'analysis_error': app.state.analysis_error,
                },
            )
        return {'status': 'ready', 'database': 'ready', 'analysis': 'ready'}

    @app.post('/projects', response_model=ProjectResponse, status_code=201)
    def create_project(payload: ProjectCreate, request: Request):
        record = {
            '_id': str(uuid.uuid4()),
            'name': payload.name,
            'description': payload.description,
            'created_at': _now(),
            'owner_id': request.state.session['owner_id'],
        }
        return _public_id(app.state.repository.create_project(record))

    @app.get('/projects', response_model=ProjectListResponse)
    def list_projects(
        request: Request,
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
    ):
        records, total = app.state.repository.list_projects(
            (page - 1) * page_size, page_size, request.state.session['owner_id']
        )
        return {
            'items': [_public_id(record) for record in records],
            'page': page,
            'page_size': page_size,
            'total': total,
        }

    @app.patch('/projects/{project_id}', response_model=ProjectResponse)
    def update_project(project_id: str, payload: ProjectCreate):
        updated = app.state.repository.update_project(project_id, payload.name, payload.description)
        if updated is None:
            raise HTTPException(404, 'Project not found.')
        return _public_id(updated)

    @app.delete('/projects/{project_id}', status_code=204)
    def delete_project(project_id: str, confirm_name: str = Query(...)):
        project = app.state.repository.get_project(project_id)
        if not project or project['name'] != confirm_name:
            raise HTTPException(400, 'Enter the exact project name to confirm deletion.')
        auth.delete_project_data(project_id)
        return Response(status_code=204)

    @app.get('/projects/{project_id}/documents')
    def list_documents(
        project_id: str,
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
    ):
        if not app.state.repository.project_exists(project_id):
            raise HTTPException(status_code=404, detail='Project not found.')
        records, total = app.state.repository.list_documents(
            project_id, (page - 1) * page_size, page_size
        )
        return {
            'items': [_public_document(record) for record in records],
            'page': page,
            'page_size': page_size,
            'total': total,
        }

    @app.post('/projects/{project_id}/documents', status_code=201)
    def upload_document(project_id: str, request: Request, file: UploadFile = File(...)):
        if not app.state.repository.project_exists(project_id):
            raise HTTPException(status_code=404, detail='Project not found.')
        original_name = clean_original_filename(file.filename or '')
        try:
            data = file.file.read(MAX_UPLOAD_BYTES + 1)
        finally:
            file.file.close()
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail='Files may not exceed 10 MiB.')
        try:
            blocks, page_count = extract_document(original_name, data)
        except UnsupportedFileError as exc:
            raise HTTPException(status_code=415, detail=str(exc))
        except ExtractionError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        if len(blocks) > MAX_REQUIREMENTS:
            raise HTTPException(
                status_code=400,
                detail='Extraction produced more than {} reviewable blocks.'.format(MAX_REQUIREMENTS),
            )

        document_id = str(uuid.uuid4())
        extension = Path(original_name).suffix.lower()
        stored_path = app.state.storage_dir / (document_id + extension)
        requirements = []
        for sequence, block in enumerate(blocks, 1):
            requirement_id = str(uuid.uuid4())
            requirements.append({
                '_id': requirement_id,
                'owner_id': request.state.session['owner_id'],
                'document_id': document_id,
                'document_version': 1,
                'sequence': sequence,
                'text': block['text'],
                'source_text': block.get('source_text', block['text']),
                'location': {key: block.get(key) for key in
                             ('page', 'page_end', 'paragraph', 'table', 'row', 'cell', 'source_id')},
                'revision': 1,
                'deleted': False,
            })
        document = {
            '_id': document_id,
            'owner_id': request.state.session['owner_id'],
            'project_id': project_id,
            'original_name': original_name,
            'stored_path': str(stored_path.resolve()),
            'sha256': hashlib.sha256(data).hexdigest(),
            'format': extension[1:],
            'version': 1,
            'extraction_status': 'complete',
            'page_count': page_count,
            'created_at': _now(),
        }
        try:
            app.state.storage_dir.mkdir(parents=True, exist_ok=True)
            with stored_path.open('xb') as stream:
                stream.write(data)
        except OSError:
            logger.exception('Could not store uploaded document')
            raise HTTPException(status_code=500, detail='The uploaded document could not be stored.')
        try:
            app.state.repository.create_document(document, requirements)
        except PyMongoError:
            _remove_file(stored_path)
            raise HTTPException(status_code=503, detail='Database is unavailable; the upload was not saved.')
        except Exception:
            _remove_file(stored_path)
            logger.exception('Could not save uploaded document metadata')
            raise
        return {
            'id': document_id,
            'project_id': project_id,
            'original_name': original_name,
            'format': document['format'],
            'sha256': document['sha256'],
            'extraction_status': document['extraction_status'],
            'page_count': page_count,
            'requirements': [_as_requirement(record) for record in requirements],
        }

    @app.get('/documents/{document_id}/requirements')
    def list_requirements(
        document_id: str,
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
    ):
        if not app.state.repository.document_exists(document_id):
            raise HTTPException(status_code=404, detail='Document not found.')
        records, total = app.state.repository.list_requirements(
            document_id, (page - 1) * page_size, page_size
        )
        all_records = app.state.repository.all_requirements(document_id)
        return {
            'items': [_as_requirement(record) for record in records],
            'page': page,
            'page_size': page_size,
            'total': total,
            'input_hash': input_revision_hash(all_records),
        }

    @app.patch('/requirements/{requirement_id}')
    def update_requirement(requirement_id: str, payload: RequirementUpdate):
        existing = app.state.repository.get_requirement(requirement_id)
        if existing is None:
            raise HTTPException(status_code=404, detail='Requirement not found.')
        if existing['revision'] != payload.expected_revision:
            raise HTTPException(status_code=409, detail='Requirement changed; reload before editing.')
        updated = app.state.repository.update_requirement(
            requirement_id, payload.expected_revision, payload.text
        )
        if updated is None:
            raise HTTPException(status_code=409, detail='Requirement changed; reload before editing.')
        return _as_requirement(updated)

    @app.post('/documents/{document_id}/requirements', status_code=201)
    def add_requirement(document_id: str, payload: RequirementCreate, request: Request):
        if not app.state.repository.document_exists(document_id):
            raise HTTPException(status_code=404, detail='Document not found.')
        existing, total = app.state.repository.list_requirements(document_id, 0, MAX_REQUIREMENTS)
        if total >= MAX_REQUIREMENTS:
            raise HTTPException(status_code=400, detail='Documents may contain at most 500 requirements.')
        record = {
            '_id': str(uuid.uuid4()),
            'owner_id': request.state.session['owner_id'],
            'document_id': document_id,
            'document_version': 1,
            'sequence': 0,
            'text': payload.text,
            'source_text': payload.text,
            'location': payload.location or {
                'page': None, 'paragraph': None, 'table': None, 'row': None, 'cell': None
            },
            'revision': 1,
            'deleted': False,
        }
        return _as_requirement(app.state.repository.add_requirement(document_id, record))

    @app.post('/requirements/{requirement_id}/split', status_code=201)
    def split_requirement(requirement_id: str, payload: RequirementSplit, request: Request):
        existing = app.state.repository.get_requirement(requirement_id)
        if existing is None:
            raise HTTPException(status_code=404, detail='Requirement not found.')
        _, total = app.state.repository.list_requirements(
            existing['document_id'], 0, MAX_REQUIREMENTS
        )
        if total + len(payload.texts) - 1 > MAX_REQUIREMENTS:
            raise HTTPException(status_code=400, detail='Documents may contain at most 500 requirements.')
        updated = app.state.repository.update_requirement(
            requirement_id, payload.expected_revision, payload.texts[0]
        )
        if updated is None:
            raise HTTPException(status_code=409, detail='Requirement changed; reload before splitting.')
        results = [updated]
        try:
            for text in payload.texts[1:]:
                record = {
                    '_id': str(uuid.uuid4()),
                    'owner_id': request.state.session['owner_id'],
                    'document_id': existing['document_id'],
                    'document_version': existing['document_version'],
                    'sequence': 0,
                    'text': text,
                    'source_text': existing['source_text'],
                    'location': existing.get('location'),
                    'revision': 1,
                    'deleted': False,
                }
                results.append(app.state.repository.add_requirement(
                    existing['document_id'], record
                ))
        except PyMongoError:
            try:
                app.state.repository.delete_requirements(
                    [item['_id'] for item in results[1:]]
                )
            except PyMongoError:
                logger.exception('Could not remove partially added requirement split records')
            try:
                rollback = app.state.repository.update_requirement(
                    requirement_id, updated['revision'], existing['text']
                )
                if rollback is None:
                    logger.error('Could not restore the original text after a failed requirement split')
            except PyMongoError:
                logger.exception('Could not restore original requirement text after a failed split')
            raise
        return {'items': [_as_requirement(item) for item in results]}

    @app.post('/requirements/{requirement_id}/merge')
    def merge_requirements(requirement_id: str, payload: RequirementMerge, request: Request):
        auth.owned_project('requirements', payload.other_requirement_id, request.state.session['owner_id'])
        first = app.state.repository.get_requirement(requirement_id)
        second = app.state.repository.get_requirement(payload.other_requirement_id)
        if first is None or second is None:
            raise HTTPException(status_code=404, detail='One or both requirements were not found.')
        if first['document_id'] != second['document_id']:
            raise HTTPException(status_code=400, detail='Requirements must belong to the same document.')
        if first['_id'] == second['_id']:
            raise HTTPException(status_code=400, detail='Choose two different requirements to merge.')
        if first['revision'] != payload.expected_revision or second['revision'] != payload.other_expected_revision:
            raise HTTPException(status_code=409, detail='A requirement changed; reload before merging.')

        retained, removed = sorted(
            (first, second), key=lambda item: (item['sequence'], item['_id'])
        )
        merged_text = retained['text'].rstrip() + '\n' + removed['text'].lstrip()
        if len(merged_text) > 10000:
            raise HTTPException(
                status_code=400,
                detail='Merged requirement text may not exceed 10,000 characters.',
            )
        updated = app.state.repository.update_requirement(
            retained['_id'], retained['revision'], merged_text
        )
        if updated is None:
            raise HTTPException(status_code=409, detail='A requirement changed; reload before merging.')
        try:
            deleted = app.state.repository.soft_delete_requirement(
                removed['_id'], removed['revision']
            )
        except PyMongoError:
            try:
                rollback = app.state.repository.update_requirement(
                    retained['_id'], updated['revision'], retained['text']
                )
                if rollback is None:
                    logger.error('Could not restore a partially merged requirement pair')
            except PyMongoError:
                logger.exception('Could not restore requirement text after a failed merge')
            raise
        if deleted is None:
            rollback = app.state.repository.update_requirement(
                retained['_id'], updated['revision'], retained['text']
            )
            if rollback is None:
                logger.error('Could not restore a partially merged requirement pair')
            raise HTTPException(status_code=409, detail='A requirement changed; reload before merging.')
        return {
            'requirement': _as_requirement(updated),
            'removed_requirement_id': removed['_id'],
        }

    @app.delete('/requirements/{requirement_id}', status_code=204)
    def delete_requirement(requirement_id: str, payload: RequirementDelete):
        existing = app.state.repository.get_requirement(requirement_id)
        if existing is None:
            raise HTTPException(status_code=404, detail='Requirement not found.')
        deleted = app.state.repository.soft_delete_requirement(
            requirement_id, payload.expected_revision
        )
        if deleted is None:
            raise HTTPException(status_code=409, detail='Requirement changed; reload before deleting.')
        return Response(status_code=204)

    @app.post('/documents/{document_id}/analysis-runs', status_code=201)
    def create_analysis_run(document_id: str, payload: AnalysisCreate, request: Request):
        document = app.state.repository.get_document(document_id)
        if document is None:
            raise HTTPException(status_code=404, detail='Document not found.')
        requirements = app.state.repository.all_requirements(document_id)
        current_hash = input_revision_hash(requirements)
        if current_hash != payload.expected_input_hash:
            raise HTTPException(
                status_code=409,
                detail='Requirements changed since they were loaded. Refresh before analysis.',
            )

        run_id = str(uuid.uuid4())
        created_at = _now()
        engine = app.state.analysis_engine
        base_run = {
            '_id': run_id,
            'owner_id': request.state.session['owner_id'],
            'document_id': document_id,
            'status': 'failed',
            'created_at': created_at,
            'source_document_sha256': document['sha256'],
            'input_revision_hash': current_hash,
            'model_versions': engine.model_versions if engine else {},
            'rule_version': engine.RULE_VERSION if engine else 'unavailable',
            'duplicate_threshold': engine.DUPLICATE_THRESHOLD if engine else None,
            'duplicate_threshold_status': (
                'provisional; requires annotated validation pairs' if engine else 'unavailable'
            ),
            'findings_count': 0,
            'summary': {},
            'error': None,
        }
        findings = []
        if engine is None:
            base_run['error'] = app.state.analysis_error or 'Analysis models are unavailable.'
        elif not requirements:
            base_run['error'] = 'Add at least one active requirement before running analysis.'
        else:
            try:
                calculated, summary = engine.analyze(requirements)
                findings = [
                    dict(item, _id=str(uuid.uuid4()), run_id=run_id, document_id=document_id,
                         owner_id=request.state.session['owner_id'])
                    for item in calculated
                ]
                base_run.update({
                    'status': 'complete',
                    'findings_count': len(findings),
                    'summary': summary,
                })
            except (ValueError, RuntimeError) as exc:
                base_run['error'] = 'Analysis could not be completed: {}'.format(exc)
                logger.exception('Analysis failed for document %s', document_id)

        app.state.repository.create_analysis_run(base_run, findings, requirements)
        return _analysis_summary(base_run)

    @app.get('/documents/{document_id}/analysis-runs')
    def list_analysis_runs(
        document_id: str,
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
    ):
        if app.state.repository.get_document(document_id) is None:
            raise HTTPException(status_code=404, detail='Document not found.')
        records, total = app.state.repository.list_analysis_runs(
            document_id, (page - 1) * page_size, page_size
        )
        current_hash = input_revision_hash(app.state.repository.all_requirements(document_id))
        items = []
        for record in records:
            summary = _analysis_summary(record)
            summary['stale'] = record['input_revision_hash'] != current_hash
            items.append(summary)
        return {'items': items, 'page': page, 'page_size': page_size, 'total': total}

    @app.get('/analysis-runs/{run_id}/requirements')
    def list_analysis_requirements(run_id: str):
        if app.state.repository.get_analysis_run(run_id) is None:
            raise HTTPException(status_code=404, detail='Analysis run not found.')
        return {
            'items': [
                _as_requirement(item)
                for item in app.state.repository.list_run_requirements(run_id)
            ]
        }

    @app.get('/analysis-runs/{run_id}/findings')
    def list_findings(
        run_id: str,
        kind: str = Query(None, regex='^(classification|ambiguity|duplicate)$'),
        page: int = Query(1, ge=1),
        page_size: int = Query(50, ge=1, le=100),
    ):
        if app.state.repository.get_analysis_run(run_id) is None:
            raise HTTPException(status_code=404, detail='Analysis run not found.')
        records, total = app.state.repository.list_findings(
            run_id, kind, (page - 1) * page_size, page_size
        )
        reviews = app.state.repository.latest_reviews(run_id)
        items = []
        for record in records:
            finding = _public_record(record)
            finding['latest_review'] = _public_record(reviews[record['_id']]) if record['_id'] in reviews else None
            items.append(finding)
        return {'items': items, 'page': page, 'page_size': page_size, 'total': total}

    @app.post('/findings/{finding_id}/reviews', status_code=201)
    def create_finding_review(finding_id: str, payload: FindingReviewCreate, request: Request):
        finding = app.state.repository.get_finding(finding_id)
        if finding is None:
            raise HTTPException(status_code=404, detail='Finding not found.')
        if payload.decision == 'correct':
            if finding['kind'] == 'classification' and payload.corrected_label not in ('F', 'NFR'):
                raise HTTPException(status_code=400, detail='Corrected classification must be F or NFR.')
            if finding['kind'] != 'classification' and not payload.corrected_text:
                raise HTTPException(status_code=400, detail='Provide corrected wording for this finding.')
        record = {
            '_id': str(uuid.uuid4()),
            'owner_id': request.state.session['owner_id'],
            'run_id': finding['run_id'],
            'finding_id': finding_id,
            'decision': payload.decision.value,
            'comment': payload.comment,
            'corrected_text': payload.corrected_text,
            'corrected_label': payload.corrected_label,
            'created_at': _now(),
        }
        return _public_record(app.state.repository.create_review_event(record))

    @app.get('/analysis-runs/{run_id}/reviews')
    def list_finding_reviews(run_id: str):
        if app.state.repository.get_analysis_run(run_id) is None:
            raise HTTPException(status_code=404, detail='Analysis run not found.')
        return {
            'items': [
                _public_record(item)
                for item in app.state.repository.list_review_events(run_id)
            ]
        }

    @app.get('/analysis-runs/{run_id}/charts/{kind}.png')
    def get_analysis_chart(run_id: str, kind: str):
        run = app.state.repository.get_analysis_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail='Analysis run not found.')
        if run['status'] != 'complete':
            raise HTTPException(status_code=409, detail='Charts are available only for completed runs.')
        if kind not in ('classification', 'nfr', 'review', 'flags'):
            raise HTTPException(status_code=404, detail='Chart type not found.')
        try:
            chart = _render_analysis_chart(app.state.repository, run_id, kind)
        except ImportError as exc:
            raise HTTPException(
                status_code=503,
                detail='Chart generation dependency is unavailable: {}'.format(exc),
            )
        return Response(content=chart, media_type='image/png', headers={'Cache-Control': 'no-store'})

    @app.get('/analysis-runs/{run_id}/report')
    def get_analysis_report(
        run_id: str,
        format: str = Query('html', regex='^(html|csv|json)$'),
    ):
        from .reports import render_csv, render_html, render_json, report_payload

        run = app.state.repository.get_analysis_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail='Analysis run not found.')
        if run['status'] != 'complete':
            raise HTTPException(status_code=409, detail='Reports are available only for completed runs.')
        document = app.state.repository.get_document(run['document_id'])
        if document is None:
            raise HTTPException(status_code=404, detail='Source document has been deleted.')
        findings, total = app.state.repository.list_findings(run_id, None, 0, 20000)
        if total > len(findings):
            raise HTTPException(status_code=413, detail='This report exceeds the supported export size.')
        current_requirements = app.state.repository.all_requirements(run['document_id'])
        requirements = app.state.repository.list_run_requirements(run_id)
        current_hash = input_revision_hash(current_requirements)
        reviews = app.state.repository.list_review_events(run_id)
        payload = report_payload(
            run, findings, reviews, document, requirements,
            current_hash != run['input_revision_hash'],
        )
        if format == 'json':
            content = render_json(payload)
            media_type = 'application/json; charset=utf-8'
        elif format == 'csv':
            content = render_csv(payload)
            media_type = 'text/csv; charset=utf-8'
        else:
            try:
                chart = _render_analysis_chart(app.state.repository, run_id, 'classification')
            except ImportError as exc:
                raise HTTPException(
                    status_code=503,
                    detail='Chart generation dependency is unavailable: {}'.format(exc),
                )
            content = render_html(
                payload,
                payload['findings'],
                reviews,
                'data:image/png;base64,{}'.format(base64.b64encode(chart).decode('ascii')),
            )
            media_type = 'text/html; charset=utf-8'
        return Response(
            content=content,
            media_type=media_type,
            headers={
                'Cache-Control': 'no-store',
                'Content-Disposition': '{}; filename="reqcheck-report-{}.{}"'.format(
                    'inline' if format == 'html' else 'attachment', run_id, format
                )
            },
        )

    @app.delete('/documents/{document_id}', status_code=204)
    def delete_document(document_id: str, confirm_name: str = Query(..., min_length=1)):
        document = app.state.repository.get_document(document_id)
        if document is None:
            raise HTTPException(status_code=404, detail='Document not found.')
        if confirm_name != document['original_name']:
            raise HTTPException(status_code=400, detail='Enter the exact document filename to confirm deletion.')
        stored_path = Path(document['stored_path'])
        deleted = app.state.repository.delete_document_data(document_id)
        if deleted is None:
            raise HTTPException(status_code=404, detail='Document not found.')
        try:
            if stored_path.exists():
                stored_path.unlink()
        except OSError:
            logger.exception('Document records were deleted but the uploaded file could not be removed: %s', stored_path)
            raise HTTPException(
                status_code=500,
                detail='Document records were removed, but the stored file could not be deleted. Contact the workspace administrator.',
            )
        return Response(status_code=204)

    return app


app = create_app()
