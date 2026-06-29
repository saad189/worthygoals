/**
 * Worthy Goals — onboarding store (U4)
 * ─────────────────────────────────────────────────────────────
 * Persists the choices made in the personality-match funnel so a new user
 * "lands with a matched mentor + a saved tone preference" and those choices
 * survive a reload (exit criteria, §G/U4).
 *
 * V1 persists locally (AsyncStorage). Handoff: the backend has no `tone`
 * field on the user / user_personalities yet — once it does, sync the saved
 * tone + mentor there so the runtime's earned-escalation slope reads from it.
 */
import Storage from '@/helpers/StorageUtilAsync';
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
