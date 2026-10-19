import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MAX_UPLOADS_PER_DAY, MediaService } from '../media.service';
import { Media } from 'src/database/models/media.entity';
import { UsersService } from '../../users/users.service';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  query: jest.fn(),
  delete: jest.fn(),
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

    it('throws NotFoundException when user is not found', async () => {
      usersService.findByAccountSub.mockResolvedValue(null);
      await expect(
        service.createUploadUrl('sub', {
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
          byteSize: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
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

  describe('upload quota', () => {
    it('refuses a new upload URL past the daily cap with a 429', async () => {
      usersService.findByAccountSub.mockResolvedValue({ id: 1 });
      repo.count.mockResolvedValue(MAX_UPLOADS_PER_DAY);

      await expect(
        service.createUploadUrl('sub', {
          fileName: 'a.jpg',
          contentType: 'image/jpeg',
          byteSize: 1000,
        } as any),
      ).rejects.toMatchObject({ status: 429 });
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // Every abandoned draft used to be stored (and billed) forever.
  describe('sweepOrphans', () => {
    const send = () => jest.spyOn((service as any).s3, 'send');

    it('deletes the objects, then the rows, of unreferenced old drafts', async () => {
      repo.query.mockResolvedValueOnce([
        { id: 'm1', s3Key: 'drafts/1/a.jpg' },
        { id: 'm2', s3Key: 'drafts/1/b.jpg' },
      ]);
      const s3 = send().mockResolvedValue({ Errors: [] } as never);

      expect(await service.sweepOrphans()).toBe(2);

      const del = (s3.mock.calls[0][0] as any).input.Delete.Objects;
      expect(del).toEqual([
        { Key: 'drafts/1/a.jpg' },
        { Key: 'drafts/1/b.jpg' },
      ]);
      expect(repo.delete).toHaveBeenCalledTimes(1);
      // Completion photos never set isAttached: they are spared by reference.
      const sql = repo.query.mock.calls[0][0];
      expect(sql).toContain('task_completions');
      expect(sql).toContain('status_posts');
    });

    it('keeps the row when S3 would not delete its object, to retry', async () => {
      repo.query.mockResolvedValueOnce([
        { id: 'm1', s3Key: 'drafts/1/a.jpg' },
        { id: 'm2', s3Key: 'drafts/1/b.jpg' },
      ]);
      send().mockResolvedValue({
        Errors: [{ Key: 'drafts/1/b.jpg' }],
      } as never);

      expect(await service.sweepOrphans()).toBe(1);
      const [{ id }] = repo.delete.mock.calls[0];
      expect(id.value ?? id._value).toEqual(['m1']);
    });

    it('does nothing when there is nothing to sweep', async () => {
      repo.query.mockResolvedValueOnce([]);
      const s3 = send();
      expect(await service.sweepOrphans()).toBe(0);
      expect(s3).not.toHaveBeenCalled();
    });
  });
});
