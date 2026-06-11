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
