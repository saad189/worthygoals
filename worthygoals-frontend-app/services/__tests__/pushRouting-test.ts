/** A push tap lands where the push is about. */
import { routeForNotification } from '../push.service';

jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('expo-device', () => ({ isDevice: false }));
jest.mock('../api.service', () => ({ __esModule: true, default: {} }));

describe('routeForNotification', () => {
  it('opens the weekly review for the Sunday push', () => {
    expect(routeForNotification({ kind: 'weekly_review' })).toBe('/review/review-screen');
  });

  it.each(['task_due', 'morning_setup', 'evening_check_in', 're_engage'] as const)(
    'opens today for %s',
    (kind) => {
      expect(routeForNotification({ kind })).toBe('/(tabs)/home-screen');
    },
  );
});
