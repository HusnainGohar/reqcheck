import { useQuery } from 'react-query';
import { queryKey } from '../../api/client';
import { httpRequest } from '../../api/http';
import { Finding, ReviewEvent } from '../../types/domain';

export function useReviewHistory(finding: Finding, open: boolean) {
  const path = '/analysis-runs/' + encodeURIComponent(finding.run_id) + '/reviews';
  // React Query v1 starts a query on a key change, not a change to `manual`.
  const query = useQuery<{ items: (ReviewEvent & { finding_id: string })[] }>(
    queryKey(path).concat(open ? finding.latest_review ? finding.latest_review.id : 'unreviewed' : 'closed-' + finding.id),
    function() { return httpRequest(path); },
    { manual: !open, retry: false, throwOnError: true, refetchAllOnWindowFocus: false }
  );
  return {
    history: query.data ? query.data.items.filter(function(event) { return event.finding_id === finding.id; }) : [],
    historyError: query.error ? query.error.message : '',
    historyLoading: query.isFetching || open && !query.data && !query.error,
  };
}
