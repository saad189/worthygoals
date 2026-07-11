import { STORAGE_NS } from "./Brand";

// Keys are namespaced by STORAGE_NS (a stable slug, NOT the display name) so a
// rebrand never rotates them and SecureStore never sees an invalid character.
export const ACCESS_TOKEN = `${STORAGE_NS}-access-token`;
export const ID_TOKEN = `${STORAGE_NS}-id-token`;
export const REFRESH_TOKEN = `${STORAGE_NS}-refresh-token`;
export const USER_PROFILE = `${STORAGE_NS}-user-profile`;
export const USER_LOCATION = `${STORAGE_NS}-user-location`;
export const USER_CREDENTIALS = `${STORAGE_NS}-user-credentials`;

// ── Onboarding (U4) — the personality-match funnel persists its choices here.
export const ONBOARDING_TONE = `${STORAGE_NS}-onboarding-tone`;
export const ONBOARDING_MENTOR = `${STORAGE_NS}-onboarding-mentor`;
export const ONBOARDING_COMPLETE = `${STORAGE_NS}-onboarding-complete`;