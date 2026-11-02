declare module 'react-query' {
  import * as React from 'react';
  export type QueryKey = string | readonly unknown[];
  export interface QueryConfig {
    retry?: boolean | number;
    staleTime?: number;
    cacheTime?: number;
    manual?: boolean;
    force?: boolean;
    throwOnError?: boolean;
    refetchAllOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
  }
  export interface QueryResult<T> {
    data: T | undefined;
    error: Error | null;
    status: 'loading' | 'error' | 'success';
    isFetching: boolean;
    refetch: (options?: { throwOnError?: boolean }) => Promise<T>;
  }
  export function useQuery<T>(key: QueryKey, query: () => Promise<T>, config?: QueryConfig): QueryResult<T>;
  export function useMutation<T, V>(mutation: (variables: V) => Promise<T>, config?: QueryConfig):
    [(variables: V, config?: { throwOnError?: boolean }) => Promise<T>, { status: string; error: Error | null }];
  export const queryCache: {
    clear: () => void;
    removeQueries: (key: QueryKey) => void;
    setQueryData: <T>(key: QueryKey, updater: (data: T | undefined) => T | undefined) => void;
    prefetchQuery: <T>(key: QueryKey, query: () => Promise<T>, config?: QueryConfig) => Promise<T>;
  };
  export const ReactQueryConfigProvider: React.ComponentType<{ config: QueryConfig; children?: React.ReactNode }>;
}
