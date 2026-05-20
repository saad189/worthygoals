import ApiService from './api.service';
import { BoardItem } from '@/models';

const getBoard = async (): Promise<BoardItem[]> => {
  const response = await ApiService.get<BoardItem[]>('/board');
  return response.data;
};

export default { getBoard };
