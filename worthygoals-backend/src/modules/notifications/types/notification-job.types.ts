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
  scheduledFor: string; // ISO 8601 UTC instant of the scheduled delivery
  payload?: Record<string, unknown>;
}

/** Job name for the delayed Expo receipt check that follows every send. */
export const PUSH_RECEIPTS_JOB = 'push_receipts';

export interface PushReceiptJobData {
  tickets: Array<{ id: string; token: string }>;
}

export type NotificationQueueData = NotificationJobData | PushReceiptJobData;
