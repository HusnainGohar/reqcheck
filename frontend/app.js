(function (React, ReactDOM, reactQuery, ReactRouterDOM) {
    'use strict';

    var AuthContext = React.createContext(null);
    function useAuth() {
        var auth = React.useContext(AuthContext);
        if (!auth)
            throw new Error('Authentication provider is missing.');
        return auth;
    }

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var API = window.REQCHECK_API_BASE || window.location.protocol + '//' + window.location.hostname + ':8000';
    var csrfToken = '';
    var cacheScope = 0;
    function sessionOptions(options) {
        var headers = new Headers(options && options.headers);
        if (csrfToken)
            headers.set('X-CSRF-Token', csrfToken);
        return Object.assign({}, options, { credentials: 'include', headers: headers });
    }
    function httpRequest(path, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response, requestIdentity, error_1, raw, body, bodyRecord, detail;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestIdentity = csrfToken;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(API + path, sessionOptions(options))];
                    case 2:
                        response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        throw new Error('Can’t reach ReqCheck. Check that the local API is running, then try again.');
                    case 4: return [4 /*yield*/, response.text()];
                    case 5:
                        raw = _a.sent();
                        body = {};
                        if (raw) {
                            try {
                                body = JSON.parse(raw);
                            }
                            catch (error) {
                                throw new Error('The server returned an unreadable response. Please try again.');
                            }
                        }
                        if (!response.ok) {
                            if (response.status === 401 && path.indexOf('/auth/') !== 0 && csrfToken === requestIdentity) {
                                window.dispatchEvent(new Event('reqcheck-session-ended'));
                            }
                            bodyRecord = body;
                            detail = bodyRecord.detail;
                            if (typeof detail === 'string')
                                throw new Error(detail);
                            if (detail && typeof detail === 'object' &&
                                typeof detail.analysis_error === 'string') {
                                throw new Error(detail.analysis_error);
                            }
                            throw new Error(JSON.stringify(detail || body));
                        }
                        if (!raw)
                            throw new Error('The server returned an empty response.');
                        return [2 /*return*/, body];
                }
            });
        });
    }
    function httpDelete(path, body) {
        return __awaiter(this, void 0, void 0, function () {
            var response, requestIdentity, error_2, raw, detail, bodyValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestIdentity = csrfToken;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(API + path, sessionOptions({
                                method: 'DELETE',
                                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                                body: body ? JSON.stringify(body) : undefined,
                            }))];
                    case 2:
                        response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw new Error('Can’t reach ReqCheck. Check that the local API is running, then try again.');
                    case 4:
                        if (response.status === 204)
                            return [2 /*return*/];
                        if (response.status === 401 && csrfToken === requestIdentity)
                            window.dispatchEvent(new Event('reqcheck-session-ended'));
                        return [4 /*yield*/, response.text()];
                    case 5:
                        raw = _a.sent();
                        detail = raw;
                        if (raw) {
                            try {
                                bodyValue = JSON.parse(raw);
                                detail = typeof bodyValue.detail === 'string'
                                    ? bodyValue.detail
                                    : JSON.stringify(bodyValue.detail || bodyValue);
                            }
                            catch (error) {
                                detail = raw;
                            }
                        }
                        throw new Error(detail || 'The delete request could not be completed.');
                }
            });
        });
    }
    function getIdentity() { return csrfToken; }
    function setIdentity(value) {
        if (value !== csrfToken)
            cacheScope += 1;
        csrfToken = value;
    }
    function getCacheScope() { return cacheScope; }

    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$1 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __read = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function queryKey(path) {
        return ['api', String(getCacheScope()), path];
    }
    function clearApiCache() {
        reactQuery.queryCache.clear();
    }
    function request(path, options) {
        if (options && options.method && options.method !== 'GET')
            return httpRequest(path, options);
        return reactQuery.queryCache.prefetchQuery(queryKey(path), function () { return httpRequest(path, options); }, {
            force: true, retry: false, throwOnError: true, staleTime: 0,
        });
    }
    function useApi() {
        var _a = __read(reactQuery.useMutation(function (operation) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    if (operation.remove)
                        return [2 /*return*/, httpDelete(operation.path, operation.body)];
                    return [2 /*return*/, httpRequest(operation.path, operation.options)];
                });
            });
        }, { throwOnError: true }), 1), mutate = _a[0];
        function send(path, options) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!options || !options.method || options.method === 'GET')
                                return [2 /*return*/, request(path, options)];
                            return [4 /*yield*/, mutate({ path: path, options: options }, { throwOnError: true })];
                        case 1: 
                        // The transport decodes the response; the caller supplies the endpoint's response type.
                        return [2 /*return*/, _a.sent()];
                    }
                });
            });
        }
        function remove(path, body) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, mutate({ path: path, body: body, remove: true }, { throwOnError: true })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        return { request: send, requestDelete: remove };
    }

    var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$2 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __read$1 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function useAuthSession() {
        var history = ReactRouterDOM.useHistory();
        var request = useApi().request;
        var _a = __read$1(React.useState(null), 2), session = _a[0], setSession = _a[1];
        var _b = __read$1(React.useState(true), 2), checking = _b[0], setChecking = _b[1];
        var _c = __read$1(React.useState(''), 2), error = _c[0], setError = _c[1];
        var _d = __read$1(React.useState(false), 2), busy = _d[0], setBusy = _d[1];
        var identityGeneration = React.useRef(0);
        var identityChanging = React.useRef(false);
        function checkSession() {
            return __awaiter$2(this, void 0, void 0, function () {
                var generation, result, err_1;
                return __generator$2(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (identityChanging.current)
                                return [2 /*return*/];
                            generation = identityGeneration.current;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/auth/session')];
                        case 2:
                            result = _a.sent();
                            if (generation !== identityGeneration.current)
                                return [2 /*return*/];
                            if (getIdentity() !== (result.csrf_token || ''))
                                clearApiCache();
                            setIdentity(result.csrf_token || '');
                            setSession(result.authenticated ? result : null);
                            setError('');
                            return [3 /*break*/, 5];
                        case 3:
                            err_1 = _a.sent();
                            if (generation !== identityGeneration.current)
                                return [2 /*return*/];
                            setError(err_1 instanceof Error ? err_1.message : 'Could not check your session.');
                            return [3 /*break*/, 5];
                        case 4:
                            setChecking(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        React.useEffect(function () {
            checkSession();
            function expired() {
                identityGeneration.current += 1;
                clearApiCache();
                setIdentity('');
                setSession(null);
                setError('Your session ended. Account work remains saved. Guest work cannot be resumed after expiry.');
                history.replace('/login');
            }
            window.addEventListener('reqcheck-session-ended', expired);
            var interval = window.setInterval(checkSession, 60000);
            return function () {
                window.removeEventListener('reqcheck-session-ended', expired);
                window.clearInterval(interval);
            };
        }, []);
        function authenticate(kind, payload) {
            return __awaiter$2(this, void 0, void 0, function () {
                var result, destination, err_2;
                return __generator$2(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            identityGeneration.current += 1;
                            identityChanging.current = true;
                            setBusy(true);
                            setError('');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/auth/' + kind, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload),
                                })];
                        case 2:
                            result = _a.sent();
                            destination = new URLSearchParams(history.location.search).get('next');
                            clearApiCache();
                            setIdentity(result.csrf_token || '');
                            setSession(result);
                            history.replace(destination && ['/workspace', '/account/password', '/end-guest'].indexOf(destination) !== -1
                                ? destination : '/workspace');
                            return [3 /*break*/, 5];
                        case 3:
                            err_2 = _a.sent();
                            setError(err_2 instanceof Error ? err_2.message : 'Could not start your session.');
                            return [3 /*break*/, 5];
                        case 4:
                            identityChanging.current = false;
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        function logout() {
            return __awaiter$2(this, void 0, void 0, function () {
                var err_3;
                return __generator$2(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (session && session.kind === 'guest' && history.location.pathname !== '/end-guest') {
                                history.push('/end-guest');
                                return [2 /*return*/];
                            }
                            identityGeneration.current += 1;
                            identityChanging.current = true;
                            setBusy(true);
                            setError('');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/auth/logout', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
                                })];
                        case 2:
                            _a.sent();
                            if (session && session.kind === 'guest') {
                                sessionStorage.removeItem('reqcheck.' + session.owner_id + '.project');
                                sessionStorage.removeItem('reqcheck.' + session.owner_id + '.document');
                            }
                            clearApiCache();
                            setIdentity('');
                            setSession(null);
                            history.replace('/');
                            return [3 /*break*/, 5];
                        case 3:
                            err_3 = _a.sent();
                            setError(err_3 instanceof Error ? err_3.message : 'Session could not be ended. Please retry.');
                            return [3 /*break*/, 5];
                        case 4:
                            identityChanging.current = false;
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        return { session: session, checking: checking, error: error, busy: busy, checkSession: checkSession, authenticate: authenticate, logout: logout };
    }

    var iconPaths = {
        chevron: 'M6 9l6 6 6-6',
        overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
        folder: 'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
        document: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 12h8 M8 16h6',
        edit: 'M12 20H4v-8 M16 3l5 5 M8 16l1-5L18 2l4 4-9 9z',
        chart: 'M4 3v18h17 M8 17v-5 M13 17V7 M18 17V4',
        plus: 'M12 5v14 M5 12h14',
        check: 'M5 12l4 4L19 6',
        close: 'M6 6l12 12 M18 6L6 18',
        upload: 'M12 16V3 M7 8l5-5 5 5 M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5',
        download: 'M12 3v13 M7 11l5 5 5-5 M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
        search: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
        trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
        save: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5z M7 3v6h10V3 M7 21v-8h10v8',
        split: 'M12 21v-9 M12 12L5 5 M12 12l7-7 M5 10V5h5 M14 5h5v5',
        merge: 'M5 21v-4l7-7 7 7v4 M12 10V3 M7 8l5-5 5 5',
        warning: 'M12 3L2 21h20z M12 9v5 M12 17v1',
        info: 'M12 16v-4 M12 8v-1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
        shield: 'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',
        user: 'M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
        eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
        eyeOff: 'M3 3l18 18 M10 5a12 12 0 0 1 12 7s-1 2-3 4 M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1 M10 10a3 3 0 0 0 4 4',
        play: 'M8 4l12 8-12 8z',
        arrow: 'M4 12h16 M14 6l6 6-6 6',
        clock: 'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    };
    function Icon(props) {
        return (React.createElement("svg", { className: "ui-icon", width: props.size || 18, height: props.size || 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" },
            React.createElement("path", { d: iconPaths[props.name] })));
    }

    function PublicLayout(props) {
        var _a = useAuth(), session = _a.session, error = _a.error, checkSession = _a.checkSession;
        return React.createElement("div", { className: "public-shell" },
            React.createElement("header", { className: "public-header" },
                React.createElement(ReactRouterDOM.Link, { className: "public-brand", to: "/" },
                    React.createElement(Icon, { name: "shield", size: 28 }),
                    React.createElement("span", { className: "brand-name" }, "ReqCheck")),
                React.createElement("nav", { "aria-label": "Public navigation" }, session ? React.createElement(ReactRouterDOM.Link, { className: "secondary-button", to: "/workspace" }, "Open workspace") : React.createElement(React.Fragment, null,
                    React.createElement(ReactRouterDOM.Link, { to: "/login" }, "Log in"),
                    React.createElement(ReactRouterDOM.Link, { className: "secondary-button", to: "/register" }, "Create account")))),
            error ? React.createElement("div", { className: "public-error notice error", role: "alert" },
                error,
                React.createElement("button", { type: "button", className: "ghost-button", onClick: checkSession }, "Retry session check")) : null,
            props.children,
            React.createElement("footer", { className: "public-footer" }, "ReqCheck \u00B7 Human-in-the-loop review \u00B7 Local academic prototype"));
    }

    var __read$2 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function PasswordField(props) {
        var _a = __read$2(React.useState(false), 2), visible = _a[0], setVisible = _a[1];
        return React.createElement("div", { className: "password-field" },
            React.createElement("input", { id: props.id, className: "text-input", type: visible ? 'text' : 'password', required: true, minLength: 12, maxLength: 128, autoComplete: props.autoComplete, value: props.value, disabled: props.disabled, "aria-invalid": props.invalid || undefined, "aria-describedby": props.describedBy, onChange: function (event) { props.onChange(event.target.value); } }),
            React.createElement("button", { type: "button", className: "password-toggle", disabled: props.disabled, "aria-label": (visible ? 'Hide ' : 'Show ') + props.label.toLowerCase(), "aria-pressed": visible, onClick: function () { setVisible(!visible); } },
                React.createElement(Icon, { name: visible ? 'eyeOff' : 'eye' })));
    }

    var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$3 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __read$3 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function AccessPage(props) {
        var _a = useAuth(), busy = _a.busy, authenticate = _a.authenticate;
        var route = props.kind;
        var location = ReactRouterDOM.useLocation();
        var _b = __read$3(React.useState(''), 2), name = _b[0], setName = _b[1];
        var _c = __read$3(React.useState(''), 2), email = _c[0], setEmail = _c[1];
        var _d = __read$3(React.useState(''), 2), password = _d[0], setPassword = _d[1];
        var _e = __read$3(React.useState(''), 2), confirmPassword = _e[0], setConfirmPassword = _e[1];
        var _f = __read$3(React.useState(false), 2), acknowledged = _f[0], setAcknowledged = _f[1];
        var _g = __read$3(React.useState(''), 2), validation = _g[0], setValidation = _g[1];
        var errorSummary = React.useRef(null);
        React.useEffect(function () { var _a; if (validation)
            (_a = errorSummary.current) === null || _a === void 0 ? void 0 : _a.focus(); }, [validation]);
        function submit(event) {
            var _a;
            return __awaiter$3(this, void 0, void 0, function () {
                return __generator$3(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            event.preventDefault();
                            if (route === 'register' && password !== confirmPassword) {
                                setValidation('Passwords do not match.');
                                (_a = errorSummary.current) === null || _a === void 0 ? void 0 : _a.focus();
                                return [2 /*return*/];
                            }
                            setValidation('');
                            return [4 /*yield*/, authenticate(route, route === 'guest' ? { acknowledge_temporary: acknowledged } :
                                    route === 'register' ? { name: name, email: email, password: password, confirm_password: confirmPassword } : { email: email, password: password })];
                        case 1:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        return React.createElement("main", { className: "access-shell access-split" },
            React.createElement("aside", { className: "access-story", "aria-label": "Review workspace benefits" },
                React.createElement("p", { className: "eyebrow" }, "Less ambiguity. More clarity."),
                React.createElement("h2", null,
                    "A little structure.",
                    React.createElement("br", null),
                    "A better specification."),
                React.createElement("p", null, "Turn documents into decisions you can explain. One requirement at a time."),
                React.createElement("div", { className: "story-evidence" },
                    React.createElement(Icon, { name: "document", size: 28 }),
                    React.createElement("span", null, "SOURCE DOCUMENT"),
                    React.createElement("div", { className: "story-lines", "aria-hidden": "true" },
                        React.createElement("span", null),
                        React.createElement("span", null),
                        React.createElement("span", null)),
                    React.createElement("div", { className: "story-check" },
                        React.createElement(Icon, { name: "check", size: 18 }),
                        "Review with context")),
                React.createElement("ul", null,
                    React.createElement("li", null,
                        React.createElement(Icon, { name: "edit" }),
                        "Refine the original text"),
                    React.createElement("li", null,
                        React.createElement(Icon, { name: "chart" }),
                        "Explore explainable suggestions"),
                    React.createElement("li", null,
                        React.createElement(Icon, { name: "download" }),
                        "Take your evidence with you")),
                React.createElement("p", { className: "story-footnote" }, route === 'guest' ? 'A temporary space to try the full workflow.' : 'Your saved workspace, ready when you are.')),
            React.createElement("section", { className: "access-card", "aria-labelledby": "access-title" },
                React.createElement("p", { className: "eyebrow" }, route === 'guest' ? 'Explore without an account' : route === 'register' ? 'Your personal workspace' : 'Good to have you back'),
                React.createElement("div", { className: "access-icon" },
                    React.createElement(Icon, { name: route === 'guest' ? 'clock' : 'shield', size: 30 })),
                React.createElement("h1", { id: "access-title" }, route === 'guest' ? 'Try a temporary workspace' : route === 'register' ? 'Create your account' : 'Welcome to ReqCheck'),
                React.createElement("p", null, route === 'guest' ? 'No account required. Review documents, run analysis and download reports during your active session.' : 'Your documents, edits, reviewer decisions and results are saved to your account. Log in again to resume your work.'),
                validation ? React.createElement("p", { ref: errorSummary, tabIndex: -1, className: "notice error", role: "alert" },
                    validation,
                    " ",
                    React.createElement("a", { href: "#account-confirm-password", onClick: function (event) { var _a; event.preventDefault(); (_a = document.getElementById('account-confirm-password')) === null || _a === void 0 ? void 0 : _a.focus(); } }, "Check confirmation")) : null,
                React.createElement("form", { onSubmit: submit },
                    route === 'guest' ? React.createElement(React.Fragment, null,
                        React.createElement("div", { className: "notice warning" }, "Guest work is not saved for later retrieval. It is deleted when you explicitly end the session or within 24 hours of starting. Closing a browser does not reliably notify the server; abandoned data is removed after expiry. Browser session restoration may keep an active session until it expires."),
                        React.createElement("label", { className: "guest-acknowledgement" },
                            React.createElement("input", { type: "checkbox", required: true, checked: acknowledged, onChange: function (event) { setAcknowledged(event.target.checked); } }),
                            "I understand my work is temporary and will not be available after this session ends.")) : React.createElement(React.Fragment, null,
                        route === 'register' ? React.createElement(React.Fragment, null,
                            React.createElement("label", { className: "field-label", htmlFor: "account-name" }, "Name"),
                            React.createElement("input", { id: "account-name", className: "text-input", required: true, maxLength: 120, autoComplete: "name", disabled: busy, value: name, onChange: function (event) { setName(event.target.value); } })) : null,
                        React.createElement("label", { className: "field-label", htmlFor: "account-email" }, "Email address"),
                        React.createElement("input", { id: "account-email", className: "text-input", type: "email", required: true, maxLength: 254, autoComplete: "email", disabled: busy, value: email, onChange: function (event) { setEmail(event.target.value); } }),
                        React.createElement("label", { className: "field-label", htmlFor: "account-password" }, "Password"),
                        React.createElement(PasswordField, { id: "account-password", label: "Password", autoComplete: route === 'register' ? 'new-password' : 'current-password', value: password, disabled: busy, onChange: setPassword, describedBy: "account-password-help" }),
                        route === 'register' ? React.createElement(React.Fragment, null,
                            React.createElement("label", { className: "field-label", htmlFor: "account-confirm-password" }, "Confirm password"),
                            React.createElement(PasswordField, { id: "account-confirm-password", label: "Confirm password", autoComplete: "new-password", value: confirmPassword, disabled: busy, onChange: function (value) { setConfirmPassword(value); if (validation)
                                    setValidation(''); }, invalid: Boolean(validation), describedBy: validation ? 'confirm-password-error' : undefined }),
                            validation ? React.createElement("p", { className: "field-error", id: "confirm-password-error" }, "Enter the same password in both fields.") : null) : null,
                        React.createElement("p", { className: "access-help", id: "account-password-help" }, "Use 12\u2013128 characters. Login uses a browser-session cookie and expires after 24 hours; saved account work remains available.")),
                    React.createElement("button", { type: "submit", className: "primary-button", disabled: busy || route === 'guest' && !acknowledged },
                        busy ? React.createElement("span", { className: "spinner" }) : React.createElement(Icon, { name: "arrow" }),
                        busy ? 'Please wait…' : route === 'guest' ? 'Continue as Guest' : route === 'register' ? 'Create account & start' : 'Log in & start reviewing')),
                React.createElement("div", { className: "access-links" },
                    route !== 'guest' ? React.createElement(ReactRouterDOM.Link, { to: '/guest' + location.search }, "Continue as Guest") : React.createElement(ReactRouterDOM.Link, { to: '/register' + location.search }, "Create an account to keep your work"),
                    route === 'register' ? React.createElement(ReactRouterDOM.Link, { to: '/login' + location.search }, "Already have an account? Log in") : route === 'login' ? React.createElement(ReactRouterDOM.Link, { to: '/register' + location.search }, "Create account") : null,
                    React.createElement(ReactRouterDOM.Link, { to: "/" }, "Back to start"))));
    }

    var __read$4 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function AccountMenu(props) {
        var _a = useAuth(), session = _a.session, busy = _a.busy, logout = _a.logout;
        var _b = __read$4(React.useState(false), 2), open = _b[0], setOpen = _b[1];
        var container = React.useRef(null);
        var trigger = React.useRef(null);
        React.useEffect(function () {
            if (!open)
                return;
            function closeOutside(event) {
                if (container.current && !container.current.contains(event.target))
                    setOpen(false);
            }
            function escape(event) {
                var _a;
                if (event.key === 'Escape') {
                    setOpen(false);
                    (_a = trigger.current) === null || _a === void 0 ? void 0 : _a.focus();
                }
            }
            document.addEventListener('mousedown', closeOutside);
            document.addEventListener('keydown', escape);
            return function () {
                document.removeEventListener('mousedown', closeOutside);
                document.removeEventListener('keydown', escape);
            };
        }, [open]);
        var name = session && session.kind === 'account' ? session.name || 'Reviewer' : 'Guest';
        return React.createElement("div", { className: "account-menu", ref: container, onBlur: function (event) {
                if (!event.currentTarget.contains(event.relatedTarget))
                    setOpen(false);
            } },
            React.createElement("button", { ref: trigger, type: "button", className: "account-trigger icon-button", "aria-label": "Account options", "aria-expanded": open, "aria-controls": "account-options", onClick: function () { setOpen(!open); } },
                React.createElement(Icon, { name: "user", size: 23 })),
            open ? React.createElement("section", { className: "account-popover", id: "account-options", "aria-label": "Account options" },
                React.createElement("div", { className: "account-identity" },
                    React.createElement("span", { className: "account-avatar" },
                        React.createElement(Icon, { name: "user", size: 25 })),
                    React.createElement("div", null,
                        React.createElement("strong", null, name),
                        React.createElement("p", null, session && session.kind === 'account' ? session.email : 'Temporary workspace'))),
                session && session.kind === 'account' ? React.createElement(ReactRouterDOM.Link, { className: 'secondary-button' + (props.disabled || busy ? ' disabled-link' : ''), to: "/account/password", "aria-disabled": props.disabled || busy, onClick: function (event) {
                        if (props.disabled || busy)
                            event.preventDefault();
                        else
                            setOpen(false);
                    } },
                    React.createElement(Icon, { name: "shield" }),
                    "Change Password") :
                    React.createElement(React.Fragment, null,
                        React.createElement("button", { type: "button", className: "secondary-button", disabled: true },
                            React.createElement(Icon, { name: "shield" }),
                            "Change Password"),
                        React.createElement("p", { className: "access-help" }, "Guests do not have a password.")),
                React.createElement("button", { type: "button", className: "danger-button", disabled: props.disabled || busy, onClick: function () { setOpen(false); logout(); } },
                    React.createElement(Icon, { name: "arrow" }),
                    session && session.kind === 'guest' ? 'Logout / end guest session' : 'Logout'),
                props.disabled ? React.createElement("p", { className: "access-help" }, "Finish saving your changes before leaving.") : null) : null);
    }

    function PrivatePage(props) {
        var error = useAuth().error;
        return React.createElement("div", { className: "private-page" },
            React.createElement("header", { className: "topbar" },
                React.createElement(ReactRouterDOM.Link, { className: "public-brand", to: "/workspace" },
                    React.createElement(Icon, { name: "shield", size: 25 }),
                    React.createElement("span", { className: "brand-name" }, "ReqCheck")),
                React.createElement("div", { className: "topbar-right" },
                    React.createElement(AccountMenu, { disabled: props.busy }))),
            error ? React.createElement("p", { className: "public-error notice error", role: "alert" }, error) : null,
            props.children);
    }

    function EndGuestPage() {
        var _a = useAuth(), session = _a.session, busy = _a.busy, error = _a.error, logout = _a.logout;
        if (session && session.kind !== 'guest')
            return React.createElement(ReactRouterDOM.Redirect, { to: "/workspace" });
        return React.createElement(PrivatePage, null,
            React.createElement("main", { className: "access-shell" },
                React.createElement("section", { className: "access-card" },
                    React.createElement(Icon, { name: "trash", size: 30 }),
                    React.createElement("h1", null, "End guest session?"),
                    React.createElement("p", null, "This permanently deletes this guest workspace, including uploads, requirements, reviews and analysis results. Download any reports you need first."),
                    error ? React.createElement("p", { className: "notice error", role: "alert" }, error) : null,
                    React.createElement("div", { className: "hero-actions" },
                        React.createElement("button", { className: "danger-button", type: "button", disabled: busy, onClick: logout }, busy ? 'Deleting temporary work…' : 'End session & delete work'),
                        React.createElement(ReactRouterDOM.Link, { className: "secondary-button", to: "/workspace" }, "Back to workspace")))));
    }

    var __read$5 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function useReducedMotion() {
        var _a = __read$5(React.useState(function () {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }), 2), reduced = _a[0], setReduced = _a[1];
        React.useEffect(function () {
            var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
            function update() { setReduced(preference.matches); }
            preference.addListener(update);
            update();
            return function () { preference.removeListener(update); };
        }, []);
        return reduced;
    }

    var __read$6 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    var stages = [
        { label: 'Upload', title: 'Bring your specification', detail: 'Choose a TXT, DOCX or searchable PDF. Upload it to link the original source to extracted requirements.', icon: 'upload' },
        { label: 'Review', title: 'Make each statement clear', detail: 'Inspect extracted text. Edit, split or merge statements; corrections save after typing pauses.', icon: 'edit' },
        { label: 'Analyze', title: 'Explore, then decide', detail: 'Inspect classification suggestions and quality cues. Accept, dismiss or correct them using your judgment.', icon: 'chart' },
        { label: 'Export', title: 'Keep a traceable record', detail: 'Download CSV or JSON, or open a printable report with the exact source revision and reviewer decisions.', icon: 'download' },
    ];
    function WorkflowIllustration() {
        var reduced = useReducedMotion();
        var _a = __read$6(React.useState(0), 2), stage = _a[0], setStage = _a[1];
        var _b = __read$6(React.useState(true), 2), playing = _b[0], setPlaying = _b[1];
        var _c = __read$6(React.useState(false), 2), hovered = _c[0], setHovered = _c[1];
        var _d = __read$6(React.useState(false), 2), focused = _d[0], setFocused = _d[1];
        var _e = __read$6(React.useState(!document.hidden), 2), visible = _e[0], setVisible = _e[1];
        var running = playing && !reduced && !hovered && !focused && visible;
        React.useEffect(function () {
            function visibility() { setVisible(!document.hidden); }
            document.addEventListener('visibilitychange', visibility);
            return function () { document.removeEventListener('visibilitychange', visibility); };
        }, []);
        React.useEffect(function () {
            if (!running)
                return;
            var timer = window.setInterval(function () { setStage(function (current) { return (current + 1) % stages.length; }); }, 4500);
            return function () { window.clearInterval(timer); };
        }, [running]);
        function choose(index) { setStage(index); setPlaying(false); }
        return React.createElement("section", { className: 'workflow-demo' + (running ? ' is-playing' : ''), "aria-labelledby": "workflow-demo-title", onMouseEnter: function () { setHovered(true); }, onMouseLeave: function () { setHovered(false); }, onFocus: function () { setFocused(true); }, onBlur: function (event) { if (!event.currentTarget.contains(event.relatedTarget))
                setFocused(false); } },
            React.createElement("div", { className: "workflow-demo-heading" },
                React.createElement("span", { id: "workflow-demo-title" },
                    React.createElement(Icon, { name: "shield", size: 18 }),
                    "The review journey"),
                React.createElement("span", { className: "preview-status" }, "Interactive illustration")),
            React.createElement("svg", { className: "workflow-svg", viewBox: "0 0 520 320", role: "img", "aria-labelledby": "workflow-svg-title workflow-svg-desc" },
                React.createElement("title", { id: "workflow-svg-title" }, stages[stage].title),
                React.createElement("desc", { id: "workflow-svg-desc" }, "Upload a source document, review its requirements, analyze suggestions, then export evidence. Use the four step buttons below to explore each stage."),
                React.createElement("defs", null,
                    React.createElement("pattern", { id: "workflow-dots", width: "20", height: "20", patternUnits: "userSpaceOnUse" },
                        React.createElement("circle", { cx: "2", cy: "2", r: "1", fill: "#cadbd0" }))),
                React.createElement("rect", { x: "0", y: "0", width: "520", height: "320", rx: "14", fill: "url(#workflow-dots)" }),
                React.createElement("path", { d: "M66 58H454", className: "workflow-connection" }),
                React.createElement("path", { d: "M66 58H454", className: "workflow-signal" }),
                stages.map(function (item, index) {
                    return React.createElement("g", { key: item.label, className: index === stage ? 'workflow-node active' : 'workflow-node' },
                        React.createElement("circle", { cx: 66 + index * 129, cy: "58", r: "23" }),
                        React.createElement("text", { x: 66 + index * 129, y: "63", textAnchor: "middle" }, '0' + (index + 1)),
                        React.createElement("text", { className: "workflow-node-label", x: 66 + index * 129, y: "104", textAnchor: "middle" }, item.label));
                }),
                React.createElement("g", { key: stage, className: "workflow-scene" },
                    React.createElement("rect", { x: "48", y: "132", width: "424", height: "160", rx: "14", fill: "#fff", stroke: "#bfd3c5" }),
                    React.createElement("rect", { x: "66", y: "152", width: "38", height: "44", rx: "8", fill: "#e9f4ee" }),
                    React.createElement("path", { d: "M77 160h12l5 5v22H77zm12 0v7h5m-13 8h9m-9 5h9", fill: "none", stroke: "#136c62", strokeWidth: "2", strokeLinejoin: "round" }),
                    React.createElement("text", { x: "118", y: "170", className: "workflow-scene-title" }, ['Source document', 'Requirement review', 'Explainable suggestions', 'Your evidence packet'][stage]),
                    React.createElement("text", { x: "118", y: "191", className: "workflow-scene-meta" }, ['TXT / DOCX / PDF', 'Edit with source context', 'Human judgment comes first', 'CSV / JSON / printable report'][stage]),
                    stage === 0 ? React.createElement("g", null,
                        React.createElement("path", { d: "M260 260v-44m-15 15 15-15 15 15", className: "workflow-document-motion", fill: "none", stroke: "#136c62", strokeWidth: "3", strokeLinecap: "round" }),
                        React.createElement("path", { d: "M190 254v14h140v-14", fill: "none", stroke: "#9ab9a4", strokeWidth: "2" })) :
                        stage === 1 ? React.createElement("g", null,
                            React.createElement("rect", { x: "72", y: "216", width: "376", height: "48", rx: "8", fill: "#f7f8f4" }),
                            React.createElement("text", { x: "86", y: "245", className: "workflow-example" }, "The system shall respond"),
                            React.createElement("rect", { x: "331", y: "227", width: "98", height: "25", rx: "4", fill: "#f7e8ba" }),
                            React.createElement("text", { x: "341", y: "245", className: "workflow-example" }, "quickly.")) :
                            stage === 2 ? React.createElement("g", null,
                                React.createElement("rect", { x: "74", y: "218", width: "155", height: "42", rx: "8", fill: "#fff7e6" }),
                                React.createElement("text", { x: "90", y: "244", className: "workflow-example" }, "Ambiguity cue"),
                                React.createElement("path", { d: "m248 238 12 12 24-28", fill: "none", stroke: "#136c62", strokeWidth: "3" }),
                                React.createElement("text", { x: "300", y: "244", className: "workflow-example" }, "Your decision")) :
                                React.createElement("g", null,
                                    React.createElement("path", { d: "m83 239 9 9 18-21", fill: "none", stroke: "#136c62", strokeWidth: "3" }),
                                    React.createElement("text", { x: "128", y: "244", className: "workflow-example" }, "Source + results + review history"),
                                    React.createElement("path", { d: "M430 218v30m-8-8 8 8 8-8", fill: "none", stroke: "#136c62", strokeWidth: "2" })))),
            React.createElement("div", { className: "workflow-step-controls", role: "group", "aria-label": "Explore the review workflow" }, stages.map(function (item, index) {
                return React.createElement("button", { key: item.label, type: "button", className: index === stage ? 'workflow-step active' : 'workflow-step', "aria-pressed": index === stage, "aria-controls": "workflow-stage-description", onClick: function () { choose(index); } },
                    React.createElement(Icon, { name: item.icon, size: 16 }),
                    React.createElement("span", null,
                        index + 1,
                        ". ",
                        item.label));
            })),
            React.createElement("div", { className: "workflow-stage-description", id: "workflow-stage-description" },
                React.createElement("h3", null, stages[stage].title),
                React.createElement("p", null, stages[stage].detail)),
            React.createElement("div", { className: "workflow-demo-footer" },
                React.createElement("p", null, "Illustration only. Your results appear after analysis."),
                React.createElement("button", { type: "button", className: "ghost-button", disabled: reduced, "aria-pressed": playing && !reduced, onClick: function () { setPlaying(!playing); } }, reduced ? 'Reduced motion' : playing ? 'Pause animation' : 'Play animation')));
    }

    function HomePage() {
        var session = useAuth().session;
        var steps = [
            { icon: 'upload', title: 'Upload a document', text: 'Bring a TXT, DOCX or searchable PDF. Your source file stays linked to extracted statements.' },
            { icon: 'edit', title: 'Review requirements', text: 'Correct text, add missing statements, or split and merge them. Changes save after typing pauses.' },
            { icon: 'chart', title: 'Analyze & decide', text: 'Explore model suggestions, ambiguity cues and possible duplicates. Accept, dismiss or correct findings.' },
            { icon: 'download', title: 'Export your evidence', text: 'Download CSV or JSON, or open a printable report linked to its exact source revision.' },
        ];
        return React.createElement("main", { className: "home-content" },
            React.createElement("section", { className: "home-hero", "aria-labelledby": "home-title" },
                React.createElement("div", null,
                    React.createElement("p", { className: "eyebrow hero-label" },
                        React.createElement("span", { className: "label-dot" }),
                        "A clearer way to review"),
                    React.createElement("h1", { id: "home-title" },
                        "Clear requirements.",
                        React.createElement("br", null),
                        "Confident decisions."),
                    React.createElement("p", { className: "home-intro" }, "ReqCheck turns a specification into a reviewable workspace. Repair source text, explore explainable suggestions and keep a traceable record of your decisions."),
                    React.createElement("div", { className: "hero-actions" },
                        React.createElement(ReactRouterDOM.Link, { className: "primary-button", to: "/workspace" },
                            React.createElement(Icon, { name: "arrow" }),
                            "Start Reviewing"),
                        !session ? React.createElement(ReactRouterDOM.Link, { className: "secondary-button", to: "/guest" }, "Continue as Guest") : null),
                    React.createElement("div", { className: "hero-assurances" },
                        React.createElement("span", null,
                            React.createElement(Icon, { name: "check", size: 15 }),
                            "Source-linked decisions"),
                        React.createElement("span", null,
                            React.createElement(Icon, { name: "check", size: 15 }),
                            "You stay in control")),
                    React.createElement("p", { className: "home-expectation" }, "Accounts save progress for later. Guest work is temporary and expires within 24 hours.")),
                React.createElement(WorkflowIllustration, null)),
            React.createElement("section", { "aria-labelledby": "workflow-title" },
                React.createElement("p", { className: "eyebrow" }, "From specification to evidence"),
                React.createElement("h2", { id: "workflow-title" }, "A simple four-step workflow"),
                React.createElement("div", { className: "home-step-grid" }, steps.map(function (step, index) {
                    return React.createElement("article", { className: "card home-step", key: step.title },
                        React.createElement("div", { className: "home-step-icon" },
                            React.createElement(Icon, { name: step.icon, size: 25 }),
                            React.createElement("span", null,
                                "0",
                                index + 1)),
                        React.createElement("h3", null, step.title),
                        React.createElement("p", null, step.text));
                }))),
            React.createElement("section", { className: "home-benefits", "aria-labelledby": "features-title" },
                React.createElement("div", null,
                    React.createElement("p", { className: "eyebrow" }, "Built for thoughtful review"),
                    React.createElement("h2", { id: "features-title" }, "Your judgment stays central"),
                    React.createElement("p", null, "Classification and NFR subtype suggestions support review; they are not confirmed labels or calibrated probabilities. Quality cues are prompts, not proof of defects.")),
                React.createElement("ul", null, ['Original source evidence and immutable analysis snapshots', 'Reviewer decisions with append-only history', 'Personal projects or a temporary guest workspace', 'Keyboard access and reduced-motion support'].map(function (text) { return React.createElement("li", { key: text },
                    React.createElement(Icon, { name: "check", size: 18 }),
                    React.createElement("span", null, text)); }))),
            React.createElement("section", { className: "home-final" },
                React.createElement("h2", null, "Ready to review your first document?"),
                React.createElement(ReactRouterDOM.Link, { className: "primary-button", to: "/workspace" },
                    "Start Reviewing",
                    React.createElement(Icon, { name: "arrow" }))));
    }

    var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$4 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __read$7 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function PasswordPage() {
        var request = useApi().request;
        var _a = __read$7(React.useState(''), 2), currentPassword = _a[0], setCurrentPassword = _a[1];
        var _b = __read$7(React.useState(''), 2), password = _b[0], setPassword = _b[1];
        var _c = __read$7(React.useState(''), 2), confirmPassword = _c[0], setConfirmPassword = _c[1];
        var _d = __read$7(React.useState(false), 2), busy = _d[0], setBusy = _d[1];
        var _e = __read$7(React.useState(''), 2), error = _e[0], setError = _e[1];
        var _f = __read$7(React.useState(''), 2), message = _f[0], setMessage = _f[1];
        var errorSummary = React.useRef(null);
        React.useEffect(function () { var _a; if (error)
            (_a = errorSummary.current) === null || _a === void 0 ? void 0 : _a.focus(); }, [error]);
        function submit(event) {
            var _a;
            return __awaiter$4(this, void 0, void 0, function () {
                var result, err_1;
                return __generator$4(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            event.preventDefault();
                            setError('');
                            setMessage('');
                            if (password !== confirmPassword) {
                                setError('Passwords do not match.');
                                (_a = errorSummary.current) === null || _a === void 0 ? void 0 : _a.focus();
                                return [2 /*return*/];
                            }
                            setBusy(true);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/auth/change-password', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ current_password: currentPassword, password: password, confirm_password: confirmPassword }),
                                })];
                        case 2:
                            result = _b.sent();
                            setMessage(result.message);
                            setCurrentPassword('');
                            setPassword('');
                            setConfirmPassword('');
                            return [3 /*break*/, 5];
                        case 3:
                            err_1 = _b.sent();
                            setError(err_1 instanceof Error ? err_1.message : 'Password could not be changed. Please retry.');
                            return [3 /*break*/, 5];
                        case 4:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        return React.createElement(PrivatePage, { busy: busy },
            React.createElement(ReactRouterDOM.Prompt, { when: busy, message: "Your password change is still being processed. Leave this page?" }),
            React.createElement("main", { className: "access-shell" },
                React.createElement("section", { className: "access-card" },
                    React.createElement("h1", null, "Change Password"),
                    React.createElement("p", null, "Confirm your current password. Changing it signs out other sessions; this session stays active."),
                    error ? React.createElement("p", { ref: errorSummary, tabIndex: -1, className: "notice error", role: "alert" },
                        error,
                        error === 'Passwords do not match.' ? React.createElement(React.Fragment, null,
                            " ",
                            React.createElement("a", { href: "#confirm-new-password", onClick: function (event) { var _a; event.preventDefault(); (_a = document.getElementById('confirm-new-password')) === null || _a === void 0 ? void 0 : _a.focus(); } }, "Check confirmation")) : null) : null,
                    message ? React.createElement("p", { className: "notice success", role: "status" }, message) : null,
                    React.createElement("form", { onSubmit: submit },
                        React.createElement("label", { className: "field-label", htmlFor: "current-password" }, "Current password"),
                        React.createElement(PasswordField, { id: "current-password", label: "Current password", autoComplete: "current-password", value: currentPassword, disabled: busy, onChange: setCurrentPassword }),
                        React.createElement("label", { className: "field-label", htmlFor: "new-password" }, "New password"),
                        React.createElement(PasswordField, { id: "new-password", label: "New password", autoComplete: "new-password", value: password, disabled: busy, onChange: setPassword, describedBy: "new-password-help" }),
                        React.createElement("label", { className: "field-label", htmlFor: "confirm-new-password" }, "Confirm new password"),
                        React.createElement(PasswordField, { id: "confirm-new-password", label: "Confirm new password", autoComplete: "new-password", value: confirmPassword, disabled: busy, onChange: function (value) { setConfirmPassword(value); if (error === 'Passwords do not match.')
                                setError(''); }, invalid: error === 'Passwords do not match.', describedBy: error === 'Passwords do not match.' ? 'new-password-error' : undefined }),
                        error === 'Passwords do not match.' ? React.createElement("p", { className: "field-error", id: "new-password-error" }, "Enter the same password in both fields.") : null,
                        React.createElement("p", { className: "access-help", id: "new-password-help" }, "Use a different password with 12\u2013128 characters."),
                        React.createElement("button", { type: "submit", className: "primary-button", disabled: busy }, busy ? 'Changing password…' : 'Save new password')),
                    React.createElement(ReactRouterDOM.Link, { className: "secondary-button", to: "/workspace" }, "Back to workspace"))));
    }

    var __read$8 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function ChartCard(props) {
        var _a = __read$8(React.useState(false), 2), loaded = _a[0], setLoaded = _a[1];
        var _b = __read$8(React.useState(false), 2), failed = _b[0], setFailed = _b[1];
        var _c = __read$8(React.useState(0), 2), retry = _c[0], setRetry = _c[1];
        React.useEffect(function () { setLoaded(false); setFailed(false); }, [props.src, retry]);
        return React.createElement("figure", null,
            React.createElement("figcaption", null, props.title),
            props.src ? React.createElement(React.Fragment, null,
                !loaded && !failed ? React.createElement("div", { className: "chart-placeholder", role: "status" },
                    React.createElement("span", { className: "spinner" }),
                    "Loading chart\u2026") : null,
                failed ? React.createElement("div", { className: "chart-placeholder", role: "alert" },
                    React.createElement(Icon, { name: "chart" }),
                    React.createElement("p", null, "Chart could not load."),
                    React.createElement("button", { type: "button", className: "ghost-button", onClick: function () { setRetry(retry + 1); } }, "Retry chart")) : null,
                React.createElement("img", { style: { display: loaded ? 'block' : 'none' }, src: props.src + (props.src.indexOf('?') < 0 ? '?' : '&') + 'retry=' + retry, alt: props.alt, onLoad: function () { setLoaded(true); setFailed(false); }, onError: function () { setFailed(true); setLoaded(false); } })) : React.createElement("div", { className: "chart-placeholder" },
                React.createElement(Icon, { name: "chart", size: 24 }),
                React.createElement("div", { className: "placeholder-bars", "aria-hidden": "true" },
                    React.createElement("span", null),
                    React.createElement("span", null),
                    React.createElement("span", null)),
                React.createElement("p", null,
                    "Available after your first analysis.",
                    React.createElement("br", null),
                    "Illustration only \u2014 no results yet.")));
    }

    function EmptyState(props) {
        return React.createElement("div", { className: "empty-state" },
            React.createElement("div", { className: "empty-icon" },
                React.createElement(Icon, { name: props.icon, size: 25 })),
            React.createElement("h3", null, props.title),
            React.createElement("p", null, props.description),
            props.children);
    }

    function CollapsibleSection(props) {
        return React.createElement("section", { id: props.id, className: "card card-pad collapsible-section", "aria-labelledby": props.headingId },
            React.createElement("div", { className: "card-heading disclosure-heading" },
                React.createElement("div", null,
                    React.createElement("h2", null,
                        React.createElement("button", { id: props.headingId, type: "button", className: "section-toggle", "aria-expanded": props.expanded, "aria-controls": props.id + '-content', onClick: props.onToggle },
                            React.createElement("span", null, props.title),
                            React.createElement("span", { className: "section-toggle-hint", "aria-hidden": "true" }, props.expanded ? 'Collapse' : 'Expand'),
                            React.createElement("span", { className: 'section-chevron' + (props.expanded ? ' expanded' : '') },
                                React.createElement(Icon, { name: "chevron" })))),
                    React.createElement("p", null, props.description)),
                props.actions ? React.createElement("div", { className: "section-actions", hidden: !props.expanded }, props.actions) : null),
            React.createElement("div", { id: props.id + '-content', hidden: !props.expanded }, props.children));
    }

    function scrollToSection(id) {
        var _a;
        var behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        if (id)
            (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: behavior, block: 'start' });
        else
            window.scrollTo({ top: 0, behavior: behavior });
    }
    function locationLabel(location) {
        var parts = [];
        if (location.source_id)
            parts.push(location.source_id);
        if (location.page)
            parts.push('Page ' + location.page + (location.page_end ? '-' + location.page_end : ''));
        if (location.paragraph)
            parts.push('Paragraph ' + location.paragraph);
        if (location.table) {
            parts.push('Table ' + location.table + (location.row ? ', row ' + location.row : ''));
        }
        return parts.join(' · ') || 'Source location unavailable';
    }

    function useReviewHistory(finding, open) {
        var path = '/analysis-runs/' + encodeURIComponent(finding.run_id) + '/reviews';
        // React Query v1 starts a query on a key change, not a change to `manual`.
        var query = reactQuery.useQuery(queryKey(path).concat(open ? finding.latest_review ? finding.latest_review.id : 'unreviewed' : 'closed-' + finding.id), function () { return httpRequest(path); }, { manual: !open, retry: false, throwOnError: true, refetchAllOnWindowFocus: false });
        return {
            history: query.data ? query.data.items.filter(function (event) { return event.finding_id === finding.id; }) : [],
            historyError: query.error ? query.error.message : '',
            historyLoading: query.isFetching || open && !query.data && !query.error,
        };
    }

    var __read$9 = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function FindingCard(props) {
        var _a = __read$9(React.useState(''), 2), comment = _a[0], setComment = _a[1];
        var _b = __read$9(React.useState('F'), 2), correctedLabel = _b[0], setCorrectedLabel = _b[1];
        var _c = __read$9(React.useState(''), 2), correctedText = _c[0], setCorrectedText = _c[1];
        var _d = __read$9(React.useState(false), 2), historyOpen = _d[0], setHistoryOpen = _d[1];
        var finding = props.finding;
        var _e = useReviewHistory(finding, historyOpen), history = _e.history, historyError = _e.historyError, historyLoading = _e.historyLoading;
        var matched = finding.requirement_ids
            .map(function (id) { return props.requirements.find(function (item) { return item.id === id; }); })
            .filter(function (item) { return Boolean(item); });
        var heading = finding.kind === 'classification'
            ? 'Requirement ' + finding.sequence
            : finding.kind === 'ambiguity'
                ? 'Ambiguity cue · Requirement ' + finding.sequence
                : 'Possible duplicate · ' + matched.map(function (item) { return '#' + item.sequence; }).join(' and ');
        var review = finding.latest_review;
        function decide(decision) {
            var payload = { decision: decision, comment: comment };
            if (decision === 'correct') {
                if (finding.kind === 'classification')
                    payload.corrected_label = correctedLabel;
                else
                    payload.corrected_text = correctedText.trim();
            }
            props.onReview(finding.id, payload).then(function (saved) {
                if (saved) {
                    setComment('');
                    setCorrectedText('');
                }
            });
        }
        return (React.createElement("article", { className: "finding-card" },
            React.createElement("div", { className: "finding-head" },
                React.createElement("div", null,
                    React.createElement("div", { className: "finding-kicker" }, finding.kind.replace('_', ' ')),
                    React.createElement("h3", null, heading)),
                React.createElement("span", { className: 'review-badge ' + (review ? review.decision : 'pending') }, review ? 'Reviewed · ' + review.decision : 'Needs review')),
            finding.kind === 'classification' ? (React.createElement("div", { className: "suggestion-block" },
                React.createElement("span", null, "Model suggestion"),
                React.createElement("strong", null, finding.payload.suggested_label === 'F' ? 'Functional' :
                    finding.payload.suggested_label === 'NFR' ? 'Non-functional' : finding.payload.suggested_label),
                finding.payload.suggested_subtype ? (React.createElement("span", { className: "subtype-label" },
                    finding.payload.suggested_subtype,
                    " \u00B7 exploratory subtype")) : null,
                React.createElement("p", null, "Suggestion only; this is not a calibrated confidence score or confirmed label."))) : finding.kind === 'ambiguity' ? (React.createElement("div", { className: "finding-explanation" },
                React.createElement("strong", null,
                    finding.payload.rule === 'UNDEFINED_TRIGGER' ? 'Undefined trigger' : 'Vague wording cue',
                    ": \u201C",
                    finding.payload.term,
                    "\u201D"),
                React.createElement("p", null, finding.payload.suggestion),
                React.createElement("span", null, "A review prompt, not proof that the requirement is defective."))) : (React.createElement("div", { className: "finding-explanation" },
                React.createElement("strong", null,
                    "Lexical similarity: ",
                    ((finding.payload.similarity || 0) * 100).toFixed(1),
                    "%"),
                React.createElement("p", null, finding.payload.interpretation),
                React.createElement("span", null,
                    "Threshold ",
                    finding.payload.threshold,
                    " is provisional and needs annotated validation."),
                (finding.payload.constraint_differences || []).map(function (warning) {
                    return React.createElement("p", { className: "notice warning", key: warning }, warning);
                }))),
            React.createElement("div", { className: "finding-sources" }, matched.map(function (item) {
                return (React.createElement("div", { className: "finding-source", key: item.id },
                    React.createElement("span", null,
                        "#",
                        item.sequence,
                        " \u00B7 ",
                        locationLabel(item.location)),
                    React.createElement("p", null, item.text)));
            })),
            review ? (React.createElement("div", { className: "review-history-entry" },
                React.createElement("strong", null,
                    "Latest decision: ",
                    review.decision),
                review.corrected_label ? React.createElement("span", null,
                    " \u00B7 corrected label: ",
                    review.corrected_label) : null,
                review.corrected_text ? React.createElement("p", null, review.corrected_text) : null,
                review.comment ? React.createElement("p", null, review.comment) : null)) : null,
            React.createElement("div", { className: "review-history" },
                React.createElement("button", { type: "button", className: "ghost-button", "aria-expanded": historyOpen, "aria-controls": 'history-' + finding.id, onClick: function () { setHistoryOpen(!historyOpen); } },
                    React.createElement(Icon, { name: "clock", size: 15 }),
                    "Reviewer decision history"),
                React.createElement("div", { id: 'history-' + finding.id, hidden: !historyOpen },
                    historyLoading ? React.createElement("p", { role: "status" }, "Loading review history\u2026") : null,
                    historyError ? React.createElement("p", { className: "history-error", role: "alert" }, historyError) : null,
                    !historyLoading && !historyError && historyOpen ? (history.length ? history.map(function (event) {
                        return React.createElement("div", { className: "review-history-entry", key: event.id },
                            React.createElement("strong", null,
                                event.decision,
                                " \u00B7 ",
                                new Date(event.created_at).toLocaleString()),
                            event.corrected_label ? React.createElement("p", null,
                                "Corrected label: ",
                                event.corrected_label) : null,
                            event.corrected_text ? React.createElement("p", null, event.corrected_text) : null,
                            event.comment ? React.createElement("p", null, event.comment) : null);
                    }) : React.createElement(EmptyState, { icon: "clock", title: "No reviewer decisions yet", description: "Accept, dismiss or correct this finding to start its traceable review history." })) : null)),
            React.createElement("div", { className: "finding-review-controls" },
                React.createElement("label", { className: "sr-only", htmlFor: 'review-comment-' + finding.id }, "Review note"),
                React.createElement("input", { id: 'review-comment-' + finding.id, className: "text-input", value: comment, maxLength: 2000, onChange: function (event) { setComment(event.target.value); }, placeholder: "Optional reviewer note" }),
                finding.kind === 'classification' ? (React.createElement("select", { className: "select-input correction-select", value: correctedLabel, onChange: function (event) { setCorrectedLabel(event.target.value); }, "aria-label": "Corrected requirement classification" },
                    React.createElement("option", { value: "F" }, "Functional"),
                    React.createElement("option", { value: "NFR" }, "Non-functional"))) : (React.createElement("input", { className: "text-input", value: correctedText, maxLength: 10000, onChange: function (event) { setCorrectedText(event.target.value); }, placeholder: "Corrected wording for the review record", "aria-label": "Corrected wording" })),
                React.createElement("div", { className: "finding-actions" },
                    React.createElement("button", { type: "button", className: "secondary-button", disabled: props.busy, onClick: function () { decide('accept'); } },
                        React.createElement(Icon, { name: "check" }),
                        "Accept"),
                    React.createElement("button", { type: "button", className: "ghost-button", disabled: props.busy, onClick: function () { decide('dismiss'); } },
                        React.createElement(Icon, { name: "close" }),
                        "Dismiss"),
                    React.createElement("button", { type: "button", className: "primary-button", disabled: props.busy ||
                            (finding.kind === 'classification' ? !correctedLabel : !correctedText.trim()), onClick: function () { decide('correct'); } },
                        React.createElement(Icon, { name: "edit" }),
                        "Correct")))));
    }

    function AnalysisPanel(_a) {
        var model = _a.model, expanded = _a.expanded, onToggle = _a.onToggle;
        var documentId = model.documentId, requirements = model.requirements, runs = model.runs, currentRunId = model.currentRunId, setCurrentRunId = model.setCurrentRunId, findings = model.findings, runRequirements = model.runRequirements, reviewRevision = model.reviewRevision, findingTotal = model.findingTotal, findingPage = model.findingPage, setFindingPage = model.setFindingPage, findingKind = model.findingKind, setFindingKind = model.setFindingKind, busy = model.busy, analysisReady = model.analysisReady, findingsLoading = model.findingsLoading, findingsError = model.findingsError, retryFindings = model.retryFindings, currentRun = model.currentRun, unsavedCount = model.unsavedCount, totalFindingPages = model.totalFindingPages, runAnalysis = model.runAnalysis, reviewFinding = model.reviewFinding;
        return React.createElement(React.Fragment, null,
            React.createElement(CollapsibleSection, { id: "analysis-section", headingId: "analysis-heading", title: "Analysis & reviewer decisions", description: "Classification suggestions, lexical duplicate candidates and ambiguity review cues.", expanded: expanded, onToggle: onToggle, actions: React.createElement("button", { type: "button", className: "primary-button", disabled: !documentId || !requirements.length || unsavedCount > 0 || busy || !analysisReady, onClick: runAnalysis },
                    busy ? React.createElement("span", { className: "spinner", "aria-hidden": "true" }) : React.createElement(Icon, { name: "play" }),
                    busy ? 'Working…' : 'Run analysis') },
                unsavedCount ? React.createElement("div", { className: "notice warning" }, "Corrections save automatically after typing pauses. Resolve save failures before analysis; each run uses an exact saved revision.") : null,
                !currentRun ? (React.createElement("div", null,
                    React.createElement(EmptyState, { icon: "chart", title: "Your analysis will appear here", description: documentId ? 'Review extracted statements, then choose Run analysis to see suggestions, quality cues and reviewer controls.' : 'Create a project and upload a document to unlock analysis. No predictions have been generated yet.' }),
                    React.createElement("div", { className: "chart-grid" },
                        React.createElement(ChartCard, { title: "Classification suggestions", alt: "Classification chart placeholder" }),
                        React.createElement(ChartCard, { title: "NFR subtype suggestions", alt: "NFR chart placeholder" }),
                        React.createElement(ChartCard, { title: "Reviewer decisions", alt: "Reviewer chart placeholder" }),
                        React.createElement(ChartCard, { title: "Quality review cues", alt: "Quality chart placeholder" })),
                    React.createElement(EmptyState, { icon: "download", title: "No reports to download yet", description: "After analysis, export CSV or JSON, or open a printable report. Account users can retrieve previous runs from Analysis history." }))) : (React.createElement(React.Fragment, null,
                    currentRun.stale ? React.createElement("div", { className: "notice warning" }, "This analysis is based on an earlier input revision. Run analysis again to include recent edits.") : null,
                    React.createElement("div", { className: "run-summary" },
                        React.createElement("div", null,
                            React.createElement("span", null, "Run"),
                            React.createElement("strong", null, new Date(currentRun.created_at).toLocaleString())),
                        React.createElement("div", null,
                            React.createElement("span", null, "Findings"),
                            React.createElement("strong", null, currentRun.findings_count)),
                        React.createElement("div", null,
                            React.createElement("span", null, "Input SHA-256"),
                            React.createElement("strong", { className: "hash-text" },
                                currentRun.input_revision_hash.slice(0, 16),
                                "\u2026")),
                        React.createElement("label", { className: "field-label", htmlFor: "run-history" }, "Analysis history"),
                        React.createElement("select", { id: "run-history", className: "select-input", value: currentRunId, onChange: function (event) { setCurrentRunId(event.target.value); } }, runs.filter(function (run) { return run.status === 'complete'; }).map(function (run) {
                            return React.createElement("option", { value: run.id, key: run.id },
                                new Date(run.created_at).toLocaleString(),
                                run.stale ? ' · stale' : '');
                        }))),
                    React.createElement("div", { className: "report-actions" },
                        React.createElement("a", { className: "secondary-button", href: API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/report?format=html', target: "_blank", rel: "noreferrer" },
                            React.createElement(Icon, { name: "document" }),
                            "Open printable report"),
                        React.createElement("a", { className: "secondary-button", href: API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/report?format=csv' },
                            React.createElement(Icon, { name: "download" }),
                            "Download CSV"),
                        React.createElement("a", { className: "secondary-button", href: API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/report?format=json' },
                            React.createElement(Icon, { name: "download" }),
                            "Download JSON")),
                    React.createElement("div", { className: "chart-grid" },
                        React.createElement(ChartCard, { title: "Suggested functional / non-functional distribution", src: API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/classification.png', alt: "Suggested requirement classification chart" }),
                        React.createElement(ChartCard, { title: "NFR subtype suggestions \u00B7 exploratory", src: API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/nfr.png', alt: "Exploratory suggested NFR subtype chart" }),
                        React.createElement(ChartCard, { title: "Reviewer decisions", src: API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/review.png?revision=' + reviewRevision, alt: "Reviewer decision chart" }),
                        React.createElement(ChartCard, { title: "Quality cues \u00B7 not confirmed defects", src: API + '/analysis-runs/' + encodeURIComponent(currentRunId) + '/charts/flags.png', alt: "Ambiguity and duplicate review cue counts" })),
                    React.createElement("div", { className: "finding-tabs", role: "tablist", "aria-label": "Finding type" }, ['classification', 'duplicate', 'ambiguity'].map(function (kind) {
                        return React.createElement("button", { type: "button", role: "tab", "aria-selected": findingKind === kind, id: 'finding-tab-' + kind, "aria-controls": "finding-results", tabIndex: findingKind === kind ? 0 : -1, className: findingKind === kind ? 'finding-tab active' : 'finding-tab', key: kind, onKeyDown: function (event) {
                                var tabs = Array.from(event.currentTarget.parentElement.querySelectorAll('[role="tab"]'));
                                var index = tabs.indexOf(event.currentTarget);
                                var target = event.key === 'ArrowRight' ? (index + 1) % tabs.length :
                                    event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length :
                                        event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
                                if (target >= 0) {
                                    event.preventDefault();
                                    tabs[target].focus();
                                }
                            }, onClick: function () { if (findingKind !== kind) {
                                setFindingKind(kind);
                                setFindingPage(1);
                            } } }, kind === 'classification' ? 'Classification' : kind === 'duplicate' ? 'Possible duplicates' : 'Ambiguity cues');
                    })),
                    React.createElement("div", { id: "finding-results", role: "tabpanel", "aria-labelledby": 'finding-tab-' + findingKind, tabIndex: 0, "aria-busy": findingsLoading, className: "finding-results" },
                        React.createElement("div", { className: "findings-meta", role: "status" }, findingsLoading ? 'Loading ' + findingKind + ' findings…' :
                            findingsError ? 'Findings could not be refreshed.' :
                                findingTotal + ' ' + findingKind + ' finding(s) · reviewer decisions are append-only'),
                        findingsError ? React.createElement("div", { className: "notice error", role: "alert" },
                            React.createElement("span", null, findingsError),
                            React.createElement("button", { type: "button", className: "secondary-button", onClick: retryFindings }, "Retry findings")) : null,
                        React.createElement("div", { className: "finding-results-body" }, findingsLoading ? React.createElement("div", { className: "finding-skeleton", "aria-hidden": "true" },
                            React.createElement("div", null),
                            React.createElement("div", null),
                            React.createElement("div", null)) : findings.length ? React.createElement("div", { className: "finding-page-content", key: currentRunId + findingKind + findingPage }, findings.map(function (finding) {
                            return React.createElement(FindingCard, { key: finding.id, finding: finding, requirements: runRequirements, busy: busy, onReview: reviewFinding });
                        })) : !findingsError ? React.createElement(EmptyState, { icon: "check", title: findingKind === 'duplicate' ? 'No duplicate candidates' : findingKind === 'ambiguity' ? 'No ambiguity cues' : 'No classification findings', description: "No items of this type were returned for this page. This is not proof of defect-free requirements; you can still review the text or select another finding type." }) : null),
                        React.createElement("div", { className: "pagination" },
                            React.createElement("button", { className: "secondary-button", type: "button", disabled: findingsLoading || Boolean(findingsError) || findingPage <= 1, onClick: function () { setFindingPage(findingPage - 1); } },
                                React.createElement("span", { className: "previous-icon" },
                                    React.createElement(Icon, { name: "arrow" })),
                                "Previous"),
                            React.createElement("span", null, findingsLoading ? 'Loading page ' + findingPage : findingsError ? 'Page unavailable' : 'Page ' + findingPage + ' of ' + totalFindingPages),
                            React.createElement("button", { className: "secondary-button", type: "button", disabled: findingsLoading || Boolean(findingsError) || findingPage >= totalFindingPages, onClick: function () { setFindingPage(findingPage + 1); } },
                                "Next",
                                React.createElement(Icon, { name: "arrow" })))),
                    React.createElement("p", { className: "caveat-copy" }, "Duplicate threshold is provisional; lexical overlap does not establish semantic equivalence. Classification scores are suggestions and not calibrated probabilities. Do not treat exploratory subtype output as validated performance.")))));
    }

    function RequirementReview(_a) {
        var model = _a.model, expanded = _a.expanded, onToggle = _a.onToggle;
        var documentId = model.documentId, requirements = model.requirements, savedTexts = model.savedTexts, selectedForMerge = model.selectedForMerge, newText = model.newText, setNewText = model.setNewText, search = model.search, setSearch = model.setSearch, busy = model.busy, documentLoading = model.documentLoading, saveStates = model.saveStates, selectedDocument = model.selectedDocument, unsavedCount = model.unsavedCount, visibleRequirements = model.visibleRequirements, savingCount = model.savingCount, updateRequirementText = model.updateRequirementText, saveRequirement = model.saveRequirement, reloadSavedRequirement = model.reloadSavedRequirement, addRequirement = model.addRequirement, splitRequirement = model.splitRequirement, mergeSelectedRequirements = model.mergeSelectedRequirements, deleteRequirement = model.deleteRequirement, toggleMergeSelection = model.toggleMergeSelection;
        return React.createElement(CollapsibleSection, { id: "review-section", headingId: "review-heading", title: "Review extracted requirements", description: selectedDocument ? requirements.length + ' statements · ' + unsavedCount + ' unsaved. Review source text before analysis.' : 'Upload a source document to begin.', expanded: expanded, onToggle: onToggle }, documentLoading ? React.createElement("div", { className: "loading-placeholder", role: "status" },
            React.createElement("span", { className: "spinner" }),
            "Loading saved requirements\u2026",
            React.createElement("div", { className: "skeleton-lines", "aria-hidden": "true" },
                React.createElement("span", null),
                React.createElement("span", null),
                React.createElement("span", null))) : !documentId ? (React.createElement(EmptyState, { icon: "edit", title: "Your review starts here", description: "Create or select a project, then upload a TXT, DOCX or searchable PDF." })) : (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "review-toolbar" },
                React.createElement("div", { className: "review-count" },
                    requirements.length,
                    " active \u00B7 ",
                    unsavedCount,
                    " unsaved"),
                React.createElement("div", { className: "search-wrap" },
                    React.createElement(Icon, { name: "search", size: 15 }),
                    React.createElement("input", { className: "search-input", type: "search", value: search, onChange: function (event) { setSearch(event.target.value); }, placeholder: "Find in extracted text", "aria-label": "Search requirements" }))),
            selectedForMerge.length ? (React.createElement("div", { className: "merge-toolbar" },
                React.createElement("span", null,
                    selectedForMerge.length,
                    " selected \u00B7 select two adjacent statements to merge"),
                React.createElement("button", { type: "button", className: "secondary-button", disabled: busy || savingCount > 0 || unsavedCount > 0 || selectedForMerge.length !== 2, onClick: mergeSelectedRequirements },
                    React.createElement(Icon, { name: "merge" }),
                    "Merge selected"))) : null,
            React.createElement("div", { className: "review-list" }, visibleRequirements.length ? visibleRequirements.map(function (item) {
                var unsaved = savedTexts[item.id] !== item.text;
                return (React.createElement("article", { className: 'requirement-card' + (unsaved ? ' has-unsaved-edits' : ''), key: item.id },
                    React.createElement("div", { className: "requirement-top" },
                        React.createElement("div", { className: "item-label" },
                            React.createElement("input", { type: "checkbox", checked: selectedForMerge.indexOf(item.id) !== -1, onChange: function () { toggleMergeSelection(item.id); }, "aria-label": 'Select requirement ' + item.sequence + ' to merge' }),
                            React.createElement("span", { className: "item-index" }, item.sequence),
                            " Requirement"),
                        React.createElement("span", { role: "status", className: 'saved-state' + (unsaved ? '' : ' is-saved') + (saveStates[item.id] === 'failed' ? ' save-failed' : '') },
                            saveStates[item.id] === 'saving' ? React.createElement("span", { className: "spinner" }) : React.createElement(Icon, { name: saveStates[item.id] === 'failed' ? 'close' : unsaved ? 'edit' : 'check', size: 13 }),
                            saveStates[item.id] === 'saving' ? 'Saving…' : saveStates[item.id] === 'failed' ? 'Save failed — draft kept' : unsaved ? item.text.trim() ? 'Waiting to save…' : 'Enter text to save' : 'Saved')),
                    React.createElement("label", { className: "sr-only", htmlFor: 'req-' + item.id },
                        "Edit requirement ",
                        item.sequence),
                    React.createElement("textarea", { id: 'req-' + item.id, className: "textarea", maxLength: 10000, value: item.text, onChange: function (event) { updateRequirementText(item.id, event.target.value); } }),
                    React.createElement("div", { className: "requirement-bottom" },
                        React.createElement("span", { className: "source-meta" }, locationLabel(item.location)),
                        React.createElement("div", { className: "requirement-actions" },
                            React.createElement("button", { type: "button", className: "ghost-button", disabled: busy || savingCount > 0 || unsavedCount > 0 || item.text.indexOf('\n') === -1, title: "Add a line break between statements first", onClick: function () { splitRequirement(item); } },
                                React.createElement(Icon, { name: "split", size: 15 }),
                                "Split at line breaks"),
                            React.createElement("button", { type: "button", className: "danger-button", disabled: busy || savingCount > 0 || unsavedCount > 0, onClick: function () { deleteRequirement(item); } },
                                React.createElement(Icon, { name: "trash", size: 15 }),
                                "Remove"),
                            saveStates[item.id] === 'failed' ? React.createElement("button", { type: "button", className: "ghost-button", onClick: function () { reloadSavedRequirement(item); } }, "Compare saved version") : null,
                            React.createElement("button", { type: "button", className: "primary-button save-button", disabled: busy || saveStates[item.id] === 'saving' || !unsaved || !item.text.trim(), onClick: function () { saveRequirement(item); } },
                                React.createElement(Icon, { name: "save", size: 15 }),
                                saveStates[item.id] === 'failed' ? 'Retry save' : 'Save correction')))));
            }) : React.createElement(EmptyState, { icon: requirements.length ? 'search' : 'edit', title: requirements.length ? 'No matches' : 'No active requirements', description: requirements.length ? 'Change the search text to find your requirements.' : 'Add a missed statement below or upload a different document.' })),
            React.createElement("form", { className: "add-form", onSubmit: addRequirement },
                React.createElement("label", { className: "field-label", htmlFor: "new-requirement" }, "Add a missing requirement"),
                React.createElement("textarea", { id: "new-requirement", className: "textarea", maxLength: 10000, value: newText, onChange: function (event) { setNewText(event.target.value); }, placeholder: "Write one complete requirement statement\u2026" }),
                React.createElement("div", { className: "add-form-footer" },
                    React.createElement("span", { className: "add-hint" }, "Preserves this as a manually added statement."),
                    React.createElement("button", { type: "submit", className: "secondary-button", disabled: busy || savingCount > 0 || unsavedCount > 0 || !newText.trim() },
                        React.createElement(Icon, { name: "plus" }),
                        "Add requirement"))))));
    }

    var __read$a = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function DocumentUpload(props) {
        var _a = __read$a(React.useState(false), 2), dragging = _a[0], setDragging = _a[1];
        var input = React.useRef(null);
        var browseButton = React.useRef(null);
        var restoreBrowseFocus = React.useRef(false);
        React.useEffect(function () {
            var _a;
            if (!props.file && restoreBrowseFocus.current) {
                (_a = browseButton.current) === null || _a === void 0 ? void 0 : _a.focus();
                restoreBrowseFocus.current = false;
            }
        }, [props.file]);
        function browse() { var _a; if (!props.busy)
            (_a = input.current) === null || _a === void 0 ? void 0 : _a.click(); }
        return React.createElement("form", { onSubmit: props.onUpload, className: "document-upload" },
            props.file ? React.createElement("div", { className: "notice upload-pending", role: "status" },
                React.createElement(Icon, { name: "document" }),
                React.createElement("span", null,
                    React.createElement("strong", null, "Document selected - not uploaded yet."),
                    " Choose Upload document to save it to this project and extract requirements.")) : null,
            React.createElement("div", { className: 'upload-zone' + (dragging ? ' dragging' : '') + (props.file ? ' has-file' : ''), onDragOver: function (event) { event.preventDefault(); if (!props.busy)
                    setDragging(true); }, onDragLeave: function (event) { if (!event.currentTarget.contains(event.relatedTarget))
                    setDragging(false); }, onDrop: function (event) { event.preventDefault(); setDragging(false); if (!props.busy)
                    props.onSelect(event.dataTransfer.files[0]); }, role: "region", "aria-label": "Choose or drop a TXT, DOCX or searchable PDF" },
                React.createElement("input", { ref: input, id: "document-file", className: "file-input-hidden", type: "file", accept: ".txt,.docx,.pdf", disabled: props.busy, onChange: function (event) { props.onSelect(event.target.files ? event.target.files[0] : undefined); event.target.value = ''; } }),
                props.file ? React.createElement("div", { className: "file-chip" },
                    React.createElement("div", { className: "file-type" },
                        React.createElement(Icon, { name: "document", size: 23 })),
                    React.createElement("div", { className: "file-info" },
                        React.createElement("strong", { title: props.file.name }, props.file.name),
                        React.createElement("span", null,
                            Math.max(1, Math.ceil(props.file.size / 1024)),
                            " KB \u00B7 ready to upload")),
                    React.createElement("button", { type: "button", className: "remove-file", disabled: props.busy, "aria-label": 'Remove selected file ' + props.file.name, onClick: function () { restoreBrowseFocus.current = true; props.onRemove(); } },
                        React.createElement(Icon, { name: "close", size: 16 }),
                        React.createElement("span", null, "Remove"))) : React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "upload-icon" },
                        React.createElement(Icon, { name: "upload", size: 27 })),
                    React.createElement("h3", { className: "upload-title" }, dragging ? 'Drop the file to select it' : props.firstDocument ? 'Add your first document' : 'Add another document'),
                    React.createElement("p", { className: "upload-help" }, "Drag a document here or choose a file to get started."),
                    React.createElement("button", { ref: browseButton, type: "button", className: "primary-button browse-button", disabled: props.busy, onClick: browse },
                        React.createElement(Icon, { name: "folder" }),
                        "Browse files"),
                    React.createElement("p", { className: "upload-formats" },
                        "TXT, DOCX or searchable PDF ",
                        React.createElement("span", { "aria-hidden": "true" }, "\u00B7"),
                        " Up to 10 MiB"),
                    React.createElement("p", { className: "upload-next-step" },
                        React.createElement(Icon, { name: "check", size: 15 }),
                        "Review and repair extracted text before analysis."))),
            props.file ? React.createElement("div", { className: "upload-footer" },
                React.createElement("span", { className: "format-hint" }, "Selected locally. Requirements appear after upload."),
                React.createElement("button", { type: "submit", className: "primary-button", disabled: props.disabled || props.busy || !props.file },
                    props.busy ? React.createElement("span", { className: "spinner", "aria-hidden": "true" }) : React.createElement(Icon, { name: "upload" }),
                    props.busy ? 'Please wait…' : 'Upload document')) : null);
    }

    function validateUpload(candidate) {
        var extension = candidate.name.split('.').pop().toLowerCase();
        if (['txt', 'docx', 'pdf'].indexOf(extension) === -1)
            return 'That file type is not supported. Choose a TXT, DOCX or searchable PDF.';
        if (candidate.size === 0)
            return 'This file is empty. Choose a document that contains text.';
        if (candidate.size > 10 * 1024 * 1024)
            return 'This file is larger than 10 MB. Choose a smaller document to continue.';
        return null;
    }
    function showEmptyDocuments(hasProject, savedCount, hasSelectedFile, loading) {
        return hasProject && savedCount === 0 && !hasSelectedFile && !loading;
    }

    function SourceDocuments(_a) {
        var model = _a.model, expanded = _a.expanded, onToggle = _a.onToggle;
        var documentsLoading = model.documentsLoading, projects = model.projects, projectId = model.projectId, setProjectId = model.setProjectId, documents = model.documents, documentId = model.documentId, setDocumentId = model.setDocumentId, setShowCreateProject = model.setShowCreateProject, setConfirmation = model.setConfirmation, file = model.file, setFile = model.setFile, busy = model.busy, showManageProject = model.showManageProject, setShowManageProject = model.setShowManageProject, manageName = model.manageName, setManageName = model.setManageName, manageDescription = model.manageDescription, setManageDescription = model.setManageDescription, confirmProjectName = model.confirmProjectName, setConfirmProjectName = model.setConfirmProjectName, selectedProject = model.selectedProject, unsavedCount = model.unsavedCount, savingCount = model.savingCount, acceptFile = model.acceptFile, uploadDocument = model.uploadDocument, manageProject = model.manageProject, removeProject = model.removeProject, deleteDocument = model.deleteDocument;
        var projectOptions = projects.map(function (project) { return React.createElement("option", { key: project.id, value: project.id }, project.name); });
        return React.createElement(CollapsibleSection, { id: "upload-section", headingId: "upload-heading", title: "Project & source document", description: "Supported input: UTF-8 TXT, DOCX and searchable PDF \u00B7 Maximum 10 MiB", expanded: expanded, onToggle: onToggle, actions: React.createElement("button", { type: "button", className: "secondary-button", disabled: busy || unsavedCount > 0 || savingCount > 0, onClick: function () { setShowCreateProject(true); } },
                React.createElement(Icon, { name: "plus" }),
                "Create project") },
            projects.length ? React.createElement("div", { className: "workspace-project-picker" },
                React.createElement("label", { className: "field-label", htmlFor: "project-switcher" }, "Review project"),
                React.createElement("select", { id: "project-switcher", className: "select-input", value: projectId, disabled: busy || savingCount > 0, onChange: function (event) {
                        if (unsavedCount)
                            setConfirmation({ kind: 'switch-project', projectId: event.target.value });
                        else {
                            setProjectId(event.target.value);
                            setDocumentId('');
                        }
                    } },
                    React.createElement("option", { value: "" }, "Select a project"),
                    projectOptions)) : null,
            !selectedProject ? React.createElement(EmptyState, { icon: "folder", title: "Create your first project", description: "A project keeps your documents, review decisions and analysis results together." },
                React.createElement("button", { type: "button", className: "primary-button", onClick: function () { setShowCreateProject(true); } },
                    React.createElement(Icon, { name: "plus" }),
                    "Create project")) : React.createElement("div", { className: "project-management" },
                React.createElement("button", { type: "button", className: "ghost-button", "aria-expanded": showManageProject, onClick: function () {
                        setManageName(selectedProject.name);
                        setManageDescription(selectedProject.description);
                        setShowManageProject(!showManageProject);
                    } },
                    React.createElement(Icon, { name: "folder" }),
                    "Manage project"),
                showManageProject ? React.createElement("form", { className: "manage-project-form", onSubmit: manageProject },
                    React.createElement("label", { className: "field-label", htmlFor: "manage-project-name" }, "Project name"),
                    React.createElement("input", { id: "manage-project-name", className: "text-input", value: manageName, required: true, maxLength: 120, onChange: function (event) { setManageName(event.target.value); } }),
                    React.createElement("label", { className: "field-label", htmlFor: "manage-project-description" }, "Description"),
                    React.createElement("textarea", { id: "manage-project-description", className: "textarea", value: manageDescription, maxLength: 1000, onChange: function (event) { setManageDescription(event.target.value); } }),
                    React.createElement("button", { type: "submit", className: "secondary-button", disabled: busy || !manageName.trim() }, "Save project details"),
                    React.createElement("label", { className: "field-label", htmlFor: "delete-project-confirm" },
                        "To delete this project and all its data, type ",
                        selectedProject.name),
                    React.createElement("input", { id: "delete-project-confirm", className: "text-input", value: confirmProjectName, onChange: function (event) { setConfirmProjectName(event.target.value); } }),
                    React.createElement("button", { type: "button", className: "danger-button", disabled: busy || unsavedCount > 0 || savingCount > 0 || confirmProjectName !== selectedProject.name, onClick: removeProject }, "Delete project and all data")) : null),
            documentsLoading ? React.createElement("p", { className: "loading", role: "status" },
                React.createElement("span", { className: "spinner" }),
                "Loading saved documents...") : null,
            !documentsLoading && documents.length > 0 ? (React.createElement("div", { className: "document-select-wrap" },
                React.createElement("label", { className: "field-label", htmlFor: "document-switcher" }, "Open a saved document"),
                React.createElement("div", { className: "document-row" },
                    React.createElement("select", { id: "document-switcher", className: "select-input", value: documentId, disabled: busy || savingCount > 0, onChange: function (event) {
                            if (unsavedCount) {
                                setConfirmation({ kind: 'switch-document', documentId: event.target.value });
                            }
                            else {
                                setDocumentId(event.target.value);
                            }
                        } }, documents.map(function (item) { return React.createElement("option", { key: item.id, value: item.id }, item.original_name); })),
                    React.createElement("button", { type: "button", className: "danger-button", disabled: busy || savingCount > 0, onClick: deleteDocument },
                        React.createElement(Icon, { name: "trash", size: 15 }),
                        "Delete document")))) : null,
            selectedProject && !documentsLoading ? React.createElement(DocumentUpload, { file: file, busy: busy, disabled: savingCount > 0 || !projectId, firstDocument: showEmptyDocuments(true, documents.length, Boolean(file), false), onSelect: acceptFile, onRemove: function () { setFile(null); }, onUpload: uploadDocument }) : null);
    }

    function WorkspaceDialogs(_a) {
        var model = _a.model;
        var projectName = model.projectName, setProjectName = model.setProjectName, projectDescription = model.projectDescription, setProjectDescription = model.setProjectDescription, showCreateProject = model.showCreateProject, setShowCreateProject = model.setShowCreateProject, confirmation = model.confirmation, setConfirmation = model.setConfirmation, deleteDocumentText = model.deleteDocumentText, setDeleteDocumentText = model.setDeleteDocumentText, busy = model.busy, handleDialogKeyDown = model.handleDialogKeyDown, createProject = model.createProject, confirmAction = model.confirmAction;
        return React.createElement(React.Fragment, null,
            showCreateProject ? (React.createElement("div", { className: "modal-backdrop", onMouseDown: function (event) { if (event.target === event.currentTarget && !busy)
                    setShowCreateProject(false); } },
                React.createElement("section", { className: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "new-project-heading", onKeyDown: handleDialogKeyDown },
                    React.createElement("div", { className: "modal-header" },
                        React.createElement("div", null,
                            React.createElement("h2", { id: "new-project-heading" }, "Create a project"),
                            React.createElement("p", null, "Keep related documents and analysis runs together.")),
                        React.createElement("button", { type: "button", className: "icon-button", disabled: busy, onClick: function () { setShowCreateProject(false); }, "aria-label": "Close dialog" },
                            React.createElement(Icon, { name: "close" }))),
                    React.createElement("form", { onSubmit: createProject },
                        React.createElement("label", { className: "field-label", htmlFor: "new-project-name" }, "Project name"),
                        React.createElement("input", { id: "new-project-name", className: "text-input", required: true, maxLength: 120, value: projectName, onChange: function (event) { setProjectName(event.target.value); }, placeholder: "e.g. Mobile banking app" }),
                        React.createElement("label", { className: "field-label", htmlFor: "new-project-description" }, "Description (optional)"),
                        React.createElement("textarea", { id: "new-project-description", className: "textarea", maxLength: 1000, value: projectDescription, onChange: function (event) { setProjectDescription(event.target.value); } }),
                        React.createElement("div", { className: "modal-actions" },
                            React.createElement("button", { type: "button", className: "secondary-button", disabled: busy, onClick: function () { setShowCreateProject(false); } }, "Cancel"),
                            React.createElement("button", { type: "submit", className: "primary-button", disabled: busy || !projectName.trim() }, busy ? 'Creating…' : 'Create project')))))) : null,
            confirmation ? (React.createElement("div", { className: "modal-backdrop", onMouseDown: function (event) {
                    if (event.target === event.currentTarget && !busy)
                        setConfirmation(null);
                } },
                React.createElement("section", { className: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "confirmation-heading", onKeyDown: handleDialogKeyDown },
                    React.createElement("div", { className: "modal-header" },
                        React.createElement("div", null,
                            React.createElement("h2", { id: "confirmation-heading" }, confirmation.kind === 'switch-project' ? 'Switch projects?' :
                                confirmation.kind === 'switch-document' ? 'Discard unsaved edits?' :
                                    confirmation.kind === 'upload-document' ? 'Upload and discard unsaved edits?' :
                                        confirmation.kind === 'delete-requirement' ? 'Remove this requirement?' : 'Delete this document?'),
                            React.createElement("p", null, confirmation.kind === 'switch-project' ? 'Your unsaved changes will be lost if you switch projects.' :
                                confirmation.kind === 'switch-document' ? 'Your unsaved changes will be lost if you switch documents.' :
                                    confirmation.kind === 'upload-document' ? 'Your unsaved changes will be lost when the new document is opened.' :
                                        confirmation.kind === 'delete-requirement' ? 'This removes the statement from the active review list. Existing analysis runs remain traceable.' :
                                            'This permanently removes the document, extracted statements, analysis runs and review events.')),
                        React.createElement("button", { type: "button", className: "icon-button", disabled: busy, onClick: function () { setConfirmation(null); }, "aria-label": "Close dialog" },
                            React.createElement(Icon, { name: "close" }))),
                    confirmation.kind === 'delete-document' ? (React.createElement("div", null,
                        React.createElement("p", { className: "confirmation-file-name" }, confirmation.document.original_name),
                        React.createElement("label", { className: "field-label", htmlFor: "document-delete-confirm" }, "Type the filename exactly to confirm"),
                        React.createElement("input", { id: "document-delete-confirm", className: "text-input", value: deleteDocumentText, onChange: function (event) { setDeleteDocumentText(event.target.value); }, autoComplete: "off" }))) : null,
                    React.createElement("div", { className: "modal-actions" },
                        React.createElement("button", { type: "button", className: "secondary-button", disabled: busy, onClick: function () { setConfirmation(null); } }, "Cancel"),
                        React.createElement("button", { type: "button", className: confirmation.kind === 'delete-requirement'
                                || confirmation.kind === 'delete-document' ? 'danger-button' : 'primary-button', disabled: busy || (confirmation.kind === 'delete-document'
                                && deleteDocumentText !== confirmation.document.original_name), onClick: confirmAction }, busy ? 'Please wait…' :
                            confirmation.kind === 'switch-document' ? 'Discard & switch' :
                                confirmation.kind === 'switch-project' ? 'Discard & switch project' :
                                    confirmation.kind === 'upload-document' ? 'Discard & upload' :
                                        confirmation.kind === 'delete-requirement' ? 'Remove requirement' : 'Delete document'))))) : null);
    }

    function WorkspaceSummary(_a) {
        var model = _a.model;
        var session = model.session, requirements = model.requirements, runs = model.runs, selectedProject = model.selectedProject, selectedDocument = model.selectedDocument, unsavedCount = model.unsavedCount;
        return React.createElement(React.Fragment, null,
            React.createElement("aside", { className: "right-column", "aria-label": "Workspace status" },
                React.createElement("section", { className: "card summary-card" },
                    React.createElement("div", { className: "summary-top" },
                        React.createElement("h3", null, "Workspace snapshot")),
                    React.createElement("div", { className: "summary-number" }, requirements.length),
                    React.createElement("div", { className: "summary-label" }, "active requirement statements"),
                    React.createElement("div", { className: "summary-divider" }),
                    React.createElement("div", { className: "summary-line" },
                        React.createElement("span", null, "Project"),
                        React.createElement("strong", { title: selectedProject ? selectedProject.name : '' }, selectedProject ? selectedProject.name : 'Not selected')),
                    React.createElement("div", { className: "summary-line" },
                        React.createElement("span", null, "Document"),
                        React.createElement("strong", { title: selectedDocument ? selectedDocument.original_name : '' }, selectedDocument ? selectedDocument.original_name : 'Not uploaded')),
                    React.createElement("div", { className: "summary-line" },
                        React.createElement("span", null, "Unsaved edits"),
                        React.createElement("strong", null, unsavedCount ? unsavedCount : 'All saved')),
                    React.createElement("div", { className: "summary-line" },
                        React.createElement("span", null, "Analysis runs"),
                        React.createElement("strong", null, runs.length))),
                React.createElement("div", { className: "tip-card" },
                    React.createElement("div", { className: "tip-heading" }, "Review tip"),
                    React.createElement("p", null, "PDF line and column layout may affect extraction. Check text carefully, then save corrections before running an analysis.")),
                React.createElement("div", { className: "security-line" }, session.kind === 'guest' ? 'Temporary uploads and processing records are deleted on session end or expiry. Download any reports you need before leaving.' : 'Only your signed-in account can access your projects and results. This local prototype is not a substitute for a production deployment security assessment.')));
    }

    var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$5 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    function readHealth() {
        return reactQuery.queryCache.prefetchQuery(['health'], function () {
            return __awaiter$5(this, void 0, void 0, function () {
                var response, body;
                return __generator$5(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch(API + '/health', { credentials: 'include' })];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 2:
                            body = _a.sent();
                            return [2 /*return*/, { ok: response.ok, status: body.detail || body }];
                    }
                });
            });
        }, { force: true, retry: false, throwOnError: true });
    }

    var __read$b = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function useActiveSection() {
        var _a = __read$b(React.useState('overview'), 2), activeSection = _a[0], setActiveSection = _a[1];
        React.useEffect(function () {
            var frame = 0;
            function updateSection() {
                frame = 0;
                if (window.scrollY < 120) {
                    setActiveSection('overview');
                    return;
                }
                var section = 'overview';
                ['upload-section', 'review-section', 'analysis-section'].forEach(function (id) {
                    var element = document.getElementById(id);
                    if (element && element.getBoundingClientRect().top <= 180)
                        section = id;
                });
                setActiveSection(section);
            }
            function trackScroll() { if (!frame)
                frame = window.requestAnimationFrame(updateSection); }
            window.addEventListener('scroll', trackScroll, { passive: true });
            updateSection();
            return function () {
                window.removeEventListener('scroll', trackScroll);
                if (frame)
                    window.cancelAnimationFrame(frame);
            };
        }, []);
        return { activeSection: activeSection, setActiveSection: setActiveSection };
    }

    function useDialogFocus(open, busy, dismiss) {
        React.useEffect(function () {
            if (!open)
                return;
            var previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            var dialog = document.querySelector('[role="dialog"]');
            var initialControl = (dialog === null || dialog === void 0 ? void 0 : dialog.querySelector('input, textarea')) || (dialog === null || dialog === void 0 ? void 0 : dialog.querySelector('button:not(:disabled)'));
            initialControl === null || initialControl === void 0 ? void 0 : initialControl.focus();
            return function () { previousFocus === null || previousFocus === void 0 ? void 0 : previousFocus.focus(); };
        }, [open]);
        return function handleDialogKeyDown(event) {
            if (event.key === 'Escape' && !busy)
                dismiss();
            if (event.key !== 'Tab')
                return;
            var controls = event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)');
            if (!controls.length)
                return;
            var first = controls[0];
            var last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
    }

    function useRequirementAutosave(options) {
        var requirements = options.requirements, savedTexts = options.savedTexts, saveStates = options.saveStates, busy = options.busy, savingCount = options.savingCount, unsavedCount = options.unsavedCount, save = options.save;
        React.useEffect(function () {
            if (busy || savingCount)
                return;
            var item = requirements.find(function (requirement) {
                return savedTexts[requirement.id] !== requirement.text
                    && requirement.text.trim() && saveStates[requirement.id] !== 'failed';
            });
            if (!item)
                return;
            var timer = window.setTimeout(function () { save(item); }, 700);
            return function () { window.clearTimeout(timer); };
        }, [requirements, savedTexts, saveStates, busy, savingCount, save]);
        React.useEffect(function () {
            function warnBeforeLeaving(event) {
                if (!unsavedCount && !savingCount)
                    return;
                event.preventDefault();
                event.returnValue = '';
            }
            window.addEventListener('beforeunload', warnBeforeLeaving);
            return function () { window.removeEventListener('beforeunload', warnBeforeLeaving); };
        }, [unsavedCount, savingCount]);
    }

    function useFindingPages(runId, kind, page) {
        var root = '/analysis-runs/' + encodeURIComponent(runId);
        var path = root + '/findings?kind=' + kind + '&page=' + page + '&page_size=50';
        var snapshotPath = root + '/requirements';
        var config = { manual: !runId, staleTime: 30000, retry: false, throwOnError: false };
        var result = reactQuery.useQuery(queryKey(path), function () {
            return httpRequest(path);
        }, config);
        var snapshot = reactQuery.useQuery(queryKey(snapshotPath), function () {
            return httpRequest(snapshotPath);
        }, { manual: !runId, staleTime: Infinity, retry: false, throwOnError: false });
        var error = result.error || snapshot.error;
        return {
            findings: runId && result.data ? result.data.items : [],
            findingTotal: runId && result.data ? result.data.total : 0,
            runRequirements: runId && snapshot.data ? snapshot.data.items : [],
            findingsLoading: Boolean(runId && !error && (!result.data || !snapshot.data)),
            findingsError: runId && error ? error.message : '',
            retryFindings: function () {
                result.refetch();
                snapshot.refetch();
            },
            updateFindingReview: function (id, review) {
                reactQuery.queryCache.setQueryData(queryKey(path), function (data) {
                    if (!data)
                        return data;
                    return Object.assign({}, data, {
                        items: data.items.map(function (item) {
                            return item.id === id ? Object.assign({}, item, { latest_review: review }) : item;
                        }),
                    });
                });
            },
        };
    }

    var __awaiter$6 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$6 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __read$c = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function useWorkspace(props) {
        var auth = useAuth();
        var _a = useApi(), request = _a.request, requestDelete = _a.requestDelete;
        var _b = __read$c(React.useState([]), 2), projects = _b[0], setProjects = _b[1];
        var _c = __read$c(React.useState(''), 2), projectId = _c[0], setProjectId = _c[1];
        var _d = __read$c(React.useState([]), 2), documents = _d[0], setDocuments = _d[1];
        var _e = __read$c(React.useState(''), 2), documentId = _e[0], setDocumentId = _e[1];
        var _f = __read$c(React.useState([]), 2), requirements = _f[0], setRequirements = _f[1];
        var _g = __read$c(React.useState(''), 2), inputHash = _g[0], setInputHash = _g[1];
        var _h = __read$c(React.useState({}), 2), savedTexts = _h[0], setSavedTexts = _h[1];
        var _j = __read$c(React.useState([]), 2), selectedForMerge = _j[0], setSelectedForMerge = _j[1];
        var _k = __read$c(React.useState([]), 2), runs = _k[0], setRuns = _k[1];
        var _l = __read$c(React.useState(''), 2), currentRunId = _l[0], setCurrentRunId = _l[1];
        var _m = __read$c(React.useState(0), 2), reviewRevision = _m[0], setReviewRevision = _m[1];
        var _o = __read$c(React.useState(1), 2), findingPage = _o[0], setFindingPage = _o[1];
        var _p = __read$c(React.useState('classification'), 2), findingKind = _p[0], setFindingKind = _p[1];
        var _q = __read$c(React.useState(''), 2), projectName = _q[0], setProjectName = _q[1];
        var _r = __read$c(React.useState(''), 2), projectDescription = _r[0], setProjectDescription = _r[1];
        var _s = __read$c(React.useState(false), 2), showCreateProject = _s[0], setShowCreateProject = _s[1];
        var _t = __read$c(React.useState(null), 2), confirmation = _t[0], setConfirmation = _t[1];
        var _u = __read$c(React.useState(''), 2), deleteDocumentText = _u[0], setDeleteDocumentText = _u[1];
        var _v = __read$c(React.useState(null), 2), file = _v[0], setFile = _v[1];
        var _w = __read$c(React.useState(''), 2), newText = _w[0], setNewText = _w[1];
        var _x = __read$c(React.useState(''), 2), search = _x[0], setSearch = _x[1];
        var _y = __read$c(React.useState(false), 2), busy = _y[0], setBusy = _y[1];
        var _z = __read$c(React.useState(true), 2), loading = _z[0], setLoading = _z[1];
        var _0 = __read$c(React.useState(false), 2), apiReady = _0[0], setApiReady = _0[1];
        var _1 = __read$c(React.useState(false), 2), analysisReady = _1[0], setAnalysisReady = _1[1];
        var _2 = __read$c(React.useState(''), 2), analysisNotice = _2[0], setAnalysisNotice = _2[1];
        var _3 = __read$c(React.useState(''), 2), error = _3[0], setError = _3[1];
        var _4 = __read$c(React.useState(''), 2), message = _4[0], setMessage = _4[1];
        var _5 = __read$c(React.useState(false), 2), documentLoading = _5[0], setDocumentLoading = _5[1];
        var _6 = __read$c(React.useState(false), 2), documentsLoading = _6[0], setDocumentsLoading = _6[1];
        var _7 = __read$c(React.useState({}), 2), saveStates = _7[0], setSaveStates = _7[1];
        var inFlight = React.useRef({});
        var mounted = React.useRef(true);
        var activeDocument = React.useRef(documentId);
        activeDocument.current = documentId;
        var activeProject = React.useRef(projectId);
        activeProject.current = projectId;
        var draftPrefix = 'reqcheck.draft.' + props.session.owner_id + '.';
        var selectionPrefix = 'reqcheck.' + props.session.owner_id + '.';
        var selectionStorage = props.session.kind === 'account' ? localStorage : sessionStorage;
        var _8 = __read$c(React.useState(false), 2), showManageProject = _8[0], setShowManageProject = _8[1];
        var _9 = __read$c(React.useState(''), 2), manageName = _9[0], setManageName = _9[1];
        var _10 = __read$c(React.useState(''), 2), manageDescription = _10[0], setManageDescription = _10[1];
        var _11 = __read$c(React.useState(''), 2), confirmProjectName = _11[0], setConfirmProjectName = _11[1];
        var _12 = useActiveSection(), activeSection = _12.activeSection, setActiveSection = _12.setActiveSection;
        var selectedProject = projects.find(function (item) { return item.id === projectId; });
        var selectedDocument = documents.find(function (item) { return item.id === documentId; });
        var currentRun = runs.find(function (item) { return item.id === currentRunId; });
        var _13 = useFindingPages(currentRun && currentRun.status === 'complete' ? currentRunId : '', findingKind, findingPage), findings = _13.findings, findingTotal = _13.findingTotal, runRequirements = _13.runRequirements, findingsLoading = _13.findingsLoading, findingsError = _13.findingsError, retryFindings = _13.retryFindings, updateFindingReview = _13.updateFindingReview;
        var unsavedCount = requirements.filter(function (item) {
            return Object.prototype.hasOwnProperty.call(savedTexts, item.id)
                && savedTexts[item.id] !== item.text;
        }).length;
        var visibleRequirements = requirements.filter(function (item) {
            return item.text.toLowerCase().includes(search.trim().toLowerCase());
        });
        var totalFindingPages = Math.max(1, Math.ceil(findingTotal / 50));
        var savingCount = Object.keys(saveStates).filter(function (id) { return saveStates[id] === 'saving'; }).length;
        React.useEffect(function () {
            return function () {
                mounted.current = false;
                activeDocument.current = '';
                activeProject.current = '';
            };
        }, []);
        useRequirementAutosave({ requirements: requirements, savedTexts: savedTexts, saveStates: saveStates, busy: busy, savingCount: savingCount, unsavedCount: unsavedCount, save: saveRequirement });
        var handleDialogKeyDown = useDialogFocus(showCreateProject || Boolean(confirmation), busy, function () { setShowCreateProject(false); setConfirmation(null); });
        function clearNotices() {
            setError('');
            setMessage('');
        }
        function refreshRequirements(selectedId) {
            return __awaiter$6(this, void 0, void 0, function () {
                var first, pages, page, next, items, nextSaved;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!selectedId) {
                                setRequirements([]);
                                setSavedTexts({});
                                setInputHash('');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, request('/documents/' + encodeURIComponent(selectedId) + '/requirements?page=1&page_size=100')];
                        case 1:
                            first = _a.sent();
                            pages = [first.items];
                            page = 2;
                            _a.label = 2;
                        case 2:
                            if (!((page - 1) * first.page_size < first.total)) return [3 /*break*/, 5];
                            return [4 /*yield*/, request('/documents/' + encodeURIComponent(selectedId) +
                                    '/requirements?page=' + page + '&page_size=' + first.page_size)];
                        case 3:
                            next = _a.sent();
                            pages.push(next.items);
                            _a.label = 4;
                        case 4:
                            page += 1;
                            return [3 /*break*/, 2];
                        case 5:
                            items = [].concat.apply([], pages).map(function (item) { return Object.assign({}, item); });
                            if (activeDocument.current !== selectedId)
                                return [2 /*return*/];
                            nextSaved = {};
                            items.forEach(function (item) { nextSaved[item.id] = item.text; });
                            if (props.session.kind === 'account') {
                                items.forEach(function (item) {
                                    var draft = localStorage.getItem(draftPrefix + item.id);
                                    if (draft) {
                                        try {
                                            var restored = JSON.parse(draft);
                                            if (typeof restored.text !== 'string' || typeof restored.revision !== 'number')
                                                throw new Error('Invalid local draft');
                                            if (restored.text === item.text)
                                                localStorage.removeItem(draftPrefix + item.id);
                                            else {
                                                item.text = restored.text;
                                                if (restored.revision !== item.revision) {
                                                    setSaveStates(function (states) {
                                                        var _a;
                                                        return Object.assign({}, states, (_a = {}, _a[item.id] = 'failed', _a));
                                                    });
                                                    setError('A saved requirement changed while you were away. Your local draft is preserved. Compare it with the saved version before retrying.');
                                                }
                                            }
                                        }
                                        catch (err) {
                                            setError('A local draft could not be read. Your server-saved text is still available.');
                                        }
                                    }
                                });
                            }
                            setRequirements(items);
                            setInputHash(first.input_hash || '');
                            setRuns(function (current) {
                                return current.map(function (run) {
                                    return Object.assign({}, run, { stale: run.input_revision_hash !== first.input_hash });
                                });
                            });
                            setSavedTexts(nextSaved);
                            return [2 /*return*/];
                    }
                });
            });
        }
        function loadDocuments(selectedProjectId) {
            return __awaiter$6(this, void 0, void 0, function () {
                var result, storedId, selected;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!selectedProjectId) {
                                setDocuments([]);
                                setDocumentId('');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, request('/projects/' + encodeURIComponent(selectedProjectId) + '/documents?page=1&page_size=100')];
                        case 1:
                            result = _a.sent();
                            if (activeProject.current !== selectedProjectId)
                                return [2 /*return*/];
                            setDocuments(result.items);
                            storedId = selectionStorage.getItem(selectionPrefix + 'document') || '';
                            selected = result.items.find(function (item) { return item.id === storedId; })
                                || result.items[0];
                            setDocumentId(selected ? selected.id : '');
                            return [2 /*return*/];
                    }
                });
            });
        }
        React.useEffect(function () {
            var active = true;
            function initialize() {
                return __awaiter$6(this, void 0, void 0, function () {
                    var health, status_1, healthError_1, result, storedId_1, selected, err_1;
                    return __generator$6(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 6, 7, 8]);
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, readHealth()];
                            case 2:
                                health = _a.sent();
                                if (!active)
                                    return [2 /*return*/];
                                status_1 = health.status;
                                setApiReady(health.ok || status_1.database === 'ready');
                                setAnalysisReady(status_1.analysis === 'ready' && health.ok);
                                if (!health.ok && status_1.analysis_error) {
                                    setAnalysisNotice(status_1.analysis_error);
                                }
                                return [3 /*break*/, 4];
                            case 3:
                                healthError_1 = _a.sent();
                                if (!active)
                                    return [2 /*return*/];
                                setApiReady(false);
                                setError(healthError_1 instanceof Error ? healthError_1.message : 'Could not check API health.');
                                return [3 /*break*/, 4];
                            case 4: return [4 /*yield*/, request('/projects?page=1&page_size=100')];
                            case 5:
                                result = _a.sent();
                                if (!active)
                                    return [2 /*return*/];
                                setProjects(result.items);
                                storedId_1 = selectionStorage.getItem(selectionPrefix + 'project') || '';
                                selected = result.items.find(function (item) { return item.id === storedId_1; })
                                    || result.items[0];
                                setProjectId(selected ? selected.id : '');
                                return [3 /*break*/, 8];
                            case 6:
                                err_1 = _a.sent();
                                if (active)
                                    setError(err_1 instanceof Error ? err_1.message : 'Could not load the workspace.');
                                return [3 /*break*/, 8];
                            case 7:
                                if (active)
                                    setLoading(false);
                                return [7 /*endfinally*/];
                            case 8: return [2 /*return*/];
                        }
                    });
                });
            }
            initialize();
            return function () { active = false; };
        }, []);
        React.useEffect(function () {
            if (loading)
                return;
            selectionStorage.setItem(selectionPrefix + 'project', projectId);
            var active = true;
            setDocumentsLoading(Boolean(projectId));
            setDocuments([]);
            loadDocuments(projectId).catch(function (err) {
                if (active)
                    setError(err instanceof Error ? err.message : 'Could not load project documents.');
            }).then(function () { if (active)
                setDocumentsLoading(false); });
            return function () { active = false; };
        }, [projectId, loading]);
        React.useEffect(function () {
            if (!documentId) {
                setDocumentLoading(false);
                setSaveStates({});
                selectionStorage.removeItem(selectionPrefix + 'document');
                setRequirements([]);
                setSavedTexts({});
                setInputHash('');
                setRuns([]);
                setCurrentRunId('');
                return;
            }
            selectionStorage.setItem(selectionPrefix + 'document', documentId);
            var active = true;
            setDocumentLoading(true);
            function loadDocumentWorkspace() {
                return __awaiter$6(this, void 0, void 0, function () {
                    var result, recent, err_2;
                    return __generator$6(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, 4, 5]);
                                return [4 /*yield*/, refreshRequirements(documentId)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, request('/documents/' + encodeURIComponent(documentId) + '/analysis-runs?page=1&page_size=100')];
                            case 2:
                                result = _a.sent();
                                if (!active)
                                    return [2 /*return*/];
                                setRuns(result.items);
                                recent = result.items.find(function (item) { return item.status === 'complete'; });
                                setCurrentRunId(recent ? recent.id : '');
                                return [3 /*break*/, 5];
                            case 3:
                                err_2 = _a.sent();
                                if (active)
                                    setError(err_2 instanceof Error ? err_2.message : 'Could not load document review data.');
                                return [3 /*break*/, 5];
                            case 4:
                                if (active)
                                    setDocumentLoading(false);
                                return [7 /*endfinally*/];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            }
            loadDocumentWorkspace();
            return function () { active = false; };
        }, [documentId]);
        function createProject(event) {
            return __awaiter$6(this, void 0, void 0, function () {
                var project_1, err_3;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            event.preventDefault();
                            if (!projectName.trim())
                                return [2 /*return*/];
                            setBusy(true);
                            clearNotices();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/projects', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: projectName.trim(),
                                        description: projectDescription.trim(),
                                    }),
                                })];
                        case 2:
                            project_1 = _a.sent();
                            setProjects(function (items) { return [project_1].concat(items); });
                            setProjectName('');
                            setProjectDescription('');
                            setShowCreateProject(false);
                            setProjectId(project_1.id);
                            setMessage('Project created. Add a requirements document to begin.');
                            return [3 /*break*/, 5];
                        case 3:
                            err_3 = _a.sent();
                            setError(err_3 instanceof Error ? err_3.message : 'Could not create the project.');
                            return [3 /*break*/, 5];
                        case 4:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        function acceptFile(candidate) {
            if (!candidate || busy)
                return;
            clearNotices();
            var error = validateUpload(candidate);
            if (error) {
                setFile(null);
                setError(error);
            }
            else
                setFile(candidate);
        }
        function submitUpload() {
            return __awaiter$6(this, void 0, void 0, function () {
                var form, result, documentsResult, err_4;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!file || !projectId)
                                return [2 /*return*/];
                            setBusy(true);
                            clearNotices();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, 5, 6]);
                            form = new FormData();
                            form.append('file', file);
                            return [4 /*yield*/, request('/projects/' + encodeURIComponent(projectId) + '/documents', { method: 'POST', body: form })];
                        case 2:
                            result = _a.sent();
                            setFile(null);
                            return [4 /*yield*/, request('/projects/' + encodeURIComponent(projectId) + '/documents?page=1&page_size=100')];
                        case 3:
                            documentsResult = _a.sent();
                            setDocuments(documentsResult.items);
                            setDocumentId(result.id);
                            setRequirements(result.requirements);
                            setInputHash('');
                            setRuns([]);
                            setCurrentRunId('');
                            setMessage('Document uploaded. Review the extracted statements and save corrections before analysis.');
                            props.onNavigate('review-section');
                            return [3 /*break*/, 6];
                        case 4:
                            err_4 = _a.sent();
                            setError(err_4 instanceof Error ? err_4.message : 'The document could not be uploaded.');
                            return [3 /*break*/, 6];
                        case 5:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        function uploadDocument(event) {
            return __awaiter$6(this, void 0, void 0, function () {
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            event.preventDefault();
                            if (!file || !projectId)
                                return [2 /*return*/];
                            if (unsavedCount) {
                                setConfirmation({ kind: 'upload-document' });
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, submitUpload()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function removeLocalDrafts(project, document, ids) {
            if (props.session.kind !== 'account')
                return;
            try {
                Object.keys(localStorage).filter(function (key) { return key.indexOf(draftPrefix) === 0; }).forEach(function (key) {
                    var draft = JSON.parse(localStorage.getItem(key) || '{}');
                    if (ids.indexOf(key.slice(draftPrefix.length)) !== -1
                        || project && draft.project_id === project || document && draft.document_id === document) {
                        localStorage.removeItem(key);
                    }
                });
            }
            catch (err) {
                setError('Server operation completed, but local draft cleanup failed. Remove this account’s browser drafts before using a shared device.');
            }
        }
        function updateRequirementText(id, text) {
            setSaveStates(function (states) {
                var _a;
                return Object.assign({}, states, (_a = {}, _a[id] = states[id] === 'saving' ? 'saving' : 'pending', _a));
            });
            setRequirements(function (items) {
                return items.map(function (item) {
                    if (item.id === id && props.session.kind === 'account') {
                        try {
                            localStorage.setItem(draftPrefix + id, JSON.stringify({ text: text, revision: item.revision, document_id: documentId, project_id: projectId }));
                        }
                        catch (err) {
                            setError('Local draft storage is unavailable. Keep this page open until the server confirms Saved.');
                        }
                    }
                    return item.id === id ? Object.assign({}, item, { text: text }) : item;
                });
            });
        }
        function saveRequirement(item) {
            return __awaiter$6(this, void 0, void 0, function () {
                var savingDocument, updated_1, state_1, err_5, err_6;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (inFlight.current[item.id])
                                return [2 /*return*/];
                            inFlight.current[item.id] = true;
                            savingDocument = documentId;
                            clearNotices();
                            setSaveStates(function (states) {
                                var _a;
                                return Object.assign({}, states, (_a = {}, _a[item.id] = 'saving', _a));
                            });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 7, 8, 9]);
                            return [4 /*yield*/, request('/requirements/' + encodeURIComponent(item.id), {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ text: item.text, expected_revision: item.revision }),
                                })];
                        case 2:
                            updated_1 = _a.sent();
                            if (activeDocument.current !== savingDocument)
                                return [2 /*return*/];
                            setRequirements(function (items) {
                                return items.map(function (current) {
                                    if (current.id !== updated_1.id)
                                        return current;
                                    var next = Object.assign({}, updated_1, { text: current.text === item.text ? updated_1.text : current.text });
                                    if (props.session.kind === 'account') {
                                        try {
                                            if (next.text === updated_1.text)
                                                localStorage.removeItem(draftPrefix + updated_1.id);
                                            else
                                                localStorage.setItem(draftPrefix + updated_1.id, JSON.stringify({ text: next.text, revision: updated_1.revision, document_id: savingDocument, project_id: projectId }));
                                        }
                                        catch (err) {
                                            setError('Correction saved to the server, but local draft storage could not be updated.');
                                        }
                                    }
                                    return next;
                                });
                            });
                            setSavedTexts(function (current) {
                                var _a;
                                return Object.assign({}, current, (_a = {}, _a[updated_1.id] = updated_1.text, _a));
                            });
                            setSaveStates(function (states) {
                                var _a;
                                return Object.assign({}, states, (_a = {}, _a[item.id] = 'saved', _a));
                            });
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, request('/documents/' + encodeURIComponent(savingDocument) + '/requirements?page=1&page_size=1')];
                        case 4:
                            state_1 = _a.sent();
                            if (activeDocument.current !== savingDocument)
                                return [2 /*return*/];
                            setInputHash(state_1.input_hash || '');
                            setRuns(function (items) {
                                return items.map(function (run) {
                                    return Object.assign({}, run, {
                                        stale: run.input_revision_hash !== state_1.input_hash,
                                    });
                                });
                            });
                            return [3 /*break*/, 6];
                        case 5:
                            err_5 = _a.sent();
                            if (activeDocument.current !== savingDocument)
                                return [2 /*return*/];
                            setInputHash('');
                            setError('Correction saved, but analysis-version refresh failed. Reload before analyzing. ' +
                                (err_5 instanceof Error ? err_5.message : 'Could not refresh the document.'));
                            return [3 /*break*/, 6];
                        case 6: return [3 /*break*/, 9];
                        case 7:
                            err_6 = _a.sent();
                            if (!mounted.current)
                                return [2 /*return*/];
                            setSaveStates(function (states) {
                                var _a;
                                return Object.assign({}, states, (_a = {}, _a[item.id] = 'failed', _a));
                            });
                            setError(err_6 instanceof Error ? err_6.message : 'Could not save this correction.');
                            return [3 /*break*/, 9];
                        case 8:
                            inFlight.current[item.id] = false;
                            if (mounted.current)
                                setSaveStates(function (states) {
                                    var next = Object.assign({}, states);
                                    if (activeDocument.current !== savingDocument)
                                        delete next[item.id];
                                    return next;
                                });
                            return [7 /*endfinally*/];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        }
        function reloadSavedRequirement(item) {
            return __awaiter$6(this, void 0, void 0, function () {
                var pageNumber, saved, page, savedRecord_1, err_7;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            pageNumber = 1;
                            saved = void 0;
                            _a.label = 1;
                        case 1: return [4 /*yield*/, request('/documents/' + encodeURIComponent(documentId) + '/requirements?page=' + pageNumber + '&page_size=100')];
                        case 2:
                            page = _a.sent();
                            saved = page.items.find(function (record) { return record.id === item.id; });
                            if (saved || pageNumber * page.page_size >= page.total)
                                return [3 /*break*/, 4];
                            pageNumber += 1;
                            _a.label = 3;
                        case 3:
                            if (pageNumber <= 5) return [3 /*break*/, 1];
                            _a.label = 4;
                        case 4:
                            if (!saved)
                                throw new Error('This requirement is no longer available in the saved document. Your draft remains in the editor.');
                            savedRecord_1 = saved;
                            setError('Saved version: ' + saved.text + ' Your draft remains in the editor. Choose Retry save only if you intend to replace this version.');
                            setRequirements(function (items) {
                                return items.map(function (current) {
                                    return current.id === savedRecord_1.id ? Object.assign({}, current, { revision: savedRecord_1.revision }) : current;
                                });
                            });
                            setSavedTexts(function (texts) {
                                var _a;
                                return Object.assign({}, texts, (_a = {}, _a[savedRecord_1.id] = savedRecord_1.text, _a));
                            });
                            return [3 /*break*/, 6];
                        case 5:
                            err_7 = _a.sent();
                            setError(err_7 instanceof Error ? err_7.message : 'Could not retrieve the saved version.');
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        function manageProject(event) {
            return __awaiter$6(this, void 0, void 0, function () {
                var updated_2, err_8;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            event.preventDefault();
                            setBusy(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/projects/' + encodeURIComponent(projectId), {
                                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: manageName, description: manageDescription }),
                                })];
                        case 2:
                            updated_2 = _a.sent();
                            setProjects(function (items) { return items.map(function (item) { return item.id === updated_2.id ? updated_2 : item; }); });
                            setMessage('Project details saved to your workspace.');
                            setShowManageProject(false);
                            return [3 /*break*/, 5];
                        case 3:
                            err_8 = _a.sent();
                            setError(err_8 instanceof Error ? err_8.message : 'Project details could not be saved.');
                            return [3 /*break*/, 5];
                        case 4:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        function removeProject() {
            return __awaiter$6(this, void 0, void 0, function () {
                var err_9;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!selectedProject || confirmProjectName !== selectedProject.name)
                                return [2 /*return*/];
                            setBusy(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, requestDelete('/projects/' + encodeURIComponent(projectId) + '?confirm_name=' + encodeURIComponent(confirmProjectName))];
                        case 2:
                            _a.sent();
                            removeLocalDrafts(projectId, '', requirements.map(function (item) { return item.id; }));
                            setProjects(function (items) { return items.filter(function (item) { return item.id !== projectId; }); });
                            setProjectId('');
                            setShowManageProject(false);
                            setConfirmProjectName('');
                            setMessage('Project and its documents, results and reviews deleted.');
                            return [3 /*break*/, 5];
                        case 3:
                            err_9 = _a.sent();
                            setError(err_9 instanceof Error ? err_9.message : 'Project deletion failed.');
                            return [3 /*break*/, 5];
                        case 4:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        function addRequirement(event) {
            return __awaiter$6(this, void 0, void 0, function () {
                var err_10;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            event.preventDefault();
                            if (!newText.trim() || !documentId)
                                return [2 /*return*/];
                            setBusy(true);
                            clearNotices();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, 5, 6]);
                            return [4 /*yield*/, request('/documents/' + encodeURIComponent(documentId) + '/requirements', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ text: newText.trim() }),
                                })];
                        case 2:
                            _a.sent();
                            setNewText('');
                            return [4 /*yield*/, refreshRequirements(documentId)];
                        case 3:
                            _a.sent();
                            setMessage('Requirement added to the review list.');
                            return [3 /*break*/, 6];
                        case 4:
                            err_10 = _a.sent();
                            setError(err_10 instanceof Error ? err_10.message : 'Could not add this requirement.');
                            return [3 /*break*/, 6];
                        case 5:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        function splitRequirement(item) {
            return __awaiter$6(this, void 0, void 0, function () {
                var parts, err_11;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            parts = item.text.split(/\r?\n/).map(function (part) { return part.trim(); }).filter(Boolean);
                            if (parts.length < 2) {
                                setError('Add a line break where the statements should split, then choose Split at line breaks.');
                                return [2 /*return*/];
                            }
                            setBusy(true);
                            clearNotices();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, 5, 6]);
                            return [4 /*yield*/, request('/requirements/' + encodeURIComponent(item.id) + '/split', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ expected_revision: item.revision, texts: parts }),
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, refreshRequirements(documentId)];
                        case 3:
                            _a.sent();
                            setMessage('Statement split. The new statement retains the original source location.');
                            return [3 /*break*/, 6];
                        case 4:
                            err_11 = _a.sent();
                            setError(err_11 instanceof Error ? err_11.message : 'Could not split this statement.');
                            return [3 /*break*/, 6];
                        case 5:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        function mergeSelectedRequirements() {
            return __awaiter$6(this, void 0, void 0, function () {
                var selected, err_12;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (selectedForMerge.length !== 2)
                                return [2 /*return*/];
                            if (unsavedCount) {
                                setError('Save or discard unsaved edits before merging statements.');
                                return [2 /*return*/];
                            }
                            selected = selectedForMerge
                                .map(function (id) { return requirements.find(function (item) { return item.id === id; }); })
                                .filter(function (item) { return Boolean(item); })
                                .sort(function (left, right) { return left.sequence - right.sequence; });
                            if (selected.length !== 2)
                                return [2 /*return*/];
                            setBusy(true);
                            clearNotices();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, 5, 6]);
                            return [4 /*yield*/, request('/requirements/' + encodeURIComponent(selected[0].id) + '/merge', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        other_requirement_id: selected[1].id,
                                        expected_revision: selected[0].revision,
                                        other_expected_revision: selected[1].revision,
                                    }),
                                })];
                        case 2:
                            _a.sent();
                            setSelectedForMerge([]);
                            return [4 /*yield*/, refreshRequirements(documentId)];
                        case 3:
                            _a.sent();
                            setMessage('Statements merged. The original source text remains available in the record.');
                            return [3 /*break*/, 6];
                        case 4:
                            err_12 = _a.sent();
                            setError(err_12 instanceof Error ? err_12.message : 'Could not merge these statements.');
                            return [3 /*break*/, 6];
                        case 5:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        function deleteRequirement(item) {
            setConfirmation({ kind: 'delete-requirement', requirement: item });
        }
        function deleteDocument() {
            if (!selectedDocument)
                return;
            setDeleteDocumentText('');
            setConfirmation({ kind: 'delete-document', document: selectedDocument });
        }
        function confirmAction() {
            return __awaiter$6(this, void 0, void 0, function () {
                var item, item_1, remaining, err_13;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!confirmation)
                                return [2 /*return*/];
                            if (confirmation.kind === 'switch-document') {
                                removeLocalDrafts('', documentId, requirements.map(function (item) { return item.id; }));
                                setDocumentId(confirmation.documentId);
                                setConfirmation(null);
                                return [2 /*return*/];
                            }
                            if (confirmation.kind === 'switch-project') {
                                removeLocalDrafts('', documentId, requirements.map(function (item) { return item.id; }));
                                setProjectId(confirmation.projectId);
                                setDocumentId('');
                                setConfirmation(null);
                                return [2 /*return*/];
                            }
                            if (!(confirmation.kind === 'upload-document')) return [3 /*break*/, 2];
                            removeLocalDrafts('', documentId, requirements.map(function (item) { return item.id; }));
                            setConfirmation(null);
                            return [4 /*yield*/, submitUpload()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                        case 2:
                            if (confirmation.kind === 'delete-document'
                                && deleteDocumentText !== confirmation.document.original_name)
                                return [2 /*return*/];
                            setBusy(true);
                            clearNotices();
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 9, 10, 11]);
                            if (!(confirmation.kind === 'delete-requirement')) return [3 /*break*/, 6];
                            item = confirmation.requirement;
                            return [4 /*yield*/, requestDelete('/requirements/' + encodeURIComponent(item.id), {
                                    expected_revision: item.revision,
                                })];
                        case 4:
                            _a.sent();
                            removeLocalDrafts('', '', [item.id]);
                            return [4 /*yield*/, refreshRequirements(documentId)];
                        case 5:
                            _a.sent();
                            setMessage('Requirement removed from the active list. Previous runs remain traceable.');
                            return [3 /*break*/, 8];
                        case 6:
                            item_1 = confirmation.document;
                            return [4 /*yield*/, requestDelete('/documents/' + encodeURIComponent(item_1.id) +
                                    '?confirm_name=' + encodeURIComponent(deleteDocumentText))];
                        case 7:
                            _a.sent();
                            removeLocalDrafts('', item_1.id, requirements.map(function (requirement) { return requirement.id; }));
                            remaining = documents.filter(function (document) { return document.id !== item_1.id; });
                            setDocuments(remaining);
                            setDocumentId(documentId === item_1.id && remaining.length ? remaining[0].id : '');
                            setMessage('Document and its associated workspace data were deleted.');
                            setDeleteDocumentText('');
                            _a.label = 8;
                        case 8:
                            setConfirmation(null);
                            return [3 /*break*/, 11];
                        case 9:
                            err_13 = _a.sent();
                            setError(err_13 instanceof Error ? err_13.message : 'Could not complete this action.');
                            return [3 /*break*/, 11];
                        case 10:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 11: return [2 /*return*/];
                    }
                });
            });
        }
        function runAnalysis() {
            return __awaiter$6(this, void 0, void 0, function () {
                var run_1, err_14;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!documentId || !inputHash || unsavedCount)
                                return [2 /*return*/];
                            setBusy(true);
                            clearNotices();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/documents/' + encodeURIComponent(documentId) + '/analysis-runs', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ expected_input_hash: inputHash }),
                                })];
                        case 2:
                            run_1 = _a.sent();
                            setRuns(function (items) { return [run_1].concat(items.filter(function (item) { return item.id !== run_1.id; })); });
                            setCurrentRunId(run_1.id);
                            setFindingKind('classification');
                            setFindingPage(1);
                            if (run_1.status === 'complete') {
                                setMessage('Analysis completed. Suggestions are ready for human review.');
                            }
                            else {
                                setCurrentRunId('');
                                setError(run_1.error || 'Analysis did not complete.');
                            }
                            return [3 /*break*/, 5];
                        case 3:
                            err_14 = _a.sent();
                            setError(err_14 instanceof Error ? err_14.message : 'Could not start analysis.');
                            return [3 /*break*/, 5];
                        case 4:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        function reviewFinding(findingId, payload) {
            return __awaiter$6(this, void 0, void 0, function () {
                var event_1, err_15;
                return __generator$6(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setBusy(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, request('/findings/' + encodeURIComponent(findingId) + '/reviews', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload),
                                })];
                        case 2:
                            event_1 = _a.sent();
                            updateFindingReview(findingId, event_1);
                            setMessage('Reviewer decision recorded in the immutable history.');
                            setReviewRevision(function (value) { return value + 1; });
                            return [2 /*return*/, true];
                        case 3:
                            err_15 = _a.sent();
                            setError(err_15 instanceof Error ? err_15.message : 'Could not record this review decision.');
                            return [2 /*return*/, false];
                        case 4:
                            setBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        function toggleMergeSelection(id) {
            setSelectedForMerge(function (current) {
                if (current.indexOf(id) !== -1)
                    return current.filter(function (item) { return item !== id; });
                if (current.length >= 2)
                    return [current[1], id];
                return current.concat([id]);
            });
        }
        return {
            auth: auth, projects: projects, projectId: projectId, documents: documents,
            documentId: documentId, showCreateProject: showCreateProject, setShowCreateProject: setShowCreateProject, confirmation: confirmation,
            busy: busy, loading: loading, apiReady: apiReady, analysisReady: analysisReady,
            analysisNotice: analysisNotice, error: error, message: message, activeSection: activeSection,
            setActiveSection: setActiveSection, selectedProject: selectedProject, currentRun: currentRun, unsavedCount: unsavedCount,
            savingCount: savingCount, requirements: requirements, runs: runs, currentRunId: currentRunId,
            setCurrentRunId: setCurrentRunId, findings: findings, runRequirements: runRequirements, reviewRevision: reviewRevision,
            findingTotal: findingTotal, findingPage: findingPage, setFindingPage: setFindingPage, findingKind: findingKind,
            setFindingKind: setFindingKind, findingsLoading: findingsLoading, findingsError: findingsError, retryFindings: retryFindings, totalFindingPages: totalFindingPages, runAnalysis: runAnalysis,
            reviewFinding: reviewFinding, savedTexts: savedTexts, selectedForMerge: selectedForMerge, newText: newText,
            setNewText: setNewText, search: search, setSearch: setSearch, documentLoading: documentLoading,
            saveStates: saveStates, selectedDocument: selectedDocument, visibleRequirements: visibleRequirements, updateRequirementText: updateRequirementText,
            saveRequirement: saveRequirement, reloadSavedRequirement: reloadSavedRequirement, addRequirement: addRequirement, splitRequirement: splitRequirement,
            mergeSelectedRequirements: mergeSelectedRequirements, deleteRequirement: deleteRequirement, toggleMergeSelection: toggleMergeSelection, documentsLoading: documentsLoading,
            setProjectId: setProjectId, setDocumentId: setDocumentId, setConfirmation: setConfirmation, file: file,
            setFile: setFile, showManageProject: showManageProject, setShowManageProject: setShowManageProject, manageName: manageName,
            setManageName: setManageName, manageDescription: manageDescription, setManageDescription: setManageDescription, confirmProjectName: confirmProjectName,
            setConfirmProjectName: setConfirmProjectName, acceptFile: acceptFile, uploadDocument: uploadDocument, manageProject: manageProject,
            removeProject: removeProject, deleteDocument: deleteDocument, projectName: projectName, setProjectName: setProjectName,
            projectDescription: projectDescription, setProjectDescription: setProjectDescription, deleteDocumentText: deleteDocumentText, setDeleteDocumentText: setDeleteDocumentText,
            handleDialogKeyDown: handleDialogKeyDown, createProject: createProject, confirmAction: confirmAction,
            session: props.session
        };
    }

    var __assign = (undefined && undefined.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var __read$d = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    function WorkspacePage() {
        var session = useAuth().session;
        if (!session)
            throw new Error("Workspace rendered without a session.");
        return React.createElement(Workspace, { key: session.owner_id, session: session });
    }
    function Workspace(props) {
        var _a = __read$d(React.useState({
            'upload-section': true, 'review-section': true, 'analysis-section': true
        }), 2), expandedSections = _a[0], setExpandedSections = _a[1];
        var _b = __read$d(React.useState(''), 2), navigationTarget = _b[0], setNavigationTarget = _b[1];
        function navigateSection(id) {
            if (id !== 'overview')
                setExpandedSections(function (previous) {
                    var _a;
                    return __assign(__assign({}, previous), (_a = {}, _a[id] = true, _a));
                });
            setNavigationTarget(id);
        }
        function toggleSection(id) {
            setExpandedSections(function (previous) {
                var _a;
                return __assign(__assign({}, previous), (_a = {}, _a[id] = !previous[id], _a));
            });
        }
        var model = useWorkspace({ session: props.session, onNavigate: navigateSection });
        var session = model.session, auth = model.auth, projectId = model.projectId, documentId = model.documentId, showCreateProject = model.showCreateProject, setShowCreateProject = model.setShowCreateProject, confirmation = model.confirmation, busy = model.busy, loading = model.loading, apiReady = model.apiReady, analysisReady = model.analysisReady, analysisNotice = model.analysisNotice, error = model.error, message = model.message, activeSection = model.activeSection, setActiveSection = model.setActiveSection, selectedProject = model.selectedProject, currentRun = model.currentRun, unsavedCount = model.unsavedCount, savingCount = model.savingCount;
        React.useEffect(function () {
            if (!navigationTarget || loading)
                return;
            setActiveSection(navigationTarget);
            if (navigationTarget !== 'overview') {
                var heading = document.querySelector('#' + navigationTarget + ' .section-toggle');
                if (heading)
                    heading.focus({ preventScroll: true });
            }
            scrollToSection(navigationTarget === 'overview' ? undefined : navigationTarget);
            setNavigationTarget('');
        }, [navigationTarget, loading, setActiveSection]);
        return React.createElement("div", { className: "app-shell" },
            React.createElement(ReactRouterDOM.Prompt, { when: busy || unsavedCount > 0 || savingCount > 0, message: function () {
                    return busy ? false : 'Changes are not fully saved. Leave this page? Account drafts can be recovered; guest unsaved edits will be lost.';
                } }),
            React.createElement("aside", { className: "sidebar", "aria-hidden": showCreateProject || Boolean(confirmation) },
                React.createElement("div", { className: "brand" },
                    React.createElement("div", { className: "brand-mark" },
                        React.createElement(Icon, { name: "shield", size: 23 })),
                    React.createElement("div", { className: "brand-copy" },
                        React.createElement("div", { className: "brand-name" }, "ReqCheck"),
                        React.createElement("div", { className: "brand-caption" }, "Requirements workspace"))),
                React.createElement("div", { className: "nav-label" }, "Workspace"),
                React.createElement("nav", { className: "side-nav", "aria-label": "Workspace navigation" }, [
                    { id: 'overview', label: 'Overview', icon: 'overview' },
                    { id: 'upload-section', label: 'Documents', icon: 'document' },
                    { id: 'review-section', label: 'Text review', icon: 'edit' },
                    { id: 'analysis-section', label: 'Analysis & reports', icon: 'chart' },
                ].map(function (item) {
                    return React.createElement("button", { key: item.id, type: "button", className: 'nav-item' + (activeSection === item.id ? ' active' : ''), "aria-label": item.label, "aria-current": activeSection === item.id ? 'location' : undefined, title: item.label, onClick: function () { navigateSection(item.id); } },
                        React.createElement(Icon, { name: item.icon }),
                        React.createElement("span", null, item.label));
                })),
                React.createElement("div", { className: "sidebar-spacer" }),
                React.createElement("div", { className: "sidebar-note" },
                    React.createElement("div", { className: "note-icon" },
                        React.createElement(Icon, { name: "shield" })),
                    React.createElement("strong", null, "A human-first workflow"),
                    React.createElement("p", null, "Suggestions support review. You remain responsible for requirement decisions.")),
                React.createElement("div", { className: "sidebar-footer" },
                    React.createElement("div", { className: "avatar" },
                        React.createElement(Icon, { name: "user", size: 17 })),
                    React.createElement("div", { className: "user-copy" },
                        React.createElement("strong", null, session.name || 'Guest'),
                        React.createElement("div", null, session.email || 'Not saved to an account')))),
            React.createElement("div", { className: "workspace", "aria-hidden": showCreateProject || Boolean(confirmation) },
                React.createElement("header", { className: "topbar" },
                    React.createElement("div", { className: "breadcrumbs" },
                        "Workspace ",
                        React.createElement("span", null, "/"),
                        " ",
                        React.createElement("strong", null, selectedProject ? selectedProject.name : 'Overview')),
                    React.createElement("div", { className: "topbar-right" },
                        React.createElement("div", { className: 'connection' + (apiReady ? ' ready' : '') },
                            React.createElement("span", { className: "connection-dot" }),
                            apiReady ? 'API connected' : loading ? 'Connecting…' : 'API unavailable'),
                        React.createElement(AccountMenu, { disabled: busy || unsavedCount > 0 || savingCount > 0 }))),
                React.createElement("main", { className: "page-content" },
                    auth.error ? React.createElement("div", { className: "notice error", role: "alert" }, auth.error) : null,
                    React.createElement("div", { className: 'notice workspace-persistence ' + (session.kind === 'guest' ? 'warning' : ''), role: "status" },
                        React.createElement(Icon, { name: "shield" }),
                        React.createElement("span", null, session.kind === 'guest'
                            ? 'Guest workspace: temporary and isolated. Download results before ending this session. Work is deleted on explicit end or expiry within 24 hours; it cannot be retrieved from an account.'
                            : 'Your projects, documents, edits and results are saved to your account. Sign in again to resume them.')),
                    React.createElement("div", { className: "page-heading" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "eyebrow" }, "Requirements workspace"),
                            React.createElement("h1", null, "Review, analyze, and decide."),
                            React.createElement("p", { className: "page-subtitle" }, "Import a specification, repair extracted statements, explore explainable suggestions, and keep an evidence-linked review record.")),
                        React.createElement("button", { type: "button", className: "primary-button", disabled: busy || unsavedCount > 0 || savingCount > 0, onClick: function () { setShowCreateProject(true); } },
                            React.createElement(Icon, { name: "plus" }),
                            "New project")),
                    React.createElement("div", { className: "steps-card", "aria-label": "Workflow progress" },
                        React.createElement("div", { className: 'step' + (projectId ? ' complete' : ' current') },
                            React.createElement("div", { className: "step-number" },
                                React.createElement(Icon, { name: projectId ? 'check' : 'folder', size: 17 })),
                            React.createElement("div", { className: "step-copy" },
                                React.createElement("strong", null, "Project"),
                                React.createElement("span", null, "Organize your work"))),
                        React.createElement("div", { className: 'step' + (documentId ? ' complete' : projectId ? ' current' : '') },
                            React.createElement("div", { className: "step-number" },
                                React.createElement(Icon, { name: documentId ? 'check' : 'document', size: 17 })),
                            React.createElement("div", { className: "step-copy" },
                                React.createElement("strong", null, "Document"),
                                React.createElement("span", null, "Extract and correct"))),
                        React.createElement("div", { className: 'step' + (currentRun ? ' complete' : documentId ? ' current' : '') },
                            React.createElement("div", { className: "step-number" },
                                React.createElement(Icon, { name: currentRun ? 'check' : 'chart', size: 17 })),
                            React.createElement("div", { className: "step-copy" },
                                React.createElement("strong", null, "Analyze & review"),
                                React.createElement("span", null, "Decide and export")))),
                    !analysisReady && apiReady ? (React.createElement("div", { className: "notice warning", role: "status" },
                        React.createElement(Icon, { name: "warning" }),
                        React.createElement("strong", null, "Analysis is unavailable in this runtime."),
                        React.createElement("span", null, analysisNotice || 'Start the API with the project-pinned Python and scikit-learn versions to load its verified models. Upload and text review remain available.'))) : null,
                    error ? React.createElement("div", { className: "notice error", role: "alert" },
                        React.createElement(Icon, { name: "warning" }),
                        React.createElement("span", null, error)) : null,
                    message ? React.createElement("div", { className: "notice success", role: "status", key: message },
                        React.createElement(Icon, { name: "check" }),
                        React.createElement("span", null, message)) : null,
                    loading ? React.createElement("div", { className: "card card-pad loading", role: "status" },
                        React.createElement("span", { className: "spinner", "aria-hidden": "true" }),
                        "Loading your workspace\u2026") : (React.createElement("div", { className: "content-grid" },
                        React.createElement("div", { className: "main-column" },
                            React.createElement(SourceDocuments, { model: model, expanded: expandedSections['upload-section'], onToggle: function () { toggleSection('upload-section'); } }),
                            React.createElement(RequirementReview, { model: model, expanded: expandedSections['review-section'], onToggle: function () { toggleSection('review-section'); } }),
                            React.createElement(AnalysisPanel, { model: model, expanded: expandedSections['analysis-section'], onToggle: function () { toggleSection('analysis-section'); } })),
                        React.createElement(WorkspaceSummary, { model: model }))))),
            React.createElement(WorkspaceDialogs, { model: model }));
    }

    function PublicRoute(props) {
        var auth = useAuth();
        return React.createElement(ReactRouterDOM.Route, { path: props.path, exact: props.exact, render: function () {
                return props.anonymousOnly && auth.session
                    ? React.createElement(ReactRouterDOM.Redirect, { to: "/workspace" }) : React.createElement(React.Fragment, null, props.children);
            } });
    }
    function PrivateRoute(props) {
        var auth = useAuth();
        return React.createElement(ReactRouterDOM.Route, { path: props.path, exact: props.exact, render: function (route) {
                if (!auth.session)
                    return React.createElement(ReactRouterDOM.Redirect, { to: { pathname: '/login', search: '?next=' + encodeURIComponent(route.location.pathname) } });
                if (props.accountOnly && auth.session.kind !== 'account')
                    return React.createElement(ReactRouterDOM.Redirect, { to: "/workspace" });
                return React.createElement(React.Fragment, null, props.children);
            } });
    }
    function RouteFocus() {
        var location = ReactRouterDOM.useLocation();
        React.useEffect(function () {
            window.scrollTo(0, 0);
            var heading = document.querySelector('main h1');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
            }
        }, [location.pathname]);
        return null;
    }

    function Site() {
        var _a = useAuthSession(), session = _a.session, checking = _a.checking, error = _a.error, busy = _a.busy, checkSession = _a.checkSession, authenticate = _a.authenticate, logout = _a.logout;
        if (checking)
            return React.createElement("main", { className: "access-shell" },
                React.createElement("div", { className: "access-card loading", role: "status" },
                    React.createElement("span", { className: "spinner" }),
                    "Checking your session\u2026"));
        return React.createElement(AuthContext.Provider, { value: { session: session, error: error, busy: busy, checkSession: checkSession, authenticate: authenticate, logout: logout } },
            React.createElement(RouteFocus, null),
            React.createElement(ReactRouterDOM.Switch, null,
                React.createElement(ReactRouterDOM.Route, { exact: true, path: "/home" },
                    React.createElement(ReactRouterDOM.Redirect, { to: "/" })),
                React.createElement(PublicRoute, { exact: true, path: "/" },
                    React.createElement(PublicLayout, null,
                        React.createElement(HomePage, null))),
                React.createElement(PublicRoute, { exact: true, anonymousOnly: true, path: "/login" },
                    React.createElement(PublicLayout, null,
                        React.createElement(AccessPage, { key: "login", kind: "login" }))),
                React.createElement(PublicRoute, { exact: true, anonymousOnly: true, path: "/register" },
                    React.createElement(PublicLayout, null,
                        React.createElement(AccessPage, { key: "register", kind: "register" }))),
                React.createElement(PublicRoute, { exact: true, anonymousOnly: true, path: "/guest" },
                    React.createElement(PublicLayout, null,
                        React.createElement(AccessPage, { key: "guest", kind: "guest" }))),
                React.createElement(PrivateRoute, { exact: true, path: "/workspace" },
                    React.createElement(WorkspacePage, null)),
                React.createElement(PrivateRoute, { exact: true, accountOnly: true, path: "/account/password" },
                    React.createElement(PasswordPage, null)),
                React.createElement(PrivateRoute, { exact: true, path: "/end-guest" },
                    React.createElement(EndGuestPage, null)),
                React.createElement(PublicRoute, null,
                    React.createElement(PublicLayout, null,
                        React.createElement("main", { className: "access-shell" },
                            React.createElement("section", { className: "access-card" },
                                React.createElement("h1", null, "Page not found"),
                                React.createElement("p", null, "This address does not match a ReqCheck page."),
                                React.createElement(ReactRouterDOM.Link, { className: "primary-button", to: "/" }, "Back to start")))))));
    }

    ReactDOM.render(React.createElement(reactQuery.ReactQueryConfigProvider, { config: { retry: false, refetchAllOnWindowFocus: false, throwOnError: true } },
        React.createElement(ReactRouterDOM.HashRouter, null,
            React.createElement(Site, null))), document.getElementById('root'));

}(React, ReactDOM, ReactQuery, ReactRouterDOM));
