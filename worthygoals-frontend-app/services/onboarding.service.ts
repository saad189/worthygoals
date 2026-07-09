/**
 * Worthy Goals — onboarding store (U4)
 * ─────────────────────────────────────────────────────────────
 * Persists the choices made in the personality-match funnel so a new user
 * "lands with a matched mentor + a saved tone preference" and those choices
 * survive a reload (exit criteria, §G/U4).
 *
 * Persists locally (AsyncStorage) as the source the app reads synchronously,
 * and best-effort syncs the tone to the backend (users.tone, S47) so the
 * runtime's earned-escalation slope can read from it — an offline save still
 * completes onboarding.
 */
import Storage from '@/helpers/StorageUtilAsync';
import userService from '@/services/UserService';
import {
  ONBOARDING_COMPLETE,
  ONBOARDING_MENTOR,
  ONBOARDING_TONE,
} from '@/constants/Storage';
import { PersonalitySlug, ToneKey } from '@/constants/Personalities';

export interface SavedMentor {
  slug: PersonalitySlug;
  /** Backend mentor id when the roster has been reseeded; null otherwise. */
  mentorId: number | null;
}

export interface OnboardingChoice {
  tone: ToneKey;
  mentorSlug: PersonalitySlug;
  mentorId?: number | null;
}

export const onboardingService = {
  async save(choice: OnboardingChoice): Promise<void> {
    await Storage.setItem(ONBOARDING_TONE, choice.tone);
    await Storage.setItem(ONBOARDING_MENTOR, {
      slug: choice.mentorSlug,
      mentorId: choice.mentorId ?? null,
    } as SavedMentor);
    await Storage.setItem(ONBOARDING_COMPLETE, true);

    // Best-effort backend sync — tone shapes voiced surfaces server-side and
    // the matched mentor (personalityId) is the reinstall-proof source of
    // truth for "your mentor" (F2). A failure (offline, cold start) never
    // blocks onboarding; the local copy is the offline bootstrap.
    try {
      await userService.updateOnboarding({
        tone: choice.tone,
        personalityId: choice.mentorSlug,
      });
    } catch {
      // Swallowed by design — re-synced next time the profile is updated.
    }
  },

  async getTone(): Promise<ToneKey | null> {
    return (await Storage.getItem(ONBOARDING_TONE)) ?? null;
  },

  async getMentor(): Promise<SavedMentor | null> {
    return (await Storage.getItem(ONBOARDING_MENTOR)) ?? null;
  },

  async isComplete(): Promise<boolean> {
    return Boolean(await Storage.getItem(ONBOARDING_COMPLETE));
  },

  async reset(): Promise<void> {
    await Storage.removeItem(ONBOARDING_TONE);
    await Storage.removeItem(ONBOARDING_MENTOR);
    await Storage.removeItem(ONBOARDING_COMPLETE);
  },
};

export default onboardingService;
