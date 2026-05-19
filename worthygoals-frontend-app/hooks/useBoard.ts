import { useState, useEffect, useCallback } from 'react';
import BoardService from '@/services/board.service';
import { BoardItem } from '@/models';

interface UseBoardResult {
  items: BoardItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export default function useBoard(): UseBoardResult {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await BoardService.getBoard();
      setItems(data);
    } catch {
      setError('Could not load your board');
      if (!isRefresh) setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refresh = useCallback(() => fetch(true), [fetch]);

  return { items, loading, refreshing, error, refresh };
}
