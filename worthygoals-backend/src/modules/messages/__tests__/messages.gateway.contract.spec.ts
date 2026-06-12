/**
 * Gateway ↔ client contract test (eval-plan P3).
 *
 * The frontend (helpers/messagesSocket.ts + hooks/useMessages.tsx) depends on:
 *  - event names: 'messageCreated', 'mentorTyping', 'messageChunk'
 *  - messageCreated payload shape = ApiMessage (id, conversationId, role,
 *    contentType, text, clientMessageId, createdAt ISO string, userId, mentorId)
 *  - role values: 'user' for the echo, 'mentor' for the reply — the client
 *    clears its typing indicator on role === 'mentor'
 *  - progressive reveal: mentorTyping fires before generation, the full
 *    message arrives as a single messageCreated
 *  - crisis short-circuit: no mentorTyping, no messageChunk, no AI call —
 *    just the user echo + the crisis mentor message
 *
 * If this suite fails, the chat UI breaks even though unit tests pass.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MessagesGateway } from '../messages.gateway';
import { MessagesService } from '../messages.service';
import { AgentService } from 'src/core/ai';
import { SafetyService } from 'src/core/safety/safety.service';
import { MessageRole, MessageContentType } from 'src/common/constants/enums';

const CONV_ID = 'conv-uuid';
const CLIENT_MSG_ID = 'cm_123_abc';
const SUB = 'cognito-sub';

const userEntity = () => ({
  id: 'user-msg-uuid',
  conversationId: CONV_ID,
  role: MessageRole.USER,
  contentType: MessageContentType.TEXT,
  text: 'hello',
  clientMessageId: CLIENT_MSG_ID,
  createdAt: new Date('2026-06-13T10:00:00.000Z'),
  userId: 42,
  mentorId: null,
});

const mentorEntity = (text = 'mentor reply') => ({
  id: 'mentor-msg-uuid',
  conversationId: CONV_ID,
  role: MessageRole.MENTOR,
  contentType: MessageContentType.TEXT,
  text,
  clientMessageId: null,
  createdAt: new Date('2026-06-13T10:00:05.000Z'),
  userId: null,
  mentorId: 7,
});

const makeSocket = () => ({ handshake: { user: { sub: SUB } } }) as any;

describe('MessagesGateway — client contract', () => {
  let gateway: MessagesGateway;
  let emitted: Array<{ room: string; event: string; data: any }>;
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
      sendUserTextMessage: jest.fn().mockResolvedValue(userEntity()),
      createMentorTextMessage: jest.fn().mockResolvedValue(mentorEntity()),
    };
    agentService = {
      generateMentorReply: jest.fn().mockResolvedValue({
        replyText: 'mentor reply',
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

    emitted = [];
    (gateway as any).server = {
      to: jest.fn((room: string) => ({
        emit: (event: string, data: any) => emitted.push({ room, event, data }),
      })),
    };
  });

  const send = () =>
    gateway.handleSendMessage(makeSocket(), {
      conversationId: CONV_ID,
      text: 'hello',
      clientMessageId: CLIENT_MSG_ID,
    });

  it('emits everything to the conversation room', async () => {
    await send();
    expect(emitted.length).toBeGreaterThan(0);
    for (const e of emitted) {
      expect(e.room).toBe(`conversation:${CONV_ID}`);
    }
  });

  it('progressive reveal: messageCreated(user) → mentorTyping → messageCreated(mentor)', async () => {
    await send();
    const sequence = emitted
      .filter((e) => e.event !== 'messageChunk')
      .map((e) => e.event);
    expect(sequence).toEqual([
      'messageCreated',
      'mentorTyping',
      'messageCreated',
    ]);
  });

  it('user echo matches the ApiMessage shape and carries clientMessageId', async () => {
    await send();
    const [userCreated] = emitted.filter((e) => e.event === 'messageCreated');
    expect(userCreated.data).toEqual({
      id: 'user-msg-uuid',
      conversationId: CONV_ID,
      role: 'user',
      contentType: 'text',
      text: 'hello',
      clientMessageId: CLIENT_MSG_ID,
      createdAt: '2026-06-13T10:00:00.000Z',
      userId: 42,
      mentorId: null,
    });
  });

  it("mentor reply has role 'mentor' — the value the client clears its typing indicator on", async () => {
    await send();
    const created = emitted.filter((e) => e.event === 'messageCreated');
    expect(created).toHaveLength(2);
    expect(created[1].data.role).toBe('mentor');
    expect(created[1].data.conversationId).toBe(CONV_ID);
    expect(typeof created[1].data.createdAt).toBe('string');
  });

  it('mentorTyping payload carries the conversationId the client filters on', async () => {
    await send();
    const typing = emitted.filter((e) => e.event === 'mentorTyping');
    expect(typing).toHaveLength(1);
    expect(typing[0].data).toEqual({ conversationId: CONV_ID });
  });

  describe('crisis short-circuit', () => {
    beforeEach(() => {
      safetyService.isCrisisSignal.mockReturnValue(true);
      messagesService.createMentorTextMessage.mockResolvedValue(
        mentorEntity('crisis help text'),
      );
    });

    it('emits no mentorTyping and no messageChunk', async () => {
      await send();
      const events = emitted.map((e) => e.event);
      expect(events).not.toContain('mentorTyping');
      expect(events).not.toContain('messageChunk');
    });

    it("delivers the crisis response as a normal role-'mentor' messageCreated", async () => {
      await send();
      const created = emitted.filter((e) => e.event === 'messageCreated');
      expect(created).toHaveLength(2);
      expect(created[0].data.role).toBe('user');
      expect(created[1].data.role).toBe('mentor');
      expect(created[1].data.text).toBe('crisis help text');
    });
  });
});
