import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';
import { Mentor } from 'src/database/models';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';

@Controller('mentors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

  @Post()
  async create(@Body() createMentorDto: CreateMentorDto): Promise<Mentor> {
    return this.mentorsService.create(createMentorDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMentorDto: UpdateMentorDto,
  ): Promise<Mentor> {
    return this.mentorsService.update(id, updateMentorDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.mentorsService.remove(id);
  }
}
