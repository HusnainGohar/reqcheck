import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from pymongo.errors import PyMongoError

from backend.app.main import create_app
from backend.app.repositories import MemoryRepository


class TestAnalysisEngine:
    RULE_VERSION = 'test-rules-v1'
    DUPLICATE_THRESHOLD = 0.75
    model_versions = {'binary': 'test-binary', 'nfr': 'test-nfr'}

    def analyze(self, requirements):
        findings = []
        for item in requirements:
            findings.append({
                'kind': 'classification',
                'requirement_ids': [item['_id']],
                'sequence': item['sequence'],
                'payload': {
                    'suggested_label': 'F',
                    'suggested_subtype': None,
                    'label_is_suggestion': True,
                },
            })
            if 'quickly' in item['text'].lower():
                findings.append({
                    'kind': 'ambiguity',
                    'requirement_ids': [item['_id']],
                    'sequence': item['sequence'],
                    'payload': {
                        'rule': 'VAGUE_TERM',
                        'term': 'quickly',
                        'start': item['text'].lower().index('quickly'),
                        'end': item['text'].lower().index('quickly') + len('quickly'),
                        'suggestion': 'Specify a measurable acceptance criterion.',
                    },
                })
        if len(requirements) > 1 and requirements[0]['text'] == requirements[1]['text']:
            findings.append({
                'kind': 'duplicate',
                'requirement_ids': [requirements[0]['_id'], requirements[1]['_id']],
                'sequence': requirements[0]['sequence'],
                'payload': {
                    'similarity': 1.0,
                    'threshold': self.DUPLICATE_THRESHOLD,
                    'threshold_status': 'provisional',
                },
            })
        summary = {
            'classification_count': len(requirements),
            'ambiguity_count': sum(item['kind'] == 'ambiguity' for item in findings),
            'duplicate_candidate_count': sum(item['kind'] == 'duplicate' for item in findings),
            'duplicate_candidates_truncated': False,
        }
        return findings, summary


class UploadApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repository = MemoryRepository()
        self.client = TestClient(create_app(
            repository=self.repository,
            storage_dir=Path(self.temp_dir.name) / 'uploads',
            analysis_engine=TestAnalysisEngine(),
        ))
        self.client.__enter__()
        session = self.client.post('/auth/guest', json={'acknowledge_temporary': True})
        self.assertEqual(session.status_code, 201, session.text)
        self.client.headers.update({'X-CSRF-Token': session.json()['csrf_token']})
        response = self.client.post('/projects', json={'name': 'Prototype project'})
        self.assertEqual(response.status_code, 201)
        self.project_id = response.json()['id']

    @staticmethod
    def make_text_pdf():
        stream = b'BT /F1 12 Tf 10 100 Td (The system shall respond.) Tj ET'
        objects = [
            b'<< /Type /Catalog /Pages 2 0 R >>',
            b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] '
            b'/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            b'<< /Length %d >>\nstream\n' % len(stream) + stream + b'\nendstream',
        ]
        output = bytearray(b'%PDF-1.4\n')
        offsets = [0]
        for number, body in enumerate(objects, 1):
            offsets.append(len(output))
            output.extend(b'%d 0 obj\n' % number + body + b'\nendobj\n')
        xref_offset = len(output)
        output.extend(b'xref\n0 6\n0000000000 65535 f \n')
        for offset in offsets[1:]:
            output.extend('{:010d} 00000 n \n'.format(offset).encode('ascii'))
        output.extend(
            b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'
            + str(xref_offset).encode('ascii') + b'\n%%EOF\n'
        )
        return bytes(output)

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.temp_dir.cleanup()

    def test_text_upload_preview_and_revision_checked_edit(self):
        response = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.txt', b'\xef\xbb\xbfThe system shall respond within two seconds.')},
        )
        self.assertEqual(response.status_code, 201, response.text)
        result = response.json()
        self.assertEqual(result['requirements'][0]['text'], 'The system shall respond within two seconds.')
        self.assertEqual(len(result['sha256']), 64)
        self.assertTrue(Path(self.repository.documents[result['id']]['stored_path']).is_file())

        project_list = self.client.get('/projects')
        self.assertEqual(project_list.json()['items'][0]['name'], 'Prototype project')
        document_list = self.client.get(
            '/projects/{}/documents'.format(self.project_id)
        )
        self.assertEqual(document_list.json()['items'][0]['id'], result['id'])
        self.assertNotIn('stored_path', document_list.json()['items'][0])

        requirement_id = result['requirements'][0]['id']
        updated = self.client.patch('/requirements/{}'.format(requirement_id), json={
            'text': 'The system shall respond within one second.',
            'expected_revision': 1,
        })
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()['revision'], 2)

        stale = self.client.patch('/requirements/{}'.format(requirement_id), json={
            'text': 'Stale edit',
            'expected_revision': 1,
        })
        self.assertEqual(stale.status_code, 409)

    def test_docx_preserves_paragraph_and_table_source_locations(self):
        payload = io.BytesIO()
        document_xml = '''<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>The system shall authenticate users.</w:t></w:r></w:p>
            <w:tbl><w:tr><w:tc><w:p><w:r><w:t>The service shall retain audit logs.</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
          </w:body>
        </w:document>'''
        content_types = '''<?xml version="1.0" encoding="UTF-8"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="xml" ContentType="application/xml"/>
        </Types>'''
        with zipfile.ZipFile(payload, 'w', zipfile.ZIP_DEFLATED) as archive:
            archive.writestr('[Content_Types].xml', content_types)
            archive.writestr('word/document.xml', document_xml)

        response = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.docx', payload.getvalue())},
        )
        self.assertEqual(response.status_code, 201, response.text)
        requirements = response.json()['requirements']
        self.assertEqual(len(requirements), 2)
        self.assertEqual(requirements[0]['location']['paragraph'], 1)
        self.assertEqual(requirements[1]['location']['table'], 1)
        self.assertEqual(requirements[1]['location']['cell'], 1)

    def test_searchable_pdf_extracts_page_text(self):
        response = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.pdf', self.make_text_pdf())},
        )
        self.assertEqual(response.status_code, 201, response.text)
        result = response.json()
        self.assertEqual(result['page_count'], 1)
        self.assertIn('The system shall respond.', result['requirements'][0]['text'])

    def test_identified_upload_exposes_individual_source_evidence(self):
        response = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('identified.txt', b'RQ-001 The system shall save\nrecords.\nRQ-002 The system shall restore records.')},
        )
        self.assertEqual(response.status_code, 201, response.text)
        items = response.json()['requirements']
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0]['text'], 'RQ-001 The system shall save records.')
        self.assertEqual(items[0]['source_text'], 'RQ-001 The system shall save\nrecords.')
        self.assertEqual(items[1]['location']['source_id'], 'RQ-002')

    def test_health_and_requirement_insertion(self):
        self.assertEqual(self.client.get('/health').json()['status'], 'ready')
        upload = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.txt', b'Initial statement.')},
        )
        document_id = upload.json()['id']
        created = self.client.post(
            '/documents/{}/requirements'.format(document_id),
            json={'text': 'A reviewer-added statement.'},
        )
        self.assertEqual(created.status_code, 201, created.text)
        self.assertEqual(created.json()['sequence'], 2)

    def test_invalid_uploads_return_actionable_errors(self):
        unsupported = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.exe', b'not a document')},
        )
        self.assertEqual(unsupported.status_code, 415)

        invalid_text = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.txt', b'\xff\xfe')},
        )
        self.assertEqual(invalid_text.status_code, 400)
        self.assertIn('UTF-8', invalid_text.json()['detail'])

    def test_upload_enforces_size_limit_and_project_existence(self):
        oversized = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('large.txt', b'x' * (10 * 1024 * 1024 + 1))},
        )
        self.assertEqual(oversized.status_code, 413)

        declared_oversize = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            data=b'',
            headers={'content-length': str(11 * 1024 * 1024)},
        )
        self.assertEqual(declared_oversize.status_code, 413)

        missing_project = self.client.post(
            '/projects/not-a-project/documents',
            files={'file': ('small.txt', b'requirement')},
        )
        self.assertEqual(missing_project.status_code, 404)

    def test_analysis_reviews_stale_runs_and_traceable_exports(self):
        upload = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.txt', b'The system shall respond quickly.')},
        )
        document = upload.json()
        requirement = document['requirements'][0]
        listed = self.client.get('/documents/{}/requirements'.format(document['id'])).json()
        self.assertEqual(len(listed['input_hash']), 64)

        created = self.client.post(
            '/documents/{}/analysis-runs'.format(document['id']),
            json={'expected_input_hash': listed['input_hash']},
        )
        self.assertEqual(created.status_code, 201, created.text)
        run = created.json()
        self.assertEqual(run['status'], 'complete')
        self.assertEqual(run['source_document_sha256'], document['sha256'])

        findings = self.client.get('/analysis-runs/{}/findings'.format(run['id']))
        self.assertEqual(findings.status_code, 200, findings.text)
        ambiguity = next(item for item in findings.json()['items'] if item['kind'] == 'ambiguity')
        classification = next(
            item for item in findings.json()['items'] if item['kind'] == 'classification'
        )
        for finding, payload in (
            (ambiguity, {'decision': 'correct', 'corrected_label': 'F'}),
            (classification, {'decision': 'correct', 'corrected_label': 'invalid'}),
        ):
            invalid_review = self.client.post(
                '/findings/{}/reviews'.format(finding['id']), json=payload
            )
            self.assertEqual(invalid_review.status_code, 400, invalid_review.text)
        review = self.client.post('/findings/{}/reviews'.format(ambiguity['id']), json={
            'decision': 'correct',
            'corrected_text': 'The system shall respond within two seconds.',
            'comment': 'Replace vague timing with an acceptance threshold.',
        })
        self.assertEqual(review.status_code, 201, review.text)
        self.assertEqual(review.json()['decision'], 'correct')
        history = self.client.get('/analysis-runs/{}/reviews'.format(run['id']))
        self.assertEqual(len(history.json()['items']), 1)

        html_report = self.client.get('/analysis-runs/{}/report?format=html'.format(run['id']))
        self.assertEqual(html_report.status_code, 200, html_report.text)
        self.assertIn('The system shall respond quickly.', html_report.text)
        self.assertIn('input revision', html_report.text.lower())
        self.assertIn('data:image/png;base64,', html_report.text)
        self.assertNotIn('ReviewDecision.correct', html_report.text)
        self.assertEqual(html_report.headers['cache-control'], 'no-store')
        self.assertTrue(html_report.headers['content-disposition'].startswith('inline;'))
        csv_report = self.client.get('/analysis-runs/{}/report?format=csv'.format(run['id']))
        self.assertEqual(csv_report.status_code, 200, csv_report.text)
        json_report = self.client.get('/analysis-runs/{}/report?format=json'.format(run['id']))
        self.assertEqual(json_report.status_code, 200, json_report.text)
        self.assertEqual(json_report.json()['run']['_id'], run['id'])
        chart = self.client.get(
            '/analysis-runs/{}/charts/classification.png'.format(run['id'])
        )
        self.assertEqual(chart.status_code, 200, chart.text)
        self.assertEqual(chart.headers['content-type'], 'image/png')

        updated = self.client.patch('/requirements/{}'.format(requirement['id']), json={
            'text': 'The system shall respond within two seconds.',
            'expected_revision': requirement['revision'],
        })
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(
            self.client.get('/documents/{}/analysis-runs'.format(document['id']))
            .json()['items'][0]['stale'],
            True,
        )
        stale_start = self.client.post(
            '/documents/{}/analysis-runs'.format(document['id']),
            json={'expected_input_hash': listed['input_hash']},
        )
        self.assertEqual(stale_start.status_code, 409)
        stale_report = self.client.get(
            '/analysis-runs/{}/report?format=html'.format(run['id'])
        )
        self.assertIn('earlier input revision', stale_report.text)
        self.assertIn('The system shall respond quickly.', stale_report.text)
        snapshot = self.client.get('/analysis-runs/{}/requirements'.format(run['id']))
        self.assertEqual(snapshot.status_code, 200, snapshot.text)
        self.assertEqual(snapshot.json()['items'][0]['text'], requirement['text'])
        self.assertEqual(snapshot.json()['items'][0]['id'], requirement['id'])
        self.assertEqual(
            self.client.get('/analysis-runs/missing/requirements').status_code, 404
        )
        current = self.client.get(
            '/documents/{}/requirements'.format(document['id'])
        ).json()
        second_run = self.client.post(
            '/documents/{}/analysis-runs'.format(document['id']),
            json={'expected_input_hash': current['input_hash']},
        )
        self.assertEqual(second_run.status_code, 201, second_run.text)
        self.assertNotEqual(second_run.json()['id'], run['id'])
        second_snapshot = self.client.get(
            '/analysis-runs/{}/requirements'.format(second_run.json()['id'])
        )
        self.assertEqual(
            second_snapshot.json()['items'][0]['text'],
            'The system shall respond within two seconds.',
        )

    def test_split_merge_and_soft_delete_requirements(self):
        upload = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.txt', b'The system shall respond quickly.')},
        )
        document_id = upload.json()['id']
        original = upload.json()['requirements'][0]
        split = self.client.post('/requirements/{}/split'.format(original['id']), json={
            'expected_revision': original['revision'],
            'texts': ['The system shall respond.', 'The response shall be quick.'],
        })
        self.assertEqual(split.status_code, 201, split.text)
        items = split.json()['items']
        self.assertEqual(len(items), 2)

        merged = self.client.post('/requirements/{}/merge'.format(items[0]['id']), json={
            'other_requirement_id': items[1]['id'],
            'expected_revision': items[0]['revision'],
            'other_expected_revision': items[1]['revision'],
        })
        self.assertEqual(merged.status_code, 200, merged.text)
        self.assertIn('\n', merged.json()['requirement']['text'])
        self.assertEqual(
            self.client.get('/documents/{}/requirements'.format(document_id)).json()['total'],
            1,
        )
        deleted = self.client.request(
            'DELETE',
            '/requirements/{}'.format(merged.json()['requirement']['id']),
            json={'expected_revision': merged.json()['requirement']['revision']},
        )
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(
            self.client.get('/documents/{}/requirements'.format(document_id)).json()['total'],
            0,
        )

    def test_failed_merge_restores_original_text_and_preserves_both_statements(self):
        upload = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.txt', b'The system shall respond.')},
        ).json()
        first = upload['requirements'][0]
        second = self.client.post(
            '/documents/{}/requirements'.format(upload['id']),
            json={'text': 'The system shall preserve source text.'},
        ).json()
        with patch.object(self.repository, 'soft_delete_requirement',
                          side_effect=PyMongoError('Injected database failure')):
            response = self.client.post('/requirements/{}/merge'.format(first['id']), json={
                'other_requirement_id': second['id'],
                'expected_revision': first['revision'],
                'other_expected_revision': second['revision'],
            })
        self.assertEqual(response.status_code, 503, response.text)
        self.assertEqual(self.repository.get_requirement(first['id'])['text'], first['text'])
        self.assertIsNotNone(self.repository.get_requirement(second['id']))
        self.assertEqual(self.repository.list_requirements(upload['id'], 0, 10)[1], 2)

    def test_merge_rejects_combined_text_over_limit_without_changing_inputs(self):
        upload = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('requirements.txt', b'A statement.')},
        ).json()
        first = self.client.patch(
            '/requirements/{}'.format(upload['requirements'][0]['id']),
            json={'text': 'A' * 6000, 'expected_revision': 1},
        ).json()
        second = self.client.post(
            '/documents/{}/requirements'.format(upload['id']),
            json={'text': 'B' * 6000},
        ).json()
        response = self.client.post('/requirements/{}/merge'.format(first['id']), json={
            'other_requirement_id': second['id'],
            'expected_revision': first['revision'],
            'other_expected_revision': second['revision'],
        })
        self.assertEqual(response.status_code, 400, response.text)
        self.assertEqual(self.repository.get_requirement(first['id'])['text'], first['text'])
        self.assertEqual(self.repository.get_requirement(second['id'])['text'], second['text'])

    def test_document_deletion_requires_exact_confirmation_and_cleans_data(self):
        upload = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('private.txt', b'A statement.')},
        )
        document_id = upload.json()['id']
        stored_path = Path(self.repository.documents[document_id]['stored_path'])
        wrong = self.client.delete(
            '/documents/{}?confirm_name=wrong.txt'.format(document_id)
        )
        self.assertEqual(wrong.status_code, 400)
        self.assertTrue(stored_path.exists())
        removed = self.client.delete(
            '/documents/{}?confirm_name=private.txt'.format(document_id)
        )
        self.assertEqual(removed.status_code, 204)
        self.assertFalse(stored_path.exists())
        self.assertIsNone(self.repository.get_document(document_id))

    def test_analysis_is_explicitly_unavailable_for_mismatched_model_runtime(self):
        repository = MemoryRepository()
        client = TestClient(create_app(
            repository=repository,
            storage_dir=Path(self.temp_dir.name) / 'mismatch-uploads',
        ))
        try:
            with patch('backend.app.analysis.sklearn.__version__', 'incompatible-test-runtime'):
                client.__enter__()
            session = client.post('/auth/guest', json={'acknowledge_temporary': True})
            client.headers.update({'X-CSRF-Token': session.json()['csrf_token']})
            project = client.post('/projects', json={'name': 'Model mismatch test'}).json()
            upload = client.post(
                '/projects/{}/documents'.format(project['id']),
                files={'file': ('requirements.txt', b'The system shall process requests.')},
            )
            document = upload.json()
            input_state = client.get(
                '/documents/{}/requirements'.format(document['id'])
            ).json()
            self.assertEqual(client.get('/health').status_code, 503)
            run = client.post(
                '/documents/{}/analysis-runs'.format(document['id']),
                json={'expected_input_hash': input_state['input_hash']},
            )
            self.assertEqual(run.status_code, 201, run.text)
            self.assertEqual(run.json()['status'], 'failed')
            self.assertIn('scikit-learn', run.json()['error'])
        finally:
            client.__exit__(None, None, None)

    def test_csv_export_neutralizes_spreadsheet_formulas_and_html_escapes_text(self):
        upload = self.client.post(
            '/projects/{}/documents'.format(self.project_id),
            files={'file': ('formula.txt', b'=SUM(1,1) <script>alert(1)</script>')},
        )
        document = upload.json()
        input_state = self.client.get(
            '/documents/{}/requirements'.format(document['id'])
        ).json()
        run = self.client.post(
            '/documents/{}/analysis-runs'.format(document['id']),
            json={'expected_input_hash': input_state['input_hash']},
        ).json()
        csv_report = self.client.get(
            '/analysis-runs/{}/report?format=csv'.format(run['id'])
        )
        self.assertIn("'=SUM(1,1)", csv_report.text)
        html_report = self.client.get(
            '/analysis-runs/{}/report?format=html'.format(run['id'])
        )
        self.assertIn('&lt;script&gt;alert(1)&lt;/script&gt;', html_report.text)
        self.assertNotIn('<script>alert(1)</script>', html_report.text)


if __name__ == '__main__':
    unittest.main()
