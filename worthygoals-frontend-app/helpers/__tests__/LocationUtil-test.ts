/**
 * Guards A3: a refused location permission must never close the app, loop a
 * modal, or throw. The only live caller is the mandatory profile step, which
 * has no back affordance.
 */
import { BackHandler } from 'react-native';
import * as Location from 'expo-location';

import { getUserLocaltionLocal } from '../LocationUtil';

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const mockLocation = Location as jest.Mocked<typeof Location>;

describe('getUserLocaltionLocal', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['denied, can ask again', { status: 'denied', canAskAgain: true }],
    ['denied permanently', { status: 'denied', canAskAgain: false }],
  ])('returns null and never exits the app when %s', async (_label, perm) => {
    const exitApp = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => true);
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue(perm as never);

    await expect(getUserLocaltionLocal()).resolves.toBeNull();
    expect(exitApp).not.toHaveBeenCalled();
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns null rather than throwing when the position lookup fails', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
    } as never);
    mockLocation.getCurrentPositionAsync.mockRejectedValue(new Error('GPS unavailable'));

    await expect(getUserLocaltionLocal()).resolves.toBeNull();
  });

  it('returns coordinates when permission is granted', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
    } as never);
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5, longitude: -0.12 },
    } as never);

    await expect(getUserLocaltionLocal()).resolves.toEqual({
      latitude: 51.5,
      longitude: -0.12,
    });
  });
});
