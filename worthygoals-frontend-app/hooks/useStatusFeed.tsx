import { useInfiniteQuery } from '@tanstack/react-query';
import { STATUS_PAGE_SIZE, statusApiService } from '@/services/status.service';

/**
 * The polyphonic feed — the user's status posts with each mentor's reply,
 * newest first, one page at a time. The backend caps a page at 50 and used to
 * offer no way past it: post 51 and older simply did not exist to the app.
 */
export function useStatusFeed() {
  const query = useInfiniteQuery({
    queryKey: ['status'],
    queryFn: ({ pageParam }) => statusApiService.list(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.length < STATUS_PAGE_SIZE ? undefined : last[last.length - 1].createdAt,
  });

  return {
    posts: query.data?.pages.flat() ?? [],
    loading: query.isLoading,
    error: query.isError ? 'Failed to load the feed' : null,
    refetch: () => {
      query.refetch();
    },
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    loadingMore: query.isFetchingNextPage,
  };
}
