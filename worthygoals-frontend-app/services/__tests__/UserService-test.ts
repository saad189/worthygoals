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
