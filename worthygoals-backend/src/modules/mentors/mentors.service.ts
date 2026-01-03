import {
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

  async findAll(): Promise<Mentor[]> {
    return this.mentorRepository.find({ relations: { tags: true } });
  }

  async findOne(id: number): Promise<Mentor> {
    try {
      const mentor = await this.mentorRepository.findOne({
        where: { id },
        relations: { tags: true },
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
