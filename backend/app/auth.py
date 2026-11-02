import asyncio
import hashlib
import hmac
import logging
import os
import re
import secrets
import threading
import time
import uuid
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, constr, validator
from pymongo.errors import DuplicateKeyError, PyMongoError
from starlette.concurrency import run_in_threadpool


logger = logging.getLogger(__name__)
ORIGINS = ('http://127.0.0.1:3000', 'http://localhost:3000')
COOKIE = 'reqcheck_session'
ITERATIONS = 600000
SESSION_HOURS = 24


def now():
    return datetime.now(timezone.utc)


def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        'sha256', password.encode('utf-8'), bytes.fromhex(salt), ITERATIONS
    ).hex()
    return '{}${}${}'.format(ITERATIONS, salt, digest)


def password_matches(password, encoded):
    iterations, salt, expected = encoded.split('$')
    calculated = hashlib.pbkdf2_hmac(
        'sha256', password.encode('utf-8'), bytes.fromhex(salt), int(iterations)
    ).hex()
    return hmac.compare_digest(calculated, expected)


class Credentials(BaseModel):
    email: constr(strip_whitespace=True, min_length=3, max_length=254)
    password: constr(min_length=12, max_length=128)

    @validator('email')
    def valid_email(cls, value):
        value = value.lower()
        if not re.fullmatch(r'[a-z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}', value):
            raise ValueError('Provide a valid email address.')
        return value


class GuestStart(BaseModel):
    acknowledge_temporary: bool

    @validator('acknowledge_temporary')
    def acknowledgement_required(cls, value):
        if not value:
            raise ValueError('Acknowledge that guest progress is temporary.')
        return value


class Registration(Credentials):
    name: constr(strip_whitespace=True, min_length=1, max_length=120)
    confirm_password: constr(min_length=12, max_length=128)

    @validator('confirm_password')
    def matching_password(cls, value, values):
        if value != values.get('password'):
            raise ValueError('Passwords do not match.')
        return value


class PasswordChange(BaseModel):
    current_password: constr(min_length=12, max_length=128)
    password: constr(min_length=12, max_length=128)
    confirm_password: constr(min_length=12, max_length=128)

    @validator('confirm_password')
    def matching_password(cls, value, values):
        if value != values.get('password'):
            raise ValueError('Passwords do not match.')
        return value


class AuthService:
    def __init__(self, repository, storage_dir):
        self.repository = repository
        self.storage_dir = Path(storage_dir).resolve()
        self.guest_lock = None
        self.stop = None
        self.task = None
        self.attempts = OrderedDict()
        self.attempt_lock = threading.Lock()
        self.dummy_hash = password_hash('dummy-password-not-an-account')
        self.secure_cookie = os.environ.get('REQCHECK_SECURE_COOKIE', '0') == '1'

    def rate_limit(self, request):
        key = request.client.host if request.client else 'unknown'
        timestamp = time.monotonic()
        with self.attempt_lock:
            attempts = [value for value in self.attempts.pop(key, []) if value > timestamp - 60]
            if len(attempts) >= 10:
                self.attempts[key] = attempts
                raise HTTPException(429, 'Too many session attempts. Wait one minute and retry.')
            self.attempts[key] = attempts + [timestamp]
            while len(self.attempts) > 10000:
                self.attempts.popitem(last=False)

    def session(self, request):
        token = request.cookies.get(COOKIE, '')
        if not token or len(token) > 128:
            return None
        session = self.repository.get_session(hashlib.sha256(token.encode()).hexdigest())
        if session is None or session['expires_at'] <= now().isoformat():
            return None
        if session['kind'] == 'account' and self.repository.get_user(session['owner_id']) is None:
            return None
        return session

    def public_session(self, session):
        user = self.repository.get_user(session['owner_id']) if session['kind'] == 'account' else None
        return {
            'authenticated': True, 'kind': session['kind'],
            'owner_id': session['owner_id'],
            'email': user['email'] if user else None,
            'name': (user.get('name') or user['email'].split('@')[0]) if user else 'Guest',
            'csrf_token': session['csrf_token'],
            'expires_at': session['expires_at'],
            'progress': 'saved to your account' if user else 'temporary; deleted on end or expiry',
        }

    def issue(self, owner_id, kind, old_session=None):
        if old_session:
            if old_session['kind'] == 'guest':
                self.delete_owner_data(old_session['owner_id'])
            self.repository.delete_session(old_session['_id'])
        token = secrets.token_urlsafe(32)
        session = {
            '_id': hashlib.sha256(token.encode()).hexdigest(),
            'owner_id': owner_id, 'kind': kind,
            'csrf_token': secrets.token_urlsafe(32),
            'expires_at': (now() + timedelta(hours=SESSION_HOURS)).isoformat(),
        }
        self.repository.create_session(session)
        response = JSONResponse(self.public_session(session), status_code=201)
        response.set_cookie(
            COOKIE, token, httponly=True, secure=self.secure_cookie,
            path='/',
        )
        response.headers['set-cookie'] += '; SameSite=strict'
        response.headers['Cache-Control'] = 'no-store'
        return response

    def owned_project(self, category, resource_id, owner_id):
        repo = self.repository
        if category == 'projects':
            project = repo.get_project(resource_id)
        else:
            document = None
            if category == 'documents':
                document = repo.get_document(resource_id)
            elif category == 'requirements':
                requirement = repo.get_requirement(resource_id)
                document = repo.get_document(requirement['document_id']) if requirement else None
            elif category in ('analysis-runs', 'findings'):
                if category == 'findings':
                    finding = repo.get_finding(resource_id)
                    run = repo.get_analysis_run(finding['run_id']) if finding else None
                else:
                    run = repo.get_analysis_run(resource_id)
                document = repo.get_document(run['document_id']) if run else None
            project = repo.get_project(document['project_id']) if document else None
        if not project or project.get('owner_id') != owner_id:
            raise HTTPException(404, 'Resource not found.')
        return project

    def delete_project_data(self, project_id):
        while True:
            documents, _ = self.repository.list_documents(project_id, 0, 100)
            if not documents:
                break
            for item in documents:
                document = self.repository.get_document(item['_id'])
                path = Path(document['stored_path']).resolve()
                if path.parent != self.storage_dir:
                    logger.error('Refusing to delete an upload outside configured storage')
                    raise HTTPException(500, 'Stored upload path is invalid; cleanup requires attention.')
                try:
                    if path.exists():
                        path.unlink()
                except OSError:
                    logger.exception('Could not delete guest/project upload')
                    raise HTTPException(503, 'Temporary upload cleanup failed; please retry.')
                self.repository.delete_document_data(document['_id'])
        self.repository.delete_project(project_id)

    def delete_owner_data(self, owner_id):
        while True:
            projects, _ = self.repository.list_projects(0, 100, owner_id)
            if not projects:
                break
            for project in projects:
                self.delete_project_data(project['_id'])

    def cleanup_expired(self):
        for session in self.repository.expired_sessions(now().isoformat()):
            if session['kind'] == 'guest':
                self.delete_owner_data(session['owner_id'])
            self.repository.delete_session(session['_id'])

    async def cleanup_loop(self):
        while not self.stop.is_set():
            try:
                async with self.guest_lock:
                    await run_in_threadpool(self.cleanup_expired)
            except (PyMongoError, HTTPException):
                logger.exception('Expired-session cleanup failed; retrying on the next cycle')
            try:
                await asyncio.wait_for(self.stop.wait(), timeout=60)
            except asyncio.TimeoutError:
                pass

    def check_mutation(self, request, session=None):
        if request.method not in ('POST', 'PATCH', 'DELETE', 'PUT'):
            return
        origin = request.headers.get('origin')
        if origin and origin not in ORIGINS:
            raise HTTPException(403, 'Request origin is not allowed.')
        if session and not hmac.compare_digest(
            request.headers.get('x-csrf-token', '').encode('utf-8'), session['csrf_token'].encode('utf-8')
        ):
            raise HTTPException(403, 'Session verification failed. Reload and retry.')
        if request.url.path.startswith('/auth/') and 'application/json' not in request.headers.get('content-type', ''):
            raise HTTPException(415, 'Authentication requests require JSON.')

    async def dispatch(self, request, call_next):
        try:
            path = request.url.path.rstrip('/') or '/'
            public = path in ('/health', '/auth/session', '/auth/register', '/auth/login', '/auth/guest')
            if request.method == 'OPTIONS':
                return await call_next(request)
            session = await run_in_threadpool(self.session, request)
            self.check_mutation(request, session)
            if not public:
                if session is None:
                    raise HTTPException(401, 'Your session ended. Log in or start a new guest session.')
                parts = path.strip('/').split('/')
                if parts[0] in ('projects', 'documents', 'requirements', 'analysis-runs', 'findings') and len(parts) > 1:
                    await run_in_threadpool(self.owned_project, parts[0], parts[1], session['owner_id'])
            request.state.session = session
            if session and session['kind'] == 'guest':
                async with self.guest_lock:
                    if session['expires_at'] <= now().isoformat() or not await run_in_threadpool(
                        self.repository.get_session, session['_id']
                    ):
                        raise HTTPException(401, 'Guest session ended. Start a new temporary workspace.')
                    response = await call_next(request)
            else:
                response = await call_next(request)
            response.headers['Cache-Control'] = 'no-store'
            return response
        except HTTPException as exc:
            return JSONResponse({'detail': exc.detail}, status_code=exc.status_code)
        except PyMongoError:
            logger.exception('Session or ownership database lookup failed')
            return JSONResponse({'detail': 'Database unavailable. Retry when it is ready.'}, status_code=503)

    def install(self, app):
        app.middleware('http')(self.dispatch)

        @app.on_event('startup')
        async def start_cleanup():
            self.guest_lock = asyncio.Lock()
            self.stop = asyncio.Event()
            self.task = asyncio.ensure_future(self.cleanup_loop())

        @app.on_event('shutdown')
        async def stop_cleanup():
            self.stop.set()
            if self.task:
                await self.task
            self.repository.close()

        @app.get('/auth/session')
        def current_session(request: Request):
            return self.public_session(request.state.session) if request.state.session else {'authenticated': False}

        @app.post('/auth/register')
        def register(payload: Registration, request: Request):
            self.rate_limit(request)
            user = {
                '_id': str(uuid.uuid4()), 'email': payload.email, 'name': payload.name,
                'password_hash': password_hash(payload.password), 'created_at': now().isoformat(),
            }
            try:
                self.repository.create_user(user)
            except DuplicateKeyError:
                raise HTTPException(409, 'This email is already registered. Log in instead.')
            return self.issue(user['_id'], 'account', request.state.session)

        @app.post('/auth/login')
        def login(payload: Credentials, request: Request):
            self.rate_limit(request)
            user = self.repository.get_user_by_email(payload.email)
            valid = password_matches(
                payload.password, user['password_hash'] if user else self.dummy_hash
            )
            if not user or not valid:
                raise HTTPException(401, 'Email or password is incorrect.')
            return self.issue(user['_id'], 'account', request.state.session)

        @app.post('/auth/guest')
        def guest(payload: GuestStart, request: Request):
            self.rate_limit(request)
            return self.issue(str(uuid.uuid4()), 'guest', request.state.session)

        @app.post('/auth/change-password')
        def change_password(payload: PasswordChange, request: Request):
            session = request.state.session
            if session['kind'] != 'account':
                raise HTTPException(403, 'Guests do not have an account password.')
            self.rate_limit(request)
            user = self.repository.get_user(session['owner_id'])
            if not password_matches(payload.current_password, user['password_hash']):
                raise HTTPException(400, 'Current password is incorrect.')
            if payload.current_password == payload.password:
                raise HTTPException(422, 'Choose a different new password.')
            if not self.repository.change_password(
                user['_id'], user['password_hash'], password_hash(payload.password)
            ):
                raise HTTPException(409, 'Password changed in another session. Retry with the current password.')
            self.repository.delete_other_sessions(user['_id'], session['_id'])
            return {'message': 'Password changed. Other sessions have been signed out.'}

        @app.post('/auth/logout')
        def logout(request: Request):
            session = request.state.session
            if session['kind'] == 'guest':
                self.delete_owner_data(session['owner_id'])
            self.repository.delete_session(session['_id'])
            response = JSONResponse({'message': 'Session ended.'})
            response.delete_cookie(COOKIE, path='/')
            return response
