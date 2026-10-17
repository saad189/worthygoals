import userService from '@/services/UserService';
import ApiService from '@/services/api.service';
import { UserModel } from '@/models';

jest.mock('@/services/api.service', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  setUserInStorage: jest.fn().mockResolvedValue(undefined),
  getUserInStorage: jest.fn().mockResolvedValue(null),
}));

const mockedApi = ApiService as jest.Mocked<typeof ApiService>;

describe('UserService.updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends only UpdateUserDto fields — never id/role/age (strict ValidationPipe)', async () => {
    const profile = {
      id: 7,
      email: 'saad@example.com',
      firstName: 'Saad',
      lastName: 'Ahmed',
      age: 30,
      role: { id: 1, name: 'user', permissions: [] },
      localtion: { latitude: 0, longitude: 0 },
    } as unknown as UserModel;
    mockedApi.put.mockResolvedValue({ data: profile } as any);

    await userService.updateProfile(profile);

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    const [url, body] = mockedApi.put.mock.calls[0];
    expect(url).toBe('/users/profile');
    expect(body).toEqual({
      email: 'saad@example.com',
      firstName: 'Saad',
      lastName: 'Ahmed',
    });
    expect(body).not.toHaveProperty('id');
    expect(body).not.toHaveProperty('role');
    expect(body).not.toHaveProperty('age');
  });

  it('omits undefined optional fields instead of sending them as null/undefined', async () => {
    const profile = { email: 'saad@example.com' } as unknown as UserModel;
    mockedApi.put.mockResolvedValue({ data: profile } as any);

    await userService.updateProfile(profile);

    expect(mockedApi.put.mock.calls[0][1]).toEqual({ email: 'saad@example.com' });
  });
});

describe('UserService.deleteAccount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls DELETE /users/me', async () => {
    mockedApi.delete.mockResolvedValue({ status: 204 } as any);
    await userService.deleteAccount();
    expect(mockedApi.delete).toHaveBeenCalledWith('/users/me');
  });

  it('treats 404 as already deleted (a timed-out attempt that finished)', async () => {
    mockedApi.delete.mockRejectedValue({ response: { status: 404, data: {} } });
    await expect(userService.deleteAccount()).resolves.toBeUndefined();
  });

  it('rethrows any other failure', async () => {
    mockedApi.delete.mockRejectedValue({ response: { status: 500, data: { message: 'boom' } } });
    await expect(userService.deleteAccount()).rejects.toThrow();
  });
});

// login() opens the app on cached data when the server is down, but only if it
// can see the status — a 5xx wrapped in a plain Error looked like "the server
// said no" and dropped signed-in users on the sign-in screen.
describe('UserService.getProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rethrows a 5xx untouched so callers can see the server is down', async () => {
    const serverError = { isAxiosError: true, response: { status: 500, data: { statusCode: 500 } } };
    mockedApi.get.mockRejectedValue(serverError);
    await expect(userService.getProfile()).rejects.toBe(serverError);
  });

  it('still wraps a 4xx as a plain error', async () => {
    mockedApi.get.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { statusCode: 401, message: 'Unauthorized' } },
    });
    await expect(userService.getProfile()).rejects.not.toHaveProperty('response');
  });
});
