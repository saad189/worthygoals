export const NOTIFICATION_QUEUE = 'notifications';

export type NotificationJobKind =
  | 'morning_setup'
  | 'evening_check_in'
  | 'task_due'
  | 'weekly_review'
  | 're_engage';

export interface NotificationJobData {
  userId: number;
  kind: NotificationJobKind;
  scheduledFor: string; // ISO string in user's local time
  payload?: Record<string, unknown>;
}
