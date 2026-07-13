import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { routeForNotification } from '@/services/push.service';

// Route a notification tap to the relevant screen. Kept module-level so both
// the cold-start check and the live listener share one implementation.
function handleResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as
    | { kind?: string }
    | undefined;
  router.push(routeForNotification(data as any) as never);
}

/**
 * Wires notification-tap deep links. Mounted once inside the nav tree so
 * `router` is available. Handles both taps while running and a cold start
 * launched from a notification.
 */
export function usePushNotifications(): void {
  useEffect(() => {
    // App launched by tapping a notification while it was killed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );
    return () => sub.remove();
  }, []);
}
