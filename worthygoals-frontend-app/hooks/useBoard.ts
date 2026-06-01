import { useQuery } from '@tanstack/react-query';
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
  const query = useQuery({
    queryKey: ['board'],
    queryFn: () => BoardService.getBoard(),
    initialData: [],
  });

  return {
    items: query.data,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.isError ? 'Could not load your board' : null,
    refresh: () => { query.refetch(); },
  };
}
