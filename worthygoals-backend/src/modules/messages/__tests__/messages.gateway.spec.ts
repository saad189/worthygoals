import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { MessagesGateway } from '../messages.gateway';
import { MessagesService } from '../messages.service';
import { AgentService } from 'src/core/ai';
import { SafetyService } from 'src/core/safety/safety.service';

const CONV_ID = 'conv-uuid';
const USER_MSG_ID = 'user-msg-uuid';
const MENTOR_MSG_ID = 'mentor-msg-uuid';
const CRISIS_MSG_ID = 'crisis-msg-uuid';
const SUB = 'cognito-sub';

const makeUserMessage = () => ({
  id: USER_MSG_ID,
  userId: 42,
  conversationId: CONV_ID,
  text: 'hello',
});

const makeMentorMessage = (id: string) => ({
  id,
  userId: null,
  conversationId: CONV_ID,
  text: 'mentor reply',
});

const makeSocket = (sub = SUB) =>
  ({
    handshake: { user: { sub } },
    join: jest.fn(),
    leave: jest.fn(),
  }) as any;

describe('MessagesGateway — safety gate', () => {
  let gateway: MessagesGateway;
  let messagesService: {
    sendUserTextMessage: jest.Mock;
    createMentorTextMessage: jest.Mock;
  };
  let agentService: { generateMentorReply: jest.Mock };
  let safetyService: {
    isCrisisSignal: jest.Mock;
    getCrisisResponse: jest.Mock;
  };

  beforeEach(async () => {
    messagesService = {
      sendUserTextMessage: jest.fn().mockResolvedValue(makeUserMessage()),
      createMentorTextMessage: jest
        .fn()
        .mockResolvedValue(makeMentorMessage(MENTOR_MSG_ID)),
    };

    agentService = {
      generateMentorReply: jest.fn().mockResolvedValue({
        replyText: 'AI reply',
        model: 'gpt-4o-mini',
        provider: 'openai',
        tokensIn: 10,
        tokensOut: 20,
      }),
    };

    safetyService = {
      isCrisisSignal: jest.fn().mockReturnValue(false),
      getCrisisResponse: jest.fn().mockReturnValue('crisis help text'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: MessagesService, useValue: messagesService },
        { provide: AgentService, useValue: agentService },
        { provide: SafetyService, useValue: safetyService },
      ],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    // stub the server so emit calls don't throw
    (gateway as any).server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
  });

  it('throws WsException when conversationId is missing', async () => {
    await expect(
      gateway.handleSendMessage(makeSocket(), { text: 'hi' } as any),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('throws WsException when text is missing', async () => {
    await expect(
      gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
      } as any),
    ).rejects.toBeInstanceOf(WsException);
  });

  describe('normal message (no crisis)', () => {
    it('calls agentService and returns both message ids', async () => {
      messagesService.createMentorTextMessage.mockResolvedValue(
        makeMentorMessage(MENTOR_MSG_ID),
      );

      const result = await gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'How do I stay consistent?',
      });

      expect(safetyService.isCrisisSignal).toHaveBeenCalledWith(
        'How do I stay consistent?',
      );
      expect(agentService.generateMentorReply).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ok: true,
        userMessageId: USER_MSG_ID,
        mentorMessageId: MENTOR_MSG_ID,
      });
    });

    it('passes onChunk callback to agentService (S19 streaming)', async () => {
      messagesService.createMentorTextMessage.mockResolvedValue(
        makeMentorMessage(MENTOR_MSG_ID),
      );

      await gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'How do I stay consistent?',
      });

      const callArgs = agentService.generateMentorReply.mock.calls[0][0];
      expect(typeof callArgs.onChunk).toBe('function');
    });

    it('emits messageChunk events when onChunk is called', async () => {
      messagesService.createMentorTextMessage.mockResolvedValue(
        makeMentorMessage(MENTOR_MSG_ID),
      );

      agentService.generateMentorReply.mockImplementation(
        async (params: { onChunk?: (c: string) => void }) => {
          params.onChunk?.('token1');
          params.onChunk?.(' token2');
          return {
            replyText: 'token1 token2',
            model: 'gpt-4o-mini',
            provider: 'openai',
            tokensIn: 10,
            tokensOut: 20,
          };
        },
      );

      const emittedEvents: Array<{ event: string; data: unknown }> = [];
      (gateway as any).server = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn((event: string, data: unknown) =>
            emittedEvents.push({ event, data }),
          ),
        }),
      };

      await gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'How do I stay consistent?',
      });

      const chunkEvents = emittedEvents.filter(
        (e) => e.event === 'messageChunk',
      );
      expect(chunkEvents).toHaveLength(2);
      expect(chunkEvents[0].data).toEqual({
        conversationId: CONV_ID,
        chunk: 'token1',
      });
      expect(chunkEvents[1].data).toEqual({
        conversationId: CONV_ID,
        chunk: ' token2',
      });
    });
  });

  describe('crisis message', () => {
    beforeEach(() => {
      safetyService.isCrisisSignal.mockReturnValue(true);
      messagesService.createMentorTextMessage.mockResolvedValue(
        makeMentorMessage(CRISIS_MSG_ID),
      );
    });

    it('skips the AI call entirely', async () => {
      await gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'I want to hurt myself',
      });

      expect(agentService.generateMentorReply).not.toHaveBeenCalled();
    });

    it('persists the crisis response as a mentor message', async () => {
      await gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'I want to hurt myself',
      });

      expect(messagesService.createMentorTextMessage).toHaveBeenCalledWith({
        conversationId: CONV_ID,
        text: 'crisis help text',
        tokensIn: null,
        tokensOut: null,
      });
    });

    it('returns ok with crisis message id', async () => {
      const result = await gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'I want to hurt myself',
      });

      expect(result).toEqual({
        ok: true,
        userMessageId: USER_MSG_ID,
        mentorMessageId: CRISIS_MSG_ID,
      });
    });

    it('calls getCrisisResponse to build the reply text', async () => {
      await gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'I want to hurt myself',
      });

      expect(safetyService.getCrisisResponse).toHaveBeenCalled();
    });
  });
});

/**
 * Guards B4. joinConversation joined any supplied conversation id unchecked,
 * and the room it joins receives messageChunk — a live read of another user's
 * private mentor chat.
 */
describe('MessagesGateway — joinConversation ownership', () => {
  let gateway: MessagesGateway;
  const assertConversationOwnership = jest.fn();

  beforeEach(async () => {
    assertConversationOwnership.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: MessagesService, useValue: { assertConversationOwnership } },
        { provide: AgentService, useValue: {} },
        { provide: SafetyService, useValue: {} },
      ],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
  });

  it('checks ownership before joining the room', async () => {
    assertConversationOwnership.mockResolvedValue({
      userId: 42,
      conversationId: CONV_ID,
    });
    const client = makeSocket();

    await gateway.joinConversation(client, { conversationId: CONV_ID });

    expect(assertConversationOwnership).toHaveBeenCalledWith({
      sub: SUB,
      conversationId: CONV_ID,
    });
    expect(client.join).toHaveBeenCalledWith(`conversation:${CONV_ID}`);
  });

  it("does not join a room for someone else's conversation", async () => {
    assertConversationOwnership.mockRejectedValue(
      new Error('Cannot access this conversation'),
    );
    const client = makeSocket();

    await expect(
      gateway.joinConversation(client, { conversationId: 'someone-elses' }),
    ).rejects.toThrow();

    expect(client.join).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated socket', async () => {
    const client = { handshake: {}, join: jest.fn() } as any;

    await expect(
      gateway.joinConversation(client, { conversationId: CONV_ID }),
    ).rejects.toThrow(WsException);

    expect(client.join).not.toHaveBeenCalled();
    expect(assertConversationOwnership).not.toHaveBeenCalled();
  });
});

/**
 * Guards D8 server-side. Nest emits gateway errors as an `exception` event,
 * but a raw error becomes the generic "Internal server error" — and hitting
 * the 20/day free-tier quota is routine, not a fault. The user could not tell
 * "you hit today's limit" from "the app is broken".
 */
describe('MessagesGateway — mentor reply failures', () => {
  let gateway: MessagesGateway;
  const messagesService = {
    sendUserTextMessage: jest.fn(),
    createMentorTextMessage: jest.fn(),
  };
  const agentService = { generateMentorReply: jest.fn() };
  const safetyService = {
    isCrisisSignal: jest.fn().mockReturnValue(false),
    getCrisisResponse: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    safetyService.isCrisisSignal.mockReturnValue(false);
    messagesService.sendUserTextMessage.mockResolvedValue(makeUserMessage());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: MessagesService, useValue: messagesService },
        { provide: AgentService, useValue: agentService },
        { provide: SafetyService, useValue: safetyService },
      ],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    gateway.server = { to: () => ({ emit: jest.fn() }) } as any;
    jest
      .spyOn((gateway as any).logger, 'error')
      .mockImplementation(() => undefined);
  });

  it('tells the user they hit the daily limit', async () => {
    agentService.generateMentorReply.mockRejectedValue(
      Object.assign(new Error('Daily AI quota exceeded'), {
        code: 'quota_exceeded',
      }),
    );

    await expect(
      gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'hello',
      }),
    ).rejects.toThrow(/today's message limit/);
  });

  it('reports any other failure without leaking internals', async () => {
    agentService.generateMentorReply.mockRejectedValue(
      new Error('ECONNRESET talking to openai.com'),
    );

    await expect(
      gateway.handleSendMessage(makeSocket(), {
        conversationId: CONV_ID,
        text: 'hello',
      }),
    ).rejects.toThrow(/could not reply just now/);
  });
});
