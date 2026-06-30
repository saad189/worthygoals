// Shapes returned by the /status routes (the backend's StatusPostDto). That
// route isn't described in openapi.json yet, so these are hand-written to match
// it — keep in sync with src/modules/status/dto/status-post.dto.ts on the
// backend (same convention as ApiGoal).

export interface StatusReaction {
  /** personalityId slug — marcus / lyra / goggs. */
  personalityId: string;
  mentorName: string;
  text: string;
}

export interface StatusPost {
  id: string;
  text: string;
  createdAt: string;
  reactions: StatusReaction[];
}
