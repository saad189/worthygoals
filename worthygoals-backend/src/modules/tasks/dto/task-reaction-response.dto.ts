import { TaskCompletion, TaskExplanation } from 'src/database/models';

/**
 * TaskReactionResult as concrete classes: the generic interface is invisible
 * to the Swagger plugin, so complete/explain had no response schema.
 */
class TaskReactionResponseDto {
  /** The mentor's in-voice reaction, when one was generated. */
  mentorReaction?: string;
  /** True when the text tripped the crisis classifier; mentorReaction is the resources copy. */
  safetyFlag?: boolean;
}

export class TaskCompletionResponseDto extends TaskReactionResponseDto {
  data!: TaskCompletion;
}

export class TaskExplanationResponseDto extends TaskReactionResponseDto {
  data!: TaskExplanation;
}
