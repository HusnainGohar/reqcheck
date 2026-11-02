import { queryCache, useQuery } from 'react-query';
import { queryKey } from '../../api/client';
import { httpRequest } from '../../api/http';
import { Finding, Page, Requirement, ReviewEvent } from '../../types/domain';

export function useFindingPages(runId: string, kind: string, page: number) {
  const root = '/analysis-runs/' + encodeURIComponent(runId);
  const path = root + '/findings?kind=' + kind + '&page=' + page + '&page_size=50';
  const snapshotPath = root + '/requirements';
  const config = { manual: !runId, staleTime: 30000, retry: false, throwOnError: false };
  const result = useQuery<Page<Finding>>(queryKey(path), function() {
    return httpRequest<Page<Finding>>(path);
  }, config);
  const snapshot = useQuery<{ items: Requirement[] }>(queryKey(snapshotPath), function() {
    return httpRequest<{ items: Requirement[] }>(snapshotPath);
  }, { manual: !runId, staleTime: Infinity, retry: false, throwOnError: false });
  const error = result.error || snapshot.error;
  return {
    findings: runId && result.data ? result.data.items : [],
    findingTotal: runId && result.data ? result.data.total : 0,
    runRequirements: runId && snapshot.data ? snapshot.data.items : [],
    findingsLoading: Boolean(runId && !error && (!result.data || !snapshot.data)),
    findingsError: runId && error ? error.message : '',
    retryFindings: function() {
      result.refetch();
      snapshot.refetch();
    },
    updateFindingReview: function(id: string, review: ReviewEvent) {
      queryCache.setQueryData<Page<Finding>>(queryKey(path), function(data) {
        if (!data) return data;
        return Object.assign({}, data, {
          items: data.items.map(function(item) {
            return item.id === id ? Object.assign({}, item, { latest_review: review }) : item;
          }),
        });
      });
    },
  };
}
