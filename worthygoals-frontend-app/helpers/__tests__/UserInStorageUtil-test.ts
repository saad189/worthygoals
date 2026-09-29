/**
 * Guards B5: "remember me" must never persist the user's password, and any
 * value already stored in the old shape must be purged rather than left on the
 * device indefinitely.
 */
import { USER_CREDENTIALS } from '@/constants';
import SecureStorage from '@/helpers/SecureStorageUtil';
import { getRememberedSignIn, rememberSignIn } from '../UserInStorageUtil';

jest.mock('@/helpers/SecureStorageUtil', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

const storage = SecureStorage as jest.Mocked<typeof SecureStorage>;

describe('remembered sign-in', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores the email and nothing resembling a password', async () => {
    await rememberSignIn({ email: 'user@example.com', rememberMe: true });

    expect(storage.setItem).toHaveBeenCalledWith(
      USER_CREDENTIALS,
      { email: 'user@example.com', rememberMe: true },
      undefined,
    );
    expect(JSON.stringify(storage.setItem.mock.calls)).not.toContain('password');
  });

  it('purges a legacy record that still holds a plaintext password', async () => {
    storage.getItem.mockResolvedValue({
      loginInfo: { email: 'user@example.com', password: 'hunter2' },
      rememberMe: true,
    });

    const result = await getRememberedSignIn();

    expect(result).toEqual({ email: 'user@example.com', rememberMe: true });
    // Rewritten in place, without the password.
    expect(storage.setItem).toHaveBeenCalledWith(
      USER_CREDENTIALS,
      { email: 'user@example.com', rememberMe: true },
      undefined,
    );
    expect(JSON.stringify(storage.setItem.mock.calls)).not.toContain('hunter2');
  });

  it('reads the current shape through unchanged', async () => {
    storage.getItem.mockResolvedValue({ email: 'a@b.c', rememberMe: false });

    await expect(getRememberedSignIn()).resolves.toEqual({
      email: 'a@b.c',
      rememberMe: false,
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('returns an empty record when nothing is stored', async () => {
    storage.getItem.mockResolvedValue(null);

    await expect(getRememberedSignIn()).resolves.toEqual({
      email: '',
      rememberMe: false,
    });
  });
});
