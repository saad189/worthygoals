import { useQuery } from '@tanstack/react-query';
import mentorService from '@/services/mentor.service';
import { Mentor } from '@/models';

// The active roster (Marcus/Lyra/Goggs) rarely changes, so cache it generously.
// Used to resolve a goal's int `mentorId` → its personality slug, since on the
// WG roster `slug === personalityId`.
export function useMentors() {
  const query = useQuery({
    queryKey: ['mentors'],
    queryFn: () => mentorService.getMentorList(),
    placeholderData: [] as Mentor[],
    staleTime: 1000 * 60 * 30,
  });

  return {
    mentors: query.data ?? [],
  };
}
