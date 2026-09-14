/**
 * Guards D2(b): a failed onboarding sync must be queued for retry, not
 * swallowed. It previously claimed it would be "re-synced next time the
 * profile is updated" — updateOnboarding's only caller was that same line.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import userService from '@/services/UserService';
import { drainOutbox, enqueueOnboarding } from '../taskOutbox';

jest.mock('@/services/tasks.service', () => ({ tasksService: {} }));
jest.mock('@/services/UserService', () => ({
  __esModule: true,
  default: { updateOnboarding: jest.fn() },
}));

const mockUserService = userService as jest.Mocked<typeof userService>;
const CHOICE = { tone: 'firm', personalityId: 'goggs' };

describe('onboarding outbox', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('retries a queued onboarding sync on the next drain', async () => {
    mockUserService.updateOnboarding.mockResolvedValue(undefined as never);

    await enqueueOnboarding(CHOICE);
    const synced = await drainOutbox();

    expect(synced).toBe(1);
    expect(mockUserService.updateOnboarding).toHaveBeenCalledWith(CHOICE);
  });

  it('keeps the entry queued while the sync keeps failing', async () => {
    mockUserService.updateOnboarding.mockRejectedValue(new Error('offline'));

    await enqueueOnboarding(CHOICE);
    expect(await drainOutbox()).toBe(0);

    // Still there for the next foreground.
    mockUserService.updateOnboarding.mockResolvedValue(undefined as never);
    expect(await drainOutbox()).toBe(1);
  });

  it('keeps only the latest choice', async () => {
    mockUserService.updateOnboarding.mockResolvedValue(undefined as never);

    await enqueueOnboarding({ tone: 'soft', personalityId: 'lyra' });
    await enqueueOnboarding(CHOICE);
    await drainOutbox();

    expect(mockUserService.updateOnboarding).toHaveBeenCalledTimes(1);
    expect(mockUserService.updateOnboarding).toHaveBeenCalledWith(CHOICE);
  });
});
