import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MediaService } from '../media.service';
import { Media } from 'src/database/models/media.entity';
import { UsersService } from '../../users/users.service';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const mockUsersService = () => ({
  findByAccountSub: jest.fn(),
});

const mockConfig = (overrides: Record<string, string> = {}) => ({
  get: jest.fn((key: string, def?: string) => {
    const vals: Record<string, string> = {
      S3_BUCKET_NAME: 'test-bucket',
      S3_ACCESS_KEY_ID: 'key',
      S3_SECRET_ACCESS_KEY: 'secret',
      S3_REGION: 'auto',
      ...overrides,
    };
    return vals[key] ?? def ?? '';
  }),
});

describe('MediaService', () => {
  let service: MediaService;
  let repo: ReturnType<typeof mockRepo>;
  let usersService: ReturnType<typeof mockUsersService>;

  beforeEach(async () => {
    repo = mockRepo();
    usersService = mockUsersService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Media), useValue: repo },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: mockConfig() },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('createUploadUrl', () => {
    it('throws ServiceUnavailableException when S3 is not configured', async () => {
      const module = await Test.createTestingModule({
        providers: [
          MediaService,
          { provide: getRepositoryToken(Media), useValue: repo },
          { provide: UsersService, useValue: usersService },
          {
            provide: ConfigService,
            useValue: mockConfig({
              S3_BUCKET_NAME: '',
              S3_ACCESS_KEY_ID: '',
              S3_SECRET_ACCESS_KEY: '',
            }),
          },
        ],
      }).compile();

      const unconfiguredService = module.get<MediaService>(MediaService);
      await expect(
        unconfiguredService.createUploadUrl('sub', {
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          byteSize: 1000,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws ServiceUnavailableException when user is not found', async () => {
      usersService.findByAccountSub.mockResolvedValue(null);
      await expect(
        service.createUploadUrl('sub', {
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          byteSize: 1000,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('signs the declared size into the upload URL', async () => {
      usersService.findByAccountSub.mockResolvedValue({ id: 1 });
      repo.create.mockImplementation((v) => v);
      repo.save.mockResolvedValue({ id: 'media-uuid' });

      const { uploadUrl } = await service.createUploadUrl('sub', {
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        byteSize: 12345,
      });

      const signed = new URL(uploadUrl).searchParams.get('X-Amz-SignedHeaders');
      expect(signed?.split(';')).toEqual(
        expect.arrayContaining(['content-length', 'content-type']),
      );
    });
  });

  describe('markAttached', () => {
    it('updates isAttached for the matching media row', async () => {
      usersService.findByAccountSub.mockResolvedValue({ id: 1 });
      repo.update.mockResolvedValue({ affected: 1 });

      await service.markAttached('media-uuid', 'cognito-sub');

      expect(repo.update).toHaveBeenCalledWith(
        { id: 'media-uuid', userId: 1 },
        { isAttached: true },
      );
    });

    it('throws when the user is not found', async () => {
      usersService.findByAccountSub.mockResolvedValue(null);
      await expect(
        service.markAttached('media-uuid', 'unknown-sub'),
      ).rejects.toThrow('Media not found');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it("throws when the media id is someone else's", async () => {
      usersService.findByAccountSub.mockResolvedValue({ id: 1 });
      repo.update.mockResolvedValue({ affected: 0 });
      await expect(
        service.markAttached('media-uuid', 'cognito-sub'),
      ).rejects.toThrow('Media not found');
    });
  });
});
