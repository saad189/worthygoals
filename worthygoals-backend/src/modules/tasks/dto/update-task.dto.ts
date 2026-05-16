import { PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from 'src/common/constants';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['goalId'] as const),
) {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
