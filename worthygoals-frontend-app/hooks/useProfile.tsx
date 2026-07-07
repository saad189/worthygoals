import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import userService from '@/services/UserService';
import { useGoals } from './useGoals';
import { useMentors } from './useMentors';
import { personaBySlug, PersonalitySlug } from '@/constants/Personalities';
import { ApiGoal, Mentor, UserModel } from '@/models';

/**
 * The single source of truth for the signed-in user across the app: identity,
 * tone and matched mentor from GET /users/profile. This survives a reinstall —
 * unlike the local onboarding store, which is why `today`/`me` used to fall
 * back to Marcus / "No mentor yet". Those screens read from here now; nothing
 * reads identity, the mentor, or tone out of local AsyncStorage for display.
 *
 * The mentor is the persisted `users.personalityId` (F2, set at onboarding),
 * falling back to the most-recent goal's mentor for legacy users who onboarded
 * before that column existed.
 */
export function useProfile() {
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
  const { goals } = useGoals();
  const { mentors } = useMentors();

  const user = (profileQuery.data ?? null) as UserModel | null;

  const mentorSlug = useMemo<PersonalitySlug | null>(() => {
    // Authoritative: the mentor the user picked at onboarding.
    if (user?.personalityId) return user.personalityId as PersonalitySlug;
    // Back-compat: derive from the most-recent goal for users who onboarded
    // before users.personalityId existed.
    const recent = [...goals].sort(
      (a: ApiGoal, b: ApiGoal) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (!recent?.mentorId) return null;
    const slug = mentors.find((m: Mentor) => m.id === recent.mentorId)?.slug;
    return (slug as PersonalitySlug) ?? null;
  }, [user?.personalityId, goals, mentors]);

  return {
    user,
    tone: user?.tone ?? null,
    mentorSlug,
    mentor: personaBySlug(mentorSlug ?? undefined) ?? null,
    loading: profileQuery.isLoading,
  };
}

export default useProfile;
