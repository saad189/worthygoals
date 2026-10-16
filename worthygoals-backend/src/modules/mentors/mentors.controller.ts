import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { Mentor } from 'src/database/models';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';

/**
 * Mentors are catalog data, seeded and versioned with the codebase.
 *
 * The write routes that used to live here (POST / PATCH / DELETE) sat behind
 * JwtAuthGuard alone, and `mentors` is the one table with no userId, so any
 * authenticated user could rewrite or delete every mentor's system prompt.
 * There is no RolesGuard in this codebase and no client ever called them, so
 * they are removed rather than guarded. Changes to the roster go through a
 * seeder/migration.
 *
 * ClassSerializerInterceptor applies the entity's @Exclude decorators, which
 * keep promptBlocks and the topic/safety/memory/model policies server-side.
 */
@Controller('mentors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  async findAll(): Promise<Mentor[]> {
    return this.mentorsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Mentor> {
    return this.mentorsService.findOne(id);
  }
}
