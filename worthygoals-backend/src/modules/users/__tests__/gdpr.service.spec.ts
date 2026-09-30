import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GdprService } from '../gdpr.service';
import {
  Account,
  AiCall,
  Conversation,
  Goal,
  MemoryDigest,
  MemoryEmbedding,
  Message,
  NotificationLog,
  PushToken,
  Task,
  TaskCompletion,
  TaskExplanation,
  User,
  StatusPost,
  DriftSample,
} from 'src/database/models';
import { ConfigService } from '@nestjs/config';
import { Media } from 'src/database/models/media.entity';
import { AWSCognitoService } from '../../auth/aws-cognito.service';

const queryBuilderMock = () => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return qb;
};

const repoMock = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockImplementation(queryBuilderMock),
});

describe('GdprService', () => {
  let service: GdprService;
  let userRepo: ReturnType<typeof repoMock>;
  let cognito: { remove: jest.Mock };
  let manager: { delete: jest.Mock; remove: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  const account = { id: 7, sub: 'sub-123', email: 'u@example.com' } as Account;
  const user = {
    id: 42,
    email: 'u@example.com',
    account,
  } as unknown as User;

  beforeEach(async () => {
    manager = {
      delete: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => cb(manager)),
    };
    cognito = { remove: jest.fn().mockResolvedValue(undefined) };

    const entities = [
      User,
      Account,
      Goal,
      Task,
      TaskCompletion,
      TaskExplanation,
      Conversation,
      Message,
      MemoryDigest,
      MemoryEmbedding,
      PushToken,
      NotificationLog,
      AiCall,
      Media,
      StatusPost,
      DriftSample,
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: AWSCognitoService, useValue: cognito },
        // No S3 credentials: tests that need storage set it directly.
        {
          provide: ConfigService,
          useValue: { get: (_k: string, d?: string) => d },
        },
        ...entities.map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: repoMock(),
        })),
      ],
    }).compile();

    service = module.get(GdprService);
    userRepo = module.get(getRepositoryToken(User));
    userRepo.findOne.mockResolvedValue(user);
  });

  describe('deleteAccount', () => {
    it("purges the user's uploaded objects after the DB deletion", async () => {
      const send = jest.fn().mockResolvedValue({});
      (service as any).storage = { s3: { send }, bucket: 'b' };
      const mediaRepo = (service as any).mediaRepo;
      mediaRepo.find.mockResolvedValue([
        { s3Key: 'drafts/42/1.jpg' },
        { s3Key: 'drafts/42/2.jpg' },
      ]);

      await service.deleteAccount('sub-123');

      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0].input).toEqual({
        Bucket: 'b',
        Delete: {
          Objects: [{ Key: 'drafts/42/1.jpg' }, { Key: 'drafts/42/2.jpg' }],
          Quiet: true,
        },
      });
    });

    it('does not undo the DB deletion when the object purge fails', async () => {
      const send = jest.fn().mockRejectedValue(new Error('r2 down'));
      (service as any).storage = { s3: { send }, bucket: 'b' };
      (service as any).mediaRepo.find.mockResolvedValue([{ s3Key: 'k' }]);
      const error = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => undefined);

      await expect(service.deleteAccount('sub-123')).resolves.toBeUndefined();
      expect(error.mock.calls[0][0]).toContain('media purge FAILED');
    });

    it('removes the account row so the cascade reaches the user', async () => {
      await service.deleteAccount('sub-123');
      expect(manager.remove).toHaveBeenCalledWith(account);
    });

    it('falls back to removing the user when no account row exists', async () => {
      userRepo.findOne.mockResolvedValue({ ...user, account: null });
      await service.deleteAccount('sub-123');
      expect(manager.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: user.id }),
      );
    });

    it('deletes the Cognito identity after the DB transaction', async () => {
      await service.deleteAccount('sub-123');
      expect(cognito.remove).toHaveBeenCalledWith('sub-123');
    });

    it('does not throw when Cognito deletion fails after DB deletion', async () => {
      cognito.remove.mockRejectedValue(new Error('cognito down'));
      await expect(service.deleteAccount('sub-123')).resolves.toBeUndefined();
      expect(manager.remove).toHaveBeenCalled();
    });

    it('throws NotFound for an unknown sub and touches nothing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteAccount('nope')).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(cognito.remove).not.toHaveBeenCalled();
    });
  });

  describe('exportData', () => {
    it('includes the memory, notification, AI-call and media sections', async () => {
      const result = await service.exportData('sub-123');

      expect(result).toEqual(
        expect.objectContaining({
          profile: expect.objectContaining({ id: user.id }),
          goals: [],
          conversations: [],
          memoryDigests: [],
          memorySnippets: [],
          pushTokens: [],
          notificationLogs: [],
          aiCalls: [],
          media: [],
        }),
      );
    });
  });
});
