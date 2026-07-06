import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import userService from '@/services/UserService';
import { useGoals } from './useGoals';
import { useMentors } from './useMentors';
import { personaBySlug, PersonalitySlug } from '@/constants/Personalities';
import { ApiGoal, Mentor, UserModel } from '@/models';

/**
 * The single source of truth for the signed-in user across the app: identity +
 * tone from GET /users/profile, plus the user's primary mentor derived from the
 * authoritative backend goals. This survives a reinstall — unlike the local
 * onboarding store, which is why `today`/`me` used to fall back to Marcus /
 * "No mentor yet". Those screens read from here now; nothing reads the mentor
 * or tone out of local AsyncStorage for display anymore.
 *
 * ponytail: the mentor is derived from the most-recent goal, not a user-level
 * column. Add `users.personalityId` and persist it on onboarding to decouple
 * "your mentor" from goals (so it's known before the first goal exists).
 */
export function useProfile() {
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
  const { goals } = useGoals();
  const { mentors } = useMentors();

  const mentorSlug = useMemo<PersonalitySlug | null>(() => {
    const recent = [...goals].sort(
      (a: ApiGoal, b: ApiGoal) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (!recent?.mentorId) return null;
    const slug = mentors.find((m: Mentor) => m.id === recent.mentorId)?.slug;
    return (slug as PersonalitySlug) ?? null;
  }, [goals, mentors]);

  const user = (profileQuery.data ?? null) as UserModel | null;

  return {
    user,
    tone: (user as { tone?: string | null } | null)?.tone ?? null,
    mentorSlug,
    mentor: personaBySlug(mentorSlug ?? undefined) ?? null,
    loading: profileQuery.isLoading,
  };
}

export default useProfile;
