import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { routeForNotification } from '@/services/push.service';
import { useAuth } from '@/hooks/useAuth';

/**
 * Wires notification-tap deep links. Mounted once inside the nav tree (and
 * inside AuthProvider) so `router` and the auth state are available. Handles
 * both taps while running and a cold start launched from a notification.
 *
 * A tap is only routed once the session is known to be valid. On a cold start
 * the auth check is still running, and routing immediately raced a
 * router.push into the tabs against the <Redirect> to sign-in, with no
 * ordering between them. The tap is held until isAuthenticated, then routed
 * once — so an expired session signs in first and still lands on the task.
 */
export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth();
  const pending = useRef<Notifications.NotificationResponse | null>(null);
  const authed = useRef(isAuthenticated);
  authed.current = isAuthenticated;

  const route = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as
      | { kind?: string }
      | undefined;
    router.push(routeForNotification(data as any) as never);
  }, []);

  const handle = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (authed.current) route(response);
      else pending.current = response;
    },
    [route],
  );

  useEffect(() => {
    // App launched by tapping a notification while it was killed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handle(response);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [handle]);

  useEffect(() => {
    if (isAuthenticated && pending.current) {
      const response = pending.current;
      pending.current = null;
      route(response);
    }
  }, [isAuthenticated, route]);
}
