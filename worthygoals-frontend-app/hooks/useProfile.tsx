import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import userService from '@/services/UserService';
import { getUserInStorage } from '@/helpers/UserInStorageUtil';
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
    queryFn: async () => {
      try {
        return await userService.getProfile();
      } catch (e: any) {
        // Offline or a 5xx (getProfile rethrows only those as AxiosErrors):
        // show the last profile this device saw rather than no mentor/tone —
        // the same cache login() opens the app on.
        if (!e?.isAxiosError) throw e;
        const cached = await getUserInStorage().catch(() => null);
        if (cached) return cached;
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
  const { goals } = useGoals();
  const { mentors } = useMentors();

  const user = (profileQuery.data ?? null) as UserModel | null;

  const mentorSlug = useMemo<PersonalitySlug | null>(() => {
    // Authoritative: the mentor the user picked at onboarding.
    if (user?.personalityId) return user.personalityId as PersonalitySlug;
    // No profile (still loading, or the request failed) is not "no mentor":
    // guessing from goals here showed the wrong mentor and "tone: not set" as
    // if they were the user's real settings whenever /users/profile failed.
    if (!user) return null;
    // Back-compat: derive from the most-recent goal for users who onboarded
    // before users.personalityId existed.
    const recent = [...goals].sort(
      (a: ApiGoal, b: ApiGoal) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (!recent?.mentorId) return null;
    const slug = mentors.find((m: Mentor) => m.id === recent.mentorId)?.slug;
    return (slug as PersonalitySlug) ?? null;
  }, [user, goals, mentors]);

  return {
    user,
    tone: user?.tone ?? null,
    mentorSlug,
    mentor: personaBySlug(mentorSlug ?? undefined) ?? null,
    loading: profileQuery.isLoading,
  };
}

export default useProfile;
