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
  UserPersonality,
} from 'src/database/models';
import { Media } from '../../media/media.entity';
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
      UserPersonality,
      MemoryDigest,
      MemoryEmbedding,
      PushToken,
      NotificationLog,
      AiCall,
      Media,
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: AWSCognitoService, useValue: cognito },
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
    it('purges the FK-less tables inside the transaction', async () => {
      await service.deleteAccount('sub-123');

      const deleted = manager.delete.mock.calls.map(([entity]) => entity);
      expect(deleted).toEqual(
        expect.arrayContaining([
          MemoryEmbedding,
          MemoryDigest,
          PushToken,
          NotificationLog,
          AiCall,
        ]),
      );
      manager.delete.mock.calls.forEach(([, where]) => {
        expect(where).toEqual({ userId: user.id });
      });
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
          personalities: [],
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
