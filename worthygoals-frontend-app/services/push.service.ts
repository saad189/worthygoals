import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import ApiService from './api.service';
import { ROUTE_NAMES } from '@/constants/Routes';

// Mirrors the backend NotificationJobData.kind union (notification-job.types.ts).
type NotificationJobKind =
  | 'morning_setup'
  | 'evening_check_in'
  | 'task_due'
  | 'weekly_review'
  | 're_engage';

const TOKEN_ENDPOINT = '/notifications/token';

// Set once at import: show incoming pushes while the app is foregrounded
// instead of silently dropping them (expo-notifications' default).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// The Expo push token is stable for the install lifetime, so registering it
// once per app session is enough — guards against a POST on every completion.
let syncedToken: string | null = null;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Register this device's Expo push token with the backend so the notification
 * engine has somewhere to send. Permission-aware: pass `prompt: false` at login
 * (re-sync silently only if already granted) and `prompt: true` after a value
 * moment — the first task completion — so new users aren't asked cold.
 */
export async function syncPushToken({
  prompt,
}: {
  prompt: boolean;
}): Promise<void> {
  // Simulators/emulators can't mint a real push token.
  if (!Device.isDevice) return;

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted' && current.canAskAgain && prompt) {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return;

  await ensureAndroidChannel();

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;
  if (!projectId) return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  if (token === syncedToken) return;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  await ApiService.post(TOKEN_ENDPOINT, { token, platform: 'expo', timezone });
  syncedToken = token;
}

/** Deactivate this device's token server-side — call before clearing auth on logout. */
export async function unregisterPushToken(): Promise<void> {
  if (!syncedToken) return;
  try {
    await ApiService.delete(
      `${TOKEN_ENDPOINT}/${encodeURIComponent(syncedToken)}`,
    );
  } catch {
    // Best-effort: a failed unregister just means the token expires naturally.
  }
  syncedToken = null;
}

// Map a notification's `kind` (backend sets data.kind) to an in-app route so a
// tap lands somewhere useful. Param-taking screens (e.g. weekly review) fall
// through to home to avoid a paramless crash.
export function routeForNotification(
  data: { kind?: NotificationJobKind } | undefined,
): string {
  const home = `/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.HOME_SCREEN}`;
  switch (data?.kind) {
    case 'task_due':
      return `/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.TODO_LIST_SCREEN}`;
    default:
      return home;
  }
}
