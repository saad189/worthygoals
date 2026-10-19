// Shapes returned by the /status routes, generated from the backend's
// StatusPostDto via openapi.json — the pre-push contract gate fails if the
// backend changes them without the app regenerating.
import type { components } from '@/types/api.gen';

export type StatusReaction = components['schemas']['StatusReactionDto'];
export type StatusPost = components['schemas']['StatusPostDto'];
