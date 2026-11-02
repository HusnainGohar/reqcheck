import os
import tempfile
import unittest
import uuid
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.auth import COOKIE
from backend.app.analysis import AnalysisEngine
from backend.app.main import create_app
from backend.app.repositories import MongoRepository


@unittest.skipUnless(
    os.environ.get('REQCHECK_MONGO_TEST_URI'),
    'Set REQCHECK_MONGO_TEST_URI to explicitly enable isolated MongoDB integration tests.',
)
class MongoIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.uri = os.environ['REQCHECK_MONGO_TEST_URI']
        self.database_name = 'reqcheck_test_' + uuid.uuid4().hex
        self.repository = MongoRepository(self.uri, self.database_name)
        self.temp_dir = tempfile.TemporaryDirectory()
        self.engine = AnalysisEngine.from_artifacts()
        self.client = TestClient(create_app(
            repository=self.repository,
            storage_dir=Path(self.temp_dir.name),
            analysis_engine=self.engine,
        ))
        self.client.__enter__()
        session = self.client.post('/auth/guest', json={'acknowledge_temporary': True})
        self.assertEqual(session.status_code, 201, session.text)
        self.client.headers.update({'X-CSRF-Token': session.json()['csrf_token']})

    def tearDown(self):
        self.client.__exit__(None, None, None)
        cleanup = MongoRepository(self.uri, self.database_name)
        try:
            self.assertTrue(self.database_name.startswith('reqcheck_test_'))
            cleanup.client.drop_database(self.database_name)
        finally:
            cleanup.close()
            self.temp_dir.cleanup()

    def run_analysis(self, document_id):
        requirements = self.client.get('/documents/{}/requirements'.format(document_id))
        self.assertEqual(requirements.status_code, 200, requirements.text)
        response = self.client.post(
            '/documents/{}/analysis-runs'.format(document_id),
            json={'expected_input_hash': requirements.json()['input_hash']},
        )
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()['status'], 'complete')
        return response.json()

    def test_account_sessions_and_owned_progress_survive_app_reconnection(self):
        credentials = {'email': 'persistent@example.org', 'password': 'A long integration test password'}
        registered = self.client.post('/auth/register', json=dict(
            credentials, name='Persistent Reviewer', confirm_password=credentials['password']
        ))
        self.assertEqual(registered.status_code, 201, registered.text)
        identity = registered.json()
        self.client.headers.update({'X-CSRF-Token': identity['csrf_token']})
        cookie = self.client.cookies.get(COOKIE)
        project = self.client.post('/projects', json={'name': 'Saved account'}).json()
        uploaded = self.client.post(
            '/projects/{}/documents'.format(project['id']),
            files={'file': ('account.txt', b'The system shall respond quickly.')},
        )
        self.assertEqual(uploaded.status_code, 201, uploaded.text)
        document = uploaded.json()
        run = self.run_analysis(document['id'])
        finding = self.client.get('/analysis-runs/{}/findings'.format(run['id'])).json()['items'][0]
        reviewed = self.client.post('/findings/{}/reviews'.format(finding['id']), json={
            'decision': 'accept', 'comment': 'Saved across application reconnection',
        })
        self.assertEqual(reviewed.status_code, 201, reviewed.text)

        reconnected = MongoRepository(self.uri, self.database_name)
        with TestClient(create_app(reconnected, Path(self.temp_dir.name), self.engine)) as resumed:
            resumed.cookies.set(COOKIE, cookie)
            resumed.headers.update({'X-CSRF-Token': identity['csrf_token']})
            self.assertEqual(resumed.get('/auth/session').json()['owner_id'], identity['owner_id'])
            self.assertEqual(resumed.get('/auth/session').json()['name'], 'Persistent Reviewer')
            self.assertEqual(resumed.get('/projects').json()['items'][0]['id'], project['id'])
            report = resumed.get('/analysis-runs/{}/report?format=json'.format(run['id']))
            self.assertEqual(report.status_code, 200, report.text)
            self.assertIn('Saved across application reconnection', report.text)
            self.assertEqual(resumed.post('/auth/logout', json={}).status_code, 200)
            resumed.cookies.clear()
            resumed.headers.pop('X-CSRF-Token')
            login = resumed.post('/auth/login', json=credentials)
            self.assertEqual(login.status_code, 201, login.text)
            self.assertEqual(resumed.get('/projects').json()['total'], 1)
            requirement = resumed.get('/documents/{}/requirements'.format(document['id'])).json()['items'][0]
            self.assertEqual(requirement['text'], 'The system shall respond quickly.')
            resumed.headers.update({'X-CSRF-Token': login.json()['csrf_token']})
            changed = resumed.post('/auth/change-password', json={
                'current_password': credentials['password'],
                'password': 'A changed integration test password',
                'confirm_password': 'A changed integration test password',
            })
            self.assertEqual(changed.status_code, 200, changed.text)
            resumed.cookies.clear()
            resumed.headers.pop('X-CSRF-Token')
            credentials['password'] = 'A changed integration test password'
            self.assertEqual(resumed.post('/auth/login', json=credentials).status_code, 201)
        self.assertEqual(self.client.get('/projects').status_code, 401)

    def test_real_models_multiple_runs_reviews_exports_and_reconnection(self):
        health = self.client.get('/health')
        self.assertEqual(health.status_code, 200, health.text)
        project = self.client.post('/projects', json={'name': 'Real model integration'})
        self.assertEqual(project.status_code, 201, project.text)
        uploaded = self.client.post(
            '/projects/{}/documents'.format(project.json()['id']),
            files={'file': ('requirements.txt', b'The system shall respond quickly.')},
        )
        self.assertEqual(uploaded.status_code, 201, uploaded.text)
        document = uploaded.json()
        requirement = document['requirements'][0]
        for text in (
            'The system shall respond quickly.',
            'The system shall allow users to create an account.',
            'The service shall maintain 99.9 percent availability.',
        ):
            added = self.client.post(
                '/documents/{}/requirements'.format(document['id']),
                json={'text': text},
            )
            self.assertEqual(added.status_code, 201, added.text)

        first = self.run_analysis(document['id'])
        second = self.run_analysis(document['id'])
        first_snapshots = self.repository.list_run_requirements(first['id'])
        second_snapshots = self.repository.list_run_requirements(second['id'])
        self.assertEqual(len(first_snapshots), 4)
        self.assertEqual(first_snapshots, second_snapshots)
        self.assertEqual(first_snapshots[0]['_id'], requirement['id'])
        snapshot_response = self.client.get(
            '/analysis-runs/{}/requirements'.format(first['id'])
        )
        self.assertEqual(snapshot_response.status_code, 200, snapshot_response.text)
        self.assertEqual(snapshot_response.json()['items'][0]['id'], requirement['id'])
        findings = self.client.get('/analysis-runs/{}/findings'.format(first['id']))
        self.assertEqual(findings.status_code, 200, findings.text)
        kinds = {item['kind'] for item in findings.json()['items']}
        self.assertEqual(kinds, {'classification', 'ambiguity', 'duplicate'})
        ambiguity = next(
            item for item in findings.json()['items'] if item['kind'] == 'ambiguity'
        )
        for payload in (
            {'decision': 'accept', 'comment': 'Initial review'},
            {'decision': 'correct', 'corrected_text': 'Respond within two seconds.',
             'comment': 'Use a measurable acceptance threshold.'},
        ):
            reviewed = self.client.post(
                '/findings/{}/reviews'.format(ambiguity['id']), json=payload
            )
            self.assertEqual(reviewed.status_code, 201, reviewed.text)

        edited = self.client.patch('/requirements/{}'.format(requirement['id']), json={
            'expected_revision': requirement['revision'],
            'text': 'The system shall respond within two seconds.',
        })
        self.assertEqual(edited.status_code, 200, edited.text)
        third = self.run_analysis(document['id'])
        self.assertNotEqual(third['input_revision_hash'], first['input_revision_hash'])
        runs = self.client.get('/documents/{}/analysis-runs'.format(document['id']))
        self.assertEqual(runs.json()['total'], 3)
        self.assertTrue(next(
            item['stale'] for item in runs.json()['items'] if item['id'] == first['id']
        ))

        for format in ('json', 'csv', 'html'):
            report = self.client.get(
                '/analysis-runs/{}/report?format={}'.format(first['id'], format)
            )
            self.assertEqual(report.status_code, 200, report.text)
            self.assertIn('The system shall respond quickly.', report.text)
            self.assertIn('Use a measurable acceptance threshold.', report.text)
            if format == 'json':
                self.assertTrue(report.json()['stale'])
            if format == 'html':
                self.assertIn('data:image/png;base64,', report.text)
        for kind in ('classification', 'nfr', 'review', 'flags'):
            chart = self.client.get(
                '/analysis-runs/{}/charts/{}.png'.format(first['id'], kind)
            )
            self.assertEqual(chart.status_code, 200)
            self.assertTrue(chart.content.startswith(b'\x89PNG\r\n\x1a\n'))

        reconnected = MongoRepository(self.uri, self.database_name)
        try:
            reconnected.initialize()
            self.assertEqual(
                reconnected.get_requirement(requirement['id'])['text'],
                'The system shall respond within two seconds.',
            )
            self.assertEqual(len(reconnected.list_review_events(first['id'])), 2)
            self.assertEqual(
                reconnected.latest_reviews(first['id'])[ambiguity['id']]['decision'],
                'correct',
            )
            self.assertEqual(len(reconnected.list_run_requirements(first['id'])), 4)
        finally:
            reconnected.close()

        deleted = self.client.delete(
            '/documents/{}?confirm_name=requirements.txt'.format(document['id'])
        )
        self.assertEqual(deleted.status_code, 204, deleted.text)
        for collection in ('documents', 'requirements', 'analysis_runs',
                           'run_requirements', 'findings', 'review_events'):
            self.assertEqual(self.repository.db[collection].count_documents({}), 0)
        self.assertEqual(list(Path(self.temp_dir.name).iterdir()), [])
