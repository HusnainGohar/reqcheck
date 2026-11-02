export const API = window.REQCHECK_API_BASE || window.location.protocol + '//' + window.location.hostname + ':8000';

let csrfToken = '';
let cacheScope = 0;

function sessionOptions(options?: RequestInit): RequestInit {
  const headers = new Headers(options && options.headers);
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  return Object.assign({}, options, { credentials: 'include', headers: headers });
}

export async function httpRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  const requestIdentity = csrfToken;
  try {
    response = await fetch(API + path, sessionOptions(options));
  } catch (error) {
    throw new Error('Can’t reach ReqCheck. Check that the local API is running, then try again.');
  }
  const raw = await response.text();
  let body: unknown = {};
  if (raw) {
    try {
      body = JSON.parse(raw) as unknown;
    } catch (error) {
      throw new Error('The server returned an unreadable response. Please try again.');
    }
  }
  if (!response.ok) {
    if (response.status === 401 && path.indexOf('/auth/') !== 0 && csrfToken === requestIdentity) {
      window.dispatchEvent(new Event('reqcheck-session-ended'));
    }
    const bodyRecord = body as { detail?: unknown };
    const detail = bodyRecord.detail;
    if (typeof detail === 'string') throw new Error(detail);
    if (detail && typeof detail === 'object' &&
      typeof (detail as { analysis_error?: unknown }).analysis_error === 'string') {
      throw new Error((detail as { analysis_error: string }).analysis_error);
    }
    throw new Error(JSON.stringify(detail || body));
  }
  if (!raw) throw new Error('The server returned an empty response.');
  return body as T;
}

export async function httpDelete(path: string, body?: unknown): Promise<void> {
  let response: Response;
  const requestIdentity = csrfToken;
  try {
    response = await fetch(API + path, sessionOptions({
      method: 'DELETE',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }));
  } catch (error) {
    throw new Error('Can’t reach ReqCheck. Check that the local API is running, then try again.');
  }
  if (response.status === 204) return;
  if (response.status === 401 && csrfToken === requestIdentity) window.dispatchEvent(new Event('reqcheck-session-ended'));
  const raw = await response.text();
  let detail = raw;
  if (raw) {
    try {
      const bodyValue = JSON.parse(raw) as { detail?: unknown };
      detail = typeof bodyValue.detail === 'string'
        ? bodyValue.detail
        : JSON.stringify(bodyValue.detail || bodyValue);
    } catch (error) {
      detail = raw;
    }
  }
  throw new Error(detail || 'The delete request could not be completed.');
}

export function getIdentity() { return csrfToken; }
export function setIdentity(value: string) {
  if (value !== csrfToken) cacheScope += 1;
  csrfToken = value;
}

export function getCacheScope() { return cacheScope; }
