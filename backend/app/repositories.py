import copy
import logging
import atexit
import threading

from pymongo import ASCENDING, MongoClient
from pymongo.errors import DuplicateKeyError, PyMongoError


logger = logging.getLogger(__name__)


class MemoryRepository:
    """Small repository implementation for isolated API tests."""

    def __init__(self):
        self.projects = {}
        self.documents = {}
        self.requirements = {}
        self.analysis_runs = {}
        self.run_requirements = {}
        self.findings = {}
        self.review_events = {}
        self.users = {}
        self.sessions = {}
        self.auth_lock = threading.RLock()

    def initialize(self):
        return None

    def close(self):
        return None

    def health(self):
        return True

    def create_project(self, project):
        self.projects[project['_id']] = copy.deepcopy(project)
        return copy.deepcopy(project)

    def list_projects(self, skip, limit, owner_id=None):
        items = sorted(
            (item for item in self.projects.values() if item.get('owner_id') == owner_id),
            key=lambda item: item['created_at'], reverse=True,
        )
        return copy.deepcopy(items[skip:skip + limit]), len(items)

    def get_project(self, project_id):
        return copy.deepcopy(self.projects.get(project_id))

    def update_project(self, project_id, name, description):
        item = self.projects.get(project_id)
        if item is None:
            return None
        item.update(name=name, description=description)
        return copy.deepcopy(item)

    def delete_project(self, project_id):
        self.projects.pop(project_id, None)

    def create_user(self, user):
        with self.auth_lock:
            if any(item['email'] == user['email'] for item in self.users.values()):
                raise DuplicateKeyError('Email already registered')
            self.users[user['_id']] = copy.deepcopy(user)

    def get_user_by_email(self, email):
        with self.auth_lock:
            return copy.deepcopy(next(
                (item for item in self.users.values() if item['email'] == email), None
            ))

    def get_user(self, user_id):
        return copy.deepcopy(self.users.get(user_id))

    def change_password(self, user_id, expected_hash, new_hash):
        with self.auth_lock:
            user = self.users.get(user_id)
            if not user or user['password_hash'] != expected_hash:
                return False
            user['password_hash'] = new_hash
            return True

    def delete_other_sessions(self, owner_id, current_id):
        for key in list(self.sessions):
            if self.sessions[key]['owner_id'] == owner_id and key != current_id:
                self.sessions.pop(key, None)

    def create_session(self, session):
        self.sessions[session['_id']] = copy.deepcopy(session)

    def get_session(self, token_hash):
        return copy.deepcopy(self.sessions.get(token_hash))

    def delete_session(self, token_hash):
        self.sessions.pop(token_hash, None)

    def expired_sessions(self, now, limit=100):
        return copy.deepcopy([
            item for item in self.sessions.values() if item['expires_at'] <= now
        ][:limit])

    def project_exists(self, project_id):
        return project_id in self.projects

    def get_document(self, document_id):
        item = self.documents.get(document_id)
        return copy.deepcopy(item) if item else None

    def list_documents(self, project_id, skip, limit):
        items = [
            item for item in self.documents.values()
            if item['project_id'] == project_id
        ]
        items.sort(key=lambda item: item['created_at'], reverse=True)
        return copy.deepcopy(items[skip:skip + limit]), len(items)

    def create_document(self, document, requirements):
        self.documents[document['_id']] = copy.deepcopy(document)
        for requirement in requirements:
            self.requirements[requirement['_id']] = copy.deepcopy(requirement)

    def document_exists(self, document_id):
        return document_id in self.documents

    def list_requirements(self, document_id, skip, limit):
        items = [
            item for item in self.requirements.values()
            if item['document_id'] == document_id and not item.get('deleted', False)
        ]
        items.sort(key=lambda item: item['sequence'])
        return copy.deepcopy(items[skip:skip + limit]), len(items)

    def all_requirements(self, document_id):
        items = [
            item for item in self.requirements.values()
            if item['document_id'] == document_id and not item.get('deleted', False)
        ]
        items.sort(key=lambda item: (item['sequence'], item['_id']))
        return copy.deepcopy(items)

    def get_requirement(self, requirement_id):
        item = self.requirements.get(requirement_id)
        if item is None or item.get('deleted', False):
            return None
        return copy.deepcopy(item)

    def update_requirement(self, requirement_id, expected_revision, text):
        item = self.requirements.get(requirement_id)
        if item is None or item.get('deleted', False):
            return None
        if item['revision'] != expected_revision:
            return None
        item['text'] = text
        item['revision'] += 1
        return copy.deepcopy(item)

    def add_requirement(self, document_id, requirement):
        current = [
            item['sequence'] for item in self.requirements.values()
            if item['document_id'] == document_id
        ]
        requirement['sequence'] = max(current, default=0) + 1
        self.requirements[requirement['_id']] = copy.deepcopy(requirement)
        return copy.deepcopy(requirement)

    def soft_delete_requirement(self, requirement_id, expected_revision):
        item = self.requirements.get(requirement_id)
        if item is None or item.get('deleted', False) or item['revision'] != expected_revision:
            return None
        item['deleted'] = True
        item['revision'] += 1
        return copy.deepcopy(item)

    def delete_requirements(self, requirement_ids):
        for requirement_id in requirement_ids:
            self.requirements.pop(requirement_id, None)

    def create_analysis_run(self, run, findings, requirements):
        self.analysis_runs[run['_id']] = copy.deepcopy(run)
        for requirement in requirements:
            snapshot = copy.deepcopy(requirement)
            snapshot['_run_id'] = run['_id']
            self.run_requirements[(run['_id'], snapshot['_id'])] = snapshot
        for finding in findings:
            self.findings[finding['_id']] = copy.deepcopy(finding)

    def get_analysis_run(self, run_id):
        item = self.analysis_runs.get(run_id)
        return copy.deepcopy(item) if item else None

    def list_analysis_runs(self, document_id, skip, limit):
        items = [item for item in self.analysis_runs.values()
                 if item['document_id'] == document_id]
        items.sort(key=lambda item: item['created_at'], reverse=True)
        return copy.deepcopy(items[skip:skip + limit]), len(items)

    def list_run_requirements(self, run_id):
        items = [item for item in self.run_requirements.values()
                 if item['_run_id'] == run_id]
        items.sort(key=lambda item: (item['sequence'], item['_id']))
        items = copy.deepcopy(items)
        for item in items:
            item.pop('_run_id', None)
        return items

    def list_findings(self, run_id, kind, skip, limit):
        items = [item for item in self.findings.values()
                 if item['run_id'] == run_id and (kind is None or item['kind'] == kind)]
        items.sort(key=lambda item: (item.get('sequence', 0), item['_id']))
        return copy.deepcopy(items[skip:skip + limit]), len(items)

    def get_finding(self, finding_id):
        item = self.findings.get(finding_id)
        return copy.deepcopy(item) if item else None

    def create_review_event(self, event):
        self.review_events[event['_id']] = copy.deepcopy(event)
        return copy.deepcopy(event)

    def latest_reviews(self, run_id):
        events = [item for item in self.review_events.values() if item['run_id'] == run_id]
        events.sort(key=lambda item: (item['created_at'], item['_id']), reverse=True)
        latest = {}
        for event in events:
            latest.setdefault(event['finding_id'], event)
        return copy.deepcopy(latest)

    def list_review_events(self, run_id):
        events = [item for item in self.review_events.values() if item['run_id'] == run_id]
        events.sort(key=lambda item: (item['created_at'], item['_id']))
        return copy.deepcopy(events)

    def delete_document_data(self, document_id):
        document = self.documents.pop(document_id, None)
        requirement_ids = {
            item['_id'] for item in self.requirements.values()
            if item['document_id'] == document_id
        }
        for requirement_id in requirement_ids:
            self.requirements.pop(requirement_id, None)
        run_ids = {
            item['_id'] for item in self.analysis_runs.values()
            if item['document_id'] == document_id
        }
        for run_id in run_ids:
            self.analysis_runs.pop(run_id, None)
            for key in [key for key in self.run_requirements if key[0] == run_id]:
                self.run_requirements.pop(key, None)
            for finding_id in [
                key for key, item in self.findings.items() if item['run_id'] == run_id
            ]:
                self.findings.pop(finding_id, None)
            for event_id in [
                key for key, item in self.review_events.items() if item['run_id'] == run_id
            ]:
                self.review_events.pop(event_id, None)
        return copy.deepcopy(document)


class MongoRepository:
    def __init__(self, uri, database_name):
        self.client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        atexit.register(self.client.close)
        self.db = self.client[database_name]

    def initialize(self):
        self.client.admin.command('ping')
        self.db.users.create_index([('email', ASCENDING)], unique=True)
        self.db.sessions.create_index([('expires_at', ASCENDING)])
        self.db.projects.create_index([('owner_id', ASCENDING), ('created_at', ASCENDING)])
        self.db.documents.create_index([('project_id', ASCENDING), ('created_at', ASCENDING)])
        self.db.requirements.create_index(
            [('document_id', ASCENDING), ('document_version', ASCENDING), ('sequence', ASCENDING)],
            unique=True,
        )
        self.db.analysis_runs.create_index([('document_id', ASCENDING), ('created_at', ASCENDING)])
        self.db.run_requirements.create_index([('_run_id', ASCENDING), ('sequence', ASCENDING)])
        self.db.findings.create_index([('run_id', ASCENDING), ('kind', ASCENDING), ('sequence', ASCENDING)])
        self.db.review_events.create_index([('run_id', ASCENDING), ('finding_id', ASCENDING), ('created_at', ASCENDING)])

    def close(self):
        self.client.close()

    def health(self):
        self.client.admin.command('ping')
        return True

    def create_project(self, project):
        self.db.projects.insert_one(project)
        return project

    def list_projects(self, skip, limit, owner_id=None):
        query = {'owner_id': owner_id} if owner_id else {'owner_id': {'$exists': False}}
        items = list(self.db.projects.find(query, {'_id': 1, 'name': 1, 'description': 1, 'created_at': 1, 'owner_id': 1})
                     .sort('created_at', -1).skip(skip).limit(limit))
        return items, self.db.projects.count_documents(query)

    def get_project(self, project_id):
        return self.db.projects.find_one({'_id': project_id})

    def update_project(self, project_id, name, description):
        return self.db.projects.find_one_and_update(
            {'_id': project_id}, {'$set': {'name': name, 'description': description}},
            return_document=True,
        )

    def delete_project(self, project_id):
        self.db.projects.delete_one({'_id': project_id})

    def create_user(self, user):
        self.db.users.insert_one(user)

    def get_user_by_email(self, email):
        return self.db.users.find_one({'email': email})

    def get_user(self, user_id):
        return self.db.users.find_one({'_id': user_id})

    def change_password(self, user_id, expected_hash, new_hash):
        return self.db.users.update_one(
            {'_id': user_id, 'password_hash': expected_hash},
            {'$set': {'password_hash': new_hash}},
        ).modified_count == 1

    def delete_other_sessions(self, owner_id, current_id):
        self.db.sessions.delete_many({'owner_id': owner_id, '_id': {'$ne': current_id}})

    def create_session(self, session):
        self.db.sessions.insert_one(session)

    def get_session(self, token_hash):
        return self.db.sessions.find_one({'_id': token_hash})

    def delete_session(self, token_hash):
        self.db.sessions.delete_one({'_id': token_hash})

    def expired_sessions(self, now, limit=100):
        return list(self.db.sessions.find({'expires_at': {'$lte': now}})
                    .sort('expires_at', 1).limit(limit))

    def project_exists(self, project_id):
        return self.db.projects.find_one({'_id': project_id}, {'_id': 1}) is not None

    def get_document(self, document_id):
        return self.db.documents.find_one({'_id': document_id})

    def list_documents(self, project_id, skip, limit):
        query = {'project_id': project_id}
        projection = {'_id': 1, 'project_id': 1, 'original_name': 1, 'sha256': 1,
                      'format': 1, 'version': 1, 'extraction_status': 1,
                      'page_count': 1, 'created_at': 1}
        items = list(self.db.documents.find(query, projection)
                     .sort('created_at', -1).skip(skip).limit(limit))
        return items, self.db.documents.count_documents(query)

    def create_document(self, document, requirements):
        try:
            self.db.documents.insert_one(document)
            if requirements:
                self.db.requirements.insert_many(requirements, ordered=True)
        except PyMongoError:
            try:
                self.db.requirements.delete_many({'document_id': document['_id']})
                self.db.documents.delete_one({'_id': document['_id']})
            except PyMongoError:
                logger.exception('Could not roll back a partially stored document')
            logger.exception('Could not persist uploaded document and extracted requirements')
            raise

    def document_exists(self, document_id):
        return self.db.documents.find_one({'_id': document_id}, {'_id': 1}) is not None

    def list_requirements(self, document_id, skip, limit):
        query = {'document_id': document_id, 'deleted': {'$ne': True}}
        items = list(self.db.requirements.find(query, {'_id': 1, 'document_id': 1,
                                                       'document_version': 1, 'sequence': 1,
                                                       'text': 1, 'source_text': 1,
                                                       'location': 1, 'revision': 1})
                     .sort('sequence', 1).skip(skip).limit(limit))
        return items, self.db.requirements.count_documents(query)

    def all_requirements(self, document_id):
        query = {'document_id': document_id, 'deleted': {'$ne': True}}
        return list(self.db.requirements.find(query).sort([('sequence', 1), ('_id', 1)]))

    def get_requirement(self, requirement_id):
        return self.db.requirements.find_one({'_id': requirement_id, 'deleted': {'$ne': True}})

    def update_requirement(self, requirement_id, expected_revision, text):
        return self.db.requirements.find_one_and_update(
            {'_id': requirement_id, 'revision': expected_revision, 'deleted': {'$ne': True}},
            {'$set': {'text': text}, '$inc': {'revision': 1}},
            return_document=True,
        )

    def add_requirement(self, document_id, requirement):
        latest = self.db.requirements.find_one(
            {'document_id': document_id}, sort=[('sequence', -1)]
        )
        requirement['sequence'] = (latest['sequence'] if latest else 0) + 1
        self.db.requirements.insert_one(requirement)
        return requirement

    def soft_delete_requirement(self, requirement_id, expected_revision):
        return self.db.requirements.find_one_and_update(
            {'_id': requirement_id, 'revision': expected_revision, 'deleted': {'$ne': True}},
            {'$set': {'deleted': True}, '$inc': {'revision': 1}},
            return_document=True,
        )

    def delete_requirements(self, requirement_ids):
        if requirement_ids:
            self.db.requirements.delete_many({'_id': {'$in': list(requirement_ids)}})

    def create_analysis_run(self, run, findings, requirements):
        try:
            self.db.analysis_runs.insert_one(run)
            if requirements:
                snapshots = [
                    dict(item, _id='{}:{}'.format(run['_id'], item['_id']),
                         _requirement_id=item['_id'], _run_id=run['_id'])
                    for item in requirements
                ]
                self.db.run_requirements.insert_many(snapshots, ordered=True)
            for start in range(0, len(findings), 1000):
                self.db.findings.insert_many(findings[start:start + 1000], ordered=True)
        except PyMongoError:
            try:
                self.db.run_requirements.delete_many({'_run_id': run['_id']})
                self.db.findings.delete_many({'run_id': run['_id']})
                self.db.analysis_runs.delete_one({'_id': run['_id']})
            except PyMongoError:
                logger.exception('Could not roll back a partially stored analysis run')
            logger.exception('Could not persist analysis run findings')
            raise

    def get_analysis_run(self, run_id):
        return self.db.analysis_runs.find_one({'_id': run_id})

    def list_analysis_runs(self, document_id, skip, limit):
        query = {'document_id': document_id}
        items = list(self.db.analysis_runs.find(query).sort('created_at', -1).skip(skip).limit(limit))
        return items, self.db.analysis_runs.count_documents(query)

    def list_run_requirements(self, run_id):
        items = list(self.db.run_requirements.find({'_run_id': run_id})
                     .sort([('sequence', 1), ('_id', 1)]))
        for item in items:
            item.pop('_run_id', None)
            item['_id'] = item.pop('_requirement_id', item['_id'])
        return items

    def list_findings(self, run_id, kind, skip, limit):
        query = {'run_id': run_id}
        if kind is not None:
            query['kind'] = kind
        items = list(self.db.findings.find(query).sort([('sequence', 1), ('_id', 1)])
                     .skip(skip).limit(limit))
        return items, self.db.findings.count_documents(query)

    def get_finding(self, finding_id):
        return self.db.findings.find_one({'_id': finding_id})

    def create_review_event(self, event):
        self.db.review_events.insert_one(event)
        return event

    def latest_reviews(self, run_id):
        events = self.db.review_events.find({'run_id': run_id}).sort(
            [('created_at', -1), ('_id', -1)]
        )
        latest = {}
        for event in events:
            latest.setdefault(event['finding_id'], event)
        return latest

    def list_review_events(self, run_id):
        return list(self.db.review_events.find({'run_id': run_id}).sort(
            [('created_at', 1), ('_id', 1)]
        ))

    def delete_document_data(self, document_id):
        document = self.db.documents.find_one({'_id': document_id})
        if document is None:
            return None
        runs = self.db.analysis_runs.find({'document_id': document_id}, {'_id': 1})
        run_ids = [item['_id'] for item in runs]
        if run_ids:
            self.db.run_requirements.delete_many({'_run_id': {'$in': run_ids}})
            self.db.review_events.delete_many({'run_id': {'$in': run_ids}})
            self.db.findings.delete_many({'run_id': {'$in': run_ids}})
        self.db.analysis_runs.delete_many({'document_id': document_id})
        self.db.requirements.delete_many({'document_id': document_id})
        self.db.documents.delete_one({'_id': document_id})
        return document
