import { AuthenticatedRequest } from 'src/common/interfaces';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ExplainTaskDto } from './dto/explain-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.sub, dto);
  }

  @Get()
  @ApiQuery({ name: 'goalId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('goalId') goalId: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasksService.findAllForGoal(req.user.sub, goalId, limit);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tasksService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.tasksService.remove(req.user.sub, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.CREATED)
  complete(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
  ) {
    return this.tasksService.complete(req.user.sub, id, dto);
  }

  @Post(':id/explain')
  @HttpCode(HttpStatus.CREATED)
  explain(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ExplainTaskDto,
  ) {
    return this.tasksService.explain(req.user.sub, id, dto);
  }
}
