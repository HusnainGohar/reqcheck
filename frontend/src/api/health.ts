import { queryCache } from 'react-query';
import { API } from './http';

type HealthStatus = { database?: string; analysis?: string; analysis_error?: string };

export function readHealth() {
  return queryCache.prefetchQuery(['health'], async function () {
    const response = await fetch(API + '/health', { credentials: 'include' });
    const body = await response.json() as HealthStatus & { detail?: HealthStatus };
    return { ok: response.ok, status: body.detail || body };
  }, { force: true, retry: false, throwOnError: true });
}
