import { AuthenticatedRequest } from 'src/common/interfaces';
/**
 * Guards C1.
 *
 * All three /notifications/token* routes passed req.user.sub — a Cognito UUID
 * string — into service methods typed `userId: number`, against an integer
 * column. Nothing threw, nothing was written, and push_tokens stayed empty, so
 * every scheduled notification had zero tokens to send to.
 */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from 'src/modules/users/users.service';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';

const SUB = '9f8c1b2e-0000-4a1b-9c3d-abcdefabcdef';
const USER_ID = 42;
const req = { user: { sub: SUB } } as unknown as AuthenticatedRequest;

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const notifService = {
    registerToken: jest.fn(),
    unregisterToken: jest.fn(),
    getTokens: jest.fn().mockResolvedValue([]),
  };
  const usersService = { findByAccountSub: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    usersService.findByAccountSub.mockResolvedValue({ id: USER_ID });
    notifService.getTokens.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notifService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get(NotificationsController);
  });

  it('registers the token against the numeric user id, never the Cognito sub', async () => {
    await controller.registerToken(req, {
      token: 'ExponentPushToken[x]',
    } as any);

    expect(usersService.findByAccountSub).toHaveBeenCalledWith(SUB);
    expect(notifService.registerToken).toHaveBeenCalledWith(USER_ID, {
      token: 'ExponentPushToken[x]',
    });
  });

  it('unregisters against the numeric user id', async () => {
    await controller.unregisterToken(req, { token: 'ExponentPushToken[x]' });

    expect(notifService.unregisterToken).toHaveBeenCalledWith(
      USER_ID,
      'ExponentPushToken[x]',
    );
  });

  it('lists tokens for the numeric user id', async () => {
    await controller.getTokens(req);

    expect(notifService.getTokens).toHaveBeenCalledWith(USER_ID);
  });

  it('rejects when the token has no user profile yet', async () => {
    usersService.findByAccountSub.mockResolvedValue(null);

    await expect(
      controller.registerToken(req, { token: 'ExponentPushToken[x]' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(notifService.registerToken).not.toHaveBeenCalled();
  });
});
