import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentor as MentorEntity } from 'src/database/models';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { ConversationSummary } from 'src/database/models/conversation-summary.entity';
import { MessageRole } from 'src/common/constants';
import { AiService } from './ai.service';
import OpenAI from 'openai';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(MentorEntity)
    private readonly mentorRepository: Repository<MentorEntity>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ConversationSummary)
    private readonly conversationSummaryRepository: Repository<ConversationSummary>,
    private readonly aiService: AiService,
  ) {}

  async buildAgentInstructionsByMentorId(mentorId: number): Promise<string> {
    const mentor = await this.mentorRepository.findOne({
      where: { id: mentorId },
      relations: {
        tags: true,
      },
    });

    if (!mentor) {
      throw new NotFoundException(`Mentor ${mentorId} not found`);
    }

    return this.buildAgentInstructions(mentor);
  }

  buildAgentInstructions(mentor: MentorEntity): string {
    const traitLine = mentor.personalityTraits
      ? `Traits JSON: ${JSON.stringify(mentor.personalityTraits)}`
      : '';

    const tagLine = mentor.tags?.length
      ? `Tags: ${mentor.tags.map((t) => t.label).join(', ')}`
      : '';

    const personalityPrompt = mentor.promptBlocks?.systemPrompt ?? '';
    const behaviorPrompt = mentor.promptBlocks?.behaviorPrompt ?? '';
    const safetyPrompt = mentor.promptBlocks?.safetyPrompt ?? '';
    const contextPrompt = mentor.promptBlocks?.contextPrompt ?? '';

    return `
You are ${mentor.name}, an AI mentor in the WorthyGoals app.

Personality:
${personalityPrompt}

Behavior rules:
- Be consistent with the personality above.
- Ask 1 focused question when user intent is unclear.
- Keep answers actionable and step-by-step when the user asks for implementation help.

${behaviorPrompt}

${contextPrompt}

${safetyPrompt}

${tagLine}

${traitLine}
`.trim();
  }

  private messageToChatParam(
    message: Message,
  ): OpenAI.ChatCompletionMessageParam | null {
    const content =
      message.text ??
      (message.content ? JSON.stringify(message.content) : null) ??
      '';

    if (!content) return null;

    if (message.role === MessageRole.USER) {
      return { role: 'user', content };
    }

    if (message.role === MessageRole.MENTOR) {
      return { role: 'assistant', content };
    }

    if (message.role === MessageRole.SYSTEM) {
      return { role: 'system', content };
    }

    // TOOL (or unknown) => keep as system to be safe
    return { role: 'system', content };
  }

  async generateMentorReply(params: {
    conversationId: string;
    userId: number;
    recentLimit?: number;
  }): Promise<{
    replyText: string;
    model: string;
    tokensIn: number | null;
    tokensOut: number | null;
    rawUsage: any;
  }> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: params.conversationId },
      select: { id: true, userId: true, mentorId: true },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation ${params.conversationId} not found`,
      );
    }

    if (conversation.userId !== params.userId) {
      throw new BadRequestException('Conversation does not belong to user');
    }

    const mentor = await this.mentorRepository.findOne({
      where: { id: conversation.mentorId },
      relations: { tags: true },
    });

    if (!mentor) {
      throw new NotFoundException(`Mentor ${conversation.mentorId} not found`);
    }

    const [latestSummary, recentMessages] = await Promise.all([
      this.conversationSummaryRepository.findOne({
        where: { conversationId: conversation.id },
        order: { createdAt: 'DESC' },
      }),
      this.messageRepository.find({
        where: { conversationId: conversation.id, archivedAt: null },
        order: { createdAt: 'DESC' },
        take: params.recentLimit ?? 30,
      }),
    ]);

    const instructions = this.buildAgentInstructions(mentor);

    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: instructions },
    ];

    if (latestSummary?.summaryText) {
      chatMessages.push({
        role: 'system',
        content: `Conversation summary (may be partial/outdated):\n${latestSummary.summaryText}`,
      });
    }

    // DB query returns DESC; OpenAI context should be chronological.
    const chronological = recentMessages.reverse();
    for (const m of chronological) {
      const param = this.messageToChatParam(m);
      if (param) chatMessages.push(param);
    }

    const model = mentor.promptBlocks?.model;
    const temperature = mentor.promptBlocks?.temperature;
    const maxOutputTokens = mentor.promptBlocks?.maxOutputTokens;

    const completion = await this.aiService.chatTextWithUsage({
      messages: chatMessages,
      model,
      temperature,
      maxOutputTokens,
    });

    return {
      replyText: completion.text,
      model: completion.model,
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      rawUsage: completion.rawUsage,
    };
  }
}
