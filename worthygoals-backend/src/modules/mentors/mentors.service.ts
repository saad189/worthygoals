import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentor } from 'src/database/models';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';

@Injectable()
export class MentorsService {
  private logger = new Logger(MentorsService.name);

  constructor(
    @InjectRepository(Mentor)
    private readonly mentorRepository: Repository<Mentor>,
  ) {}

  private static readonly allowedIncludePaths = new Set([
    'tags',
    'conversations',
    'conversations.messages',
    'conversations.summaries',
    'conversations.memoryItems',
    'messages',
    'messages.attachments',
    'messages.feedback',
  ]);

  private normalizeInclude(include?: string | string[]): string[] {
    if (!include) return [];

    const raw = Array.isArray(include) ? include : [include];
    const parts = raw
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter(Boolean);

    const unique = Array.from(new Set(parts));
    const invalid = unique.filter(
      (p) => !MentorsService.allowedIncludePaths.has(p),
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Invalid include relation(s): ${invalid.join(', ')}. Allowed: ${Array.from(
          MentorsService.allowedIncludePaths,
        ).join(', ')}`,
      );
    }
    return unique;
  }

  private buildRelations(include?: string | string[]) {
    const includes = new Set(this.normalizeInclude(include));

    // Backwards-compatible default: tags
    includes.add('tags');

    const relations: any = {};

    if (includes.has('tags')) relations.tags = true;

    if (
      includes.has('conversations') ||
      includes.has('conversations.messages') ||
      includes.has('conversations.summaries') ||
      includes.has('conversations.memoryItems')
    ) {
      relations.conversations = relations.conversations ?? {};
      if (includes.has('conversations')) {
        relations.conversations = relations.conversations || true;
      }
      if (includes.has('conversations.messages'))
        relations.conversations.messages = true;
      if (includes.has('conversations.summaries'))
        relations.conversations.summaries = true;
      if (includes.has('conversations.memoryItems'))
        relations.conversations.memoryItems = true;
    }

    if (
      includes.has('messages') ||
      includes.has('messages.attachments') ||
      includes.has('messages.feedback')
    ) {
      relations.messages = relations.messages ?? {};
      if (includes.has('messages')) {
        relations.messages = relations.messages || true;
      }
      if (includes.has('messages.attachments'))
        relations.messages.attachments = true;
      if (includes.has('messages.feedback')) relations.messages.feedback = true;
    }

    return relations;
  }

  async findAll(include?: string | string[]): Promise<Mentor[]> {
    return this.mentorRepository.find({
      relations: this.buildRelations(include),
    });
  }

  async findOne(id: number, include?: string | string[]): Promise<Mentor> {
    try {
      const mentor = await this.mentorRepository.findOne({
        where: { id },
        relations: this.buildRelations(include),
      });
      if (!mentor)
        throw new NotFoundException(`Mentor with id: ${id} not found.`);
      return mentor;
    } catch (error) {
      this.logger.log(
        `${MentorsService.name}:${this.findOne.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async create(createMentorDto: CreateMentorDto): Promise<Mentor> {
    try {
      const mentor = this.mentorRepository.create(createMentorDto);
      return await this.mentorRepository.save(mentor);
    } catch (error) {
      this.logger.log(
        `${MentorsService.name}:${this.create.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async update(id: number, updateMentorDto: UpdateMentorDto): Promise<Mentor> {
    try {
      const mentor = await this.findOne(id);
      this.mentorRepository.merge(mentor, updateMentorDto);
      return await this.mentorRepository.save(mentor);
    } catch (error) {
      this.logger.log(
        `${MentorsService.name}:${this.update.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const mentor = await this.findOne(id);
      await this.mentorRepository.remove(mentor);
    } catch (error) {
      this.logger.log(
        `${MentorsService.name}:${this.remove.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }
}
