import tempfile
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from fastapi import HTTPException

from backend.app.auth import COOKIE, now, password_matches
from backend.app.main import create_app
from backend.app.repositories import MemoryRepository
from backend.tests.test_upload_api import TestAnalysisEngine


class AuthApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = MemoryRepository()
        self.app = create_app(self.repo, Path(self.temp.name), TestAnalysisEngine())
        self.client = TestClient(self.app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.temp.cleanup()

    def identity(self, kind, email='reviewer@example.org'):
        self.client.cookies.clear()
        self.client.headers.pop('X-CSRF-Token', None)
        payload = {'acknowledge_temporary': True} if kind == 'guest' else {
            'email': email, 'password': 'correct horse battery staple',
        }
        if kind == 'register':
            payload.update(name='Test Reviewer', confirm_password=payload['password'])
        response = self.client.post('/auth/' + kind, json=payload)
        self.assertEqual(response.status_code, 201, response.text)
        return {
            'Cookie': '{}={}'.format(COOKIE, self.client.cookies.get(COOKIE)),
            'X-CSRF-Token': response.json()['csrf_token'],
        }, response.json()

    def workflow(self, headers):
        project = self.client.post('/projects', headers=headers, json={'name': 'Private project'}).json()
        document = self.client.post(
            '/projects/{}/documents'.format(project['id']), headers=headers,
            files={'file': ('private.txt', b'The system shall respond quickly.')},
        ).json()
        requirement = document['requirements'][0]
        state = self.client.get('/documents/{}/requirements'.format(document['id']), headers=headers).json()
        run = self.client.post(
            '/documents/{}/analysis-runs'.format(document['id']), headers=headers,
            json={'expected_input_hash': state['input_hash']},
        ).json()
        findings = self.client.get('/analysis-runs/{}/findings'.format(run['id']), headers=headers).json()
        return project, document, requirement, run, findings['items'][0]

    def test_passwords_registration_session_cookie_and_logout_persistence(self):
        headers, session = self.identity('register', 'Owner@Example.org')
        user = self.repo.get_user(session['owner_id'])
        self.assertEqual(user['email'], 'owner@example.org')
        self.assertEqual(session['name'], 'Test Reviewer')
        self.assertEqual(user['name'], 'Test Reviewer')
        self.assertNotIn('confirm_password', user)
        self.assertNotIn('password', user)
        self.assertTrue(password_matches('correct horse battery staple', user['password_hash']))
        self.assertTrue(user['password_hash'].startswith('600000$'))
        self.assertNotIn('password_hash', session)
        cookie_response = self.client.get('/auth/session', headers=headers)
        self.assertTrue(cookie_response.json()['authenticated'])
        project, document, requirement, run, _ = self.workflow(headers)
        self.assertEqual(self.repo.get_project(project['id'])['owner_id'], session['owner_id'])
        self.assertEqual(self.repo.get_document(document['id'])['owner_id'], session['owner_id'])
        self.assertEqual(self.repo.get_requirement(requirement['id'])['owner_id'], session['owner_id'])
        self.assertEqual(self.repo.get_analysis_run(run['id'])['owner_id'], session['owner_id'])
        logout = self.client.post('/auth/logout', headers=headers, json={})
        self.assertEqual(logout.status_code, 200, logout.text)
        self.assertEqual(self.client.get('/projects', headers=headers).status_code, 401)
        login_headers, _ = self.identity('login', 'owner@example.org')
        self.assertEqual(self.client.get('/projects', headers=login_headers).json()['total'], 1)
        self.assertEqual(self.client.get(
            '/analysis-runs/{}/report?format=json'.format(run['id']), headers=login_headers
        ).status_code, 200)
        self.assertEqual(self.client.get('/projects', headers=headers).status_code, 401)
        self.client.cookies.clear()
        duplicate = self.client.post('/auth/register', json={
            'email': 'OWNER@example.org', 'password': 'different long password',
            'name': 'Another Reviewer', 'confirm_password': 'different long password',
        })
        self.assertEqual(duplicate.status_code, 409)
        bad = self.client.post('/auth/login', json={
            'email': 'owner@example.org', 'password': 'incorrect long password',
        })
        self.assertEqual(bad.status_code, 401)
        bad_unknown = self.client.post('/auth/login', json={
            'email': 'unknown@example.org', 'password': 'incorrect long password',
        })
        self.assertEqual(bad_unknown.json(), bad.json())

    def test_every_resource_surface_enforces_ownership_and_legacy_is_hidden(self):
        owner, _ = self.identity('register')
        project, document, requirement, run, finding = self.workflow(owner)
        other, _ = self.identity('register', 'other@example.org')
        self.repo.create_project({
            '_id': 'legacy', 'name': 'Old demo', 'description': '', 'created_at': now().isoformat(),
        })
        self.assertEqual(self.client.get('/projects', headers=other).json()['total'], 0)
        self.assertEqual(self.client.get('/projects/legacy/documents', headers=owner).status_code, 404)
        routes = [
            ('GET', '/projects/{}/documents'.format(project['id']), None),
            ('PATCH', '/projects/{}'.format(project['id']), {'name': 'Stolen'}),
            ('DELETE', '/projects/{}?confirm_name=Private%20project'.format(project['id']), None),
            ('POST', '/projects/{}/documents'.format(project['id']), None),
            ('GET', '/documents/{}/requirements'.format(document['id']), None),
            ('POST', '/documents/{}/requirements'.format(document['id']), {'text': 'Stolen'}),
            ('DELETE', '/documents/{}?confirm_name=private.txt'.format(document['id']), None),
            ('GET', '/documents/{}/analysis-runs'.format(document['id']), None),
            ('POST', '/documents/{}/analysis-runs'.format(document['id']), {'expected_input_hash': 'a' * 64}),
            ('PATCH', '/requirements/{}'.format(requirement['id']), {'text': 'Stolen', 'expected_revision': 1}),
            ('DELETE', '/requirements/{}'.format(requirement['id']), {'expected_revision': 1}),
            ('POST', '/requirements/{}/split'.format(requirement['id']), {'expected_revision': 1, 'texts': ['a', 'b']}),
            ('POST', '/requirements/{}/merge'.format(requirement['id']), {}),
            ('GET', '/analysis-runs/{}/requirements'.format(run['id']), None),
            ('GET', '/analysis-runs/{}/findings'.format(run['id']), None),
            ('GET', '/analysis-runs/{}/reviews'.format(run['id']), None),
            ('GET', '/findings/{}/reviews'.format(finding['id']), None),
            ('POST', '/findings/{}/reviews'.format(finding['id']), {'decision': 'accept'}),
        ]
        routes.extend(
            ('GET', '/analysis-runs/{}/report?format={}'.format(run['id'], format), None)
            for format in ('html', 'csv', 'json')
        )
        routes.extend(
            ('GET', '/analysis-runs/{}/charts/{}.png'.format(run['id'], kind), None)
            for kind in ('classification', 'nfr', 'review', 'flags')
        )
        for method, path, payload in routes:
            with self.subTest(method=method, path=path):
                response = self.client.request(method, path, headers=other, json=payload)
                self.assertEqual(response.status_code, 404, response.text)
        other_project, _, other_requirement, _, _ = self.workflow(other)
        merge = self.client.post('/requirements/{}/merge'.format(requirement['id']), headers=owner, json={
            'other_requirement_id': other_requirement['id'], 'expected_revision': 1, 'other_expected_revision': 1,
        })
        self.assertEqual(merge.status_code, 404)
        self.assertIsNotNone(self.repo.get_project(other_project['id']))
        self.assertEqual(self.repo.get_requirement(requirement['id'])['text'], requirement['text'])

    def test_signup_requires_name_and_matching_confirmation(self):
        payload = {'email': 'new@example.org', 'password': 'correct horse battery staple'}
        for extra in (
            {},
            {'name': ' ', 'confirm_password': payload['password']},
            {'name': 'Reviewer', 'confirm_password': 'not matching password'},
        ):
            response = self.client.post('/auth/register', json=dict(payload, **extra))
            self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(self.repo.users, {})
        self.assertEqual(self.repo.sessions, {})

    def test_change_password_verifies_current_and_revokes_other_sessions(self):
        first, identity = self.identity('register')
        second, _ = self.identity('login')
        payload = {
            'current_password': 'incorrect current password',
            'password': 'a different long password',
            'confirm_password': 'a different long password',
        }
        self.assertEqual(self.client.post('/auth/change-password', headers=first, json=payload).status_code, 400)
        payload['current_password'] = 'correct horse battery staple'
        payload['confirm_password'] = 'mismatched long password'
        self.assertEqual(self.client.post('/auth/change-password', headers=first, json=payload).status_code, 422)
        payload['confirm_password'] = payload['password']
        self.client.cookies.clear()
        no_csrf = {'Cookie': first['Cookie']}
        self.assertEqual(self.client.post('/auth/change-password', headers=no_csrf, json=payload).status_code, 403)
        response = self.client.post('/auth/change-password', headers=first, json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.client.get('/projects', headers=first).status_code, 200)
        self.assertEqual(self.client.get('/projects', headers=second).status_code, 401)
        user = self.repo.get_user(identity['owner_id'])
        self.assertTrue(password_matches(payload['password'], user['password_hash']))
        self.assertFalse(password_matches(payload['current_password'], user['password_hash']))
        self.client.cookies.clear()
        old_login = self.client.post('/auth/login', json={
            'email': user['email'], 'password': payload['current_password'],
        })
        self.assertEqual(old_login.status_code, 401)
        new_login = self.client.post('/auth/login', json={
            'email': user['email'], 'password': payload['password'],
        })
        self.assertEqual(new_login.status_code, 201, new_login.text)
        guest, _ = self.identity('guest')
        self.assertEqual(self.client.post('/auth/change-password', headers=guest, json=payload).status_code, 403)

    def test_guest_acknowledgement_isolation_logout_and_expiry_delete_all_data(self):
        response = self.client.post('/auth/guest', json={'acknowledge_temporary': False})
        self.assertEqual(response.status_code, 422)
        guest, session = self.identity('guest')
        project, document, _, run, finding = self.workflow(guest)
        review = self.client.post('/findings/{}/reviews'.format(finding['id']), headers=guest, json={'decision': 'accept'})
        self.assertEqual(review.status_code, 201)
        upload = Path(self.repo.get_document(document['id'])['stored_path'])
        self.assertTrue(upload.exists())
        self.assertEqual(self.client.get('/analysis-runs/{}/report?format=csv'.format(run['id']), headers=guest).status_code, 200)
        logout = self.client.post('/auth/logout', headers=guest, json={})
        self.assertEqual(logout.status_code, 200, logout.text)
        self.assertFalse(upload.exists())
        for collection in ('projects', 'documents', 'requirements', 'analysis_runs', 'run_requirements', 'findings', 'review_events'):
            self.assertEqual(getattr(self.repo, collection), {})
        self.assertEqual(self.client.get('/projects', headers=guest).status_code, 401)
        second, _ = self.identity('guest')
        _, expired_document, _, _, _ = self.workflow(second)
        expired_upload = Path(self.repo.get_document(expired_document['id'])['stored_path'])
        for stored in self.repo.sessions.values():
            stored['expires_at'] = (now() - timedelta(seconds=1)).isoformat()
        self.assertEqual(self.client.get('/projects', headers=second).status_code, 401)
        self.app.state.auth.cleanup_expired()
        self.assertFalse(expired_upload.exists())
        self.assertEqual(self.repo.projects, {})
        self.assertEqual(self.repo.sessions, {})
        self.assertEqual(list(Path(self.temp.name).iterdir()), [])

    def test_guest_cleanup_failure_preserves_identity_for_retry(self):
        headers, _ = self.identity('guest')
        project, document, _, _, _ = self.workflow(headers)
        upload = Path(self.repo.get_document(document['id'])['stored_path'])
        with patch('backend.app.auth.Path.unlink', side_effect=PermissionError('Locked test upload')):
            with self.assertLogs('backend.app.auth', level='ERROR'):
                response = self.client.post('/auth/logout', headers=headers, json={})
            self.assertEqual(response.status_code, 503, response.text)
            self.assertEqual(len(self.repo.sessions), 1)
            self.assertIsNotNone(self.repo.get_project(project['id']))
            self.assertTrue(upload.exists())
            for session in self.repo.sessions.values():
                session['expires_at'] = (now() - timedelta(seconds=1)).isoformat()
            with self.assertLogs('backend.app.auth', level='ERROR'):
                with self.assertRaises(HTTPException):
                    self.app.state.auth.cleanup_expired()
            self.assertEqual(len(self.repo.sessions), 1)
        self.app.state.auth.cleanup_expired()
        self.assertEqual(self.repo.sessions, {})
        self.assertEqual(self.repo.projects, {})
        self.assertFalse(upload.exists())

    def test_csrf_cookie_properties_cors_rate_limits_and_account_expiry(self):
        self.assertEqual(self.client.get('/projects').status_code, 401)
        self.assertEqual(self.client.get('/health').status_code, 200)
        response = self.client.post('/auth/register', json={
            'email': 'owner@example.org', 'password': 'correct horse battery staple',
            'name': 'Owner', 'confirm_password': 'correct horse battery staple',
        })
        cookie = response.headers['set-cookie']
        self.assertIn('HttpOnly', cookie)
        self.assertIn('SameSite=strict', cookie)
        self.assertNotIn('Max-Age', cookie)
        token = self.client.cookies.get(COOKIE)
        headers = {'Cookie': '{}={}'.format(COOKIE, token), 'X-CSRF-Token': response.json()['csrf_token']}
        missing_csrf = self.client.post('/projects', json={'name': 'No CSRF'})
        self.assertEqual(missing_csrf.status_code, 403)
        invalid_csrf = self.client.post('/projects', headers=dict(headers, **{'X-CSRF-Token': '\u00e9'}), json={'name': 'Invalid CSRF'})
        self.assertEqual(invalid_csrf.status_code, 403)
        forged = self.client.post('/projects', headers=dict(headers, Origin='https://evil.example'), json={'name': 'Forged'})
        self.assertEqual(forged.status_code, 403)
        cors = self.client.get('/projects', headers=dict(headers, Origin='http://127.0.0.1:3000'))
        self.assertEqual(cors.headers['access-control-allow-credentials'], 'true')
        project, _, _, _, _ = self.workflow(headers)
        for session in self.repo.sessions.values():
            session['expires_at'] = (now() - timedelta(seconds=1)).isoformat()
        self.assertEqual(self.client.get('/projects', headers=headers).status_code, 401)
        self.app.state.auth.cleanup_expired()
        self.assertIsNotNone(self.repo.get_project(project['id']))
        self.client.cookies.clear()
        self.app.state.auth.attempts.clear()
        with patch('backend.app.auth.password_matches', return_value=False):
            for _ in range(10):
                self.assertEqual(self.client.post('/auth/login', json={
                    'email': 'owner@example.org', 'password': 'invalid long password',
                }).status_code, 401)
            self.assertEqual(self.client.post('/auth/login', json={
                'email': 'owner@example.org', 'password': 'invalid long password',
            }).status_code, 429)
