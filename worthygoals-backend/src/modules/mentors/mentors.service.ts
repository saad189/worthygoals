import { rethrowSafe } from 'src/common/errors/rethrow-safe';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentor } from 'src/database/models';
import { MentorVisibility } from 'src/common/constants';

@Injectable()
export class MentorsService {
  private logger = new Logger(MentorsService.name);

  constructor(
    @InjectRepository(Mentor)
    private readonly mentorRepository: Repository<Mentor>,
  ) {}

  // No ?include=. It used to accept conversations(.messages|.summaries|
  // .memoryItems) and messages(.attachments|.feedback) — but a mentor's
  // conversations and messages belong to every user who talks to it, so
  // GET /mentors?include=conversations.messages returned all users' private
  // chats to any signed-in caller. The app never sent an include.

  async findAll(): Promise<Mentor[]> {
    // Roster only surfaces the live, public personalities. Retired mentors
    // (e.g. legacy discipline specialists) stay resolvable by id but are
    // hidden from the list. Order matches the seeder's sortOrder.
    return this.mentorRepository.find({
      where: { isActive: true, visibility: MentorVisibility.PUBLIC },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Mentor> {
    try {
      const mentor = await this.mentorRepository.findOne({ where: { id } });
      if (!mentor)
        throw new NotFoundException(`Mentor with id: ${id} not found.`);
      return mentor;
    } catch (error) {
      rethrowSafe(
        error,
        this.logger,
        `${MentorsService.name}:${this.findOne.name}`,
      );
    }
  }
}
