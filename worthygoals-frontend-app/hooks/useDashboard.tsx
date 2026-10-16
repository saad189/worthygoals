import { useQuery } from '@tanstack/react-query';
import DashboardService, { DashboardData } from '@/services/dashboard.service';

const EMPTY: DashboardData = {
  todaysTasks: [],
  weekCompletions: Array(7).fill(0),
  goals: [],
  todayProgress: { completed: 0, total: 0 },
};

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export default function useDashboard(): UseDashboardResult {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => DashboardService.getDashboard(),
    placeholderData: EMPTY,
  });

  return {
    data: query.data ?? null,
    // isLoading is never true with placeholderData (the query is "success"
    // from the first render); "showing the placeholder while fetching" is.
    loading: query.isPlaceholderData && query.isFetching,
    refreshing: query.isFetching && !query.isPlaceholderData,
    error: query.isError ? 'Could not load dashboard' : null,
    refresh: () => { query.refetch(); },
  };
}
