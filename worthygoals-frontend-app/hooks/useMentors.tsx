import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import mentorService from '@/services/mentor.service';
import { Mentor } from '@/models';

const MENTORS_QUERY = {
  queryKey: ['mentors'],
  queryFn: () => mentorService.getMentorList(),
  staleTime: 1000 * 60 * 30,
};

// The active roster (Marcus/Lyra/Goggs) rarely changes, so cache it generously.
// Used to resolve a goal's int `mentorId` → its personality slug, since on the
// WG roster `slug === personalityId`.
export function useMentors() {
  const queryClient = useQueryClient();
  const query = useQuery({ ...MENTORS_QUERY, placeholderData: [] as Mentor[] });

  /**
   * slug → backend mentor id, from the shared cache or a fresh fetch. Three
   * screens used to hand-roll this in a useEffect with the failure swallowed
   * into a comment, each paying its own round trip.
   */
  const resolveMentorId = useCallback(
    async (slug: string): Promise<number | null> => {
      const mentors = await queryClient.fetchQuery(MENTORS_QUERY);
      return mentors.find((m) => m.slug === slug)?.id ?? null;
    },
    [queryClient],
  );

  return {
    mentors: query.data ?? [],
    resolveMentorId,
  };
}
