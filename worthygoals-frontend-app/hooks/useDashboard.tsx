import { useState, useEffect, useCallback } from 'react';
import DashboardService, { DashboardData } from '@/services/dashboard.service';

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

const empty: DashboardData = {
  todaysTasks: [],
  weekCompletions: Array(7).fill(0),
  goals: [],
  todayProgress: { completed: 0, total: 0 },
};

export default function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await DashboardService.getDashboard();
      setData(result);
    } catch {
      setError('Could not load dashboard');
      if (!data) setData(empty);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const refresh = useCallback(() => fetch(true), [fetch]);

  return { data, loading, refreshing, error, refresh };
}
