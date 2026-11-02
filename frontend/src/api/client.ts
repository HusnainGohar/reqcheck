import { queryCache, useMutation } from 'react-query';
import { getCacheScope, httpDelete, httpRequest } from './http';

export function queryKey(path: string) {
  return ['api', String(getCacheScope()), path];
}

export function clearApiCache() {
  queryCache.clear();
}

export function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (options && options.method && options.method !== 'GET') return httpRequest<T>(path, options);
  return queryCache.prefetchQuery<T>(queryKey(path), function() { return httpRequest<T>(path, options); }, {
    force: true, retry: false, throwOnError: true, staleTime: 0,
  });
}

type ApiOperation = { path: string; options?: RequestInit; remove?: boolean; body?: unknown };

export function useApi() {
  const [mutate] = useMutation<unknown, ApiOperation>(async function(operation) {
    if (operation.remove) return httpDelete(operation.path, operation.body);
    return httpRequest<unknown>(operation.path, operation.options);
  }, { throwOnError: true });

  async function send<T>(path: string, options?: RequestInit): Promise<T> {
    if (!options || !options.method || options.method === 'GET') return request<T>(path, options);
    // The transport decodes the response; the caller supplies the endpoint's response type.
    return await mutate({ path, options }, { throwOnError: true }) as T;
  }
  async function remove(path: string, body?: unknown): Promise<void> {
    await mutate({ path, body, remove: true }, { throwOnError: true });
  }
  return { request: send, requestDelete: remove };
}
