import { useQuery } from '@tanstack/react-query';
import { statusApiService } from '@/services/status.service';
import { StatusPost } from '@/models';

/** The polyphonic feed — the user's status posts with each mentor's reply. */
export function useStatusFeed() {
  const query = useQuery({
    queryKey: ['status'],
    queryFn: () => statusApiService.list(),
    // placeholderData, not initialData — keeps the first fetch alive.
    placeholderData: [] as StatusPost[],
  });

  return {
    posts: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? 'Failed to load the feed' : null,
    refetch: () => {
      query.refetch();
    },
    refreshing: query.isRefetching,
  };
}
