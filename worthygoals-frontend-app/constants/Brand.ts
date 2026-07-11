/**
 * Worthy Goals — brand constants
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for the app/brand name. No screen should hardcode a
 * brand literal ("Evolve" / "MentlyAI") — read APP_NAME from here so a rename
 * is a one-line change.
 */
export const APP_NAME = 'Worthy Goals';

/**
 * Stable namespace for persisted storage keys (SecureStore + AsyncStorage).
 * Intentionally NOT derived from APP_NAME: SecureStore rejects spaces, and a
 * rebrand must NOT rotate keys (that orphans every stored value → logs users
 * out). Keep this alphanumeric + ".-_" and effectively permanent.
 */
export const STORAGE_NS = 'worthy-goals';
