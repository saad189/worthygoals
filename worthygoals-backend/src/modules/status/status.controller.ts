import { AuthenticatedRequest } from 'src/common/interfaces';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { StatusService } from './status.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { StatusPostDto } from './dto/status-post.dto';

@ApiTags('status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @ApiOkResponse({ type: [StatusPostDto] })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'before',
    required: false,
    description: 'ISO timestamp cursor',
  })
  list(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ): Promise<StatusPostDto[]> {
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && Number.isNaN(beforeDate.getTime())) {
      throw new BadRequestException('before must be an ISO timestamp');
    }
    return this.statusService.findAllForUser(req.user.sub, {
      limit,
      before: beforeDate,
    });
  }

  @Post()
  @ApiOkResponse({ type: StatusPostDto })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateStatusDto,
  ): Promise<StatusPostDto> {
    return this.statusService.create(req.user.sub, dto);
  }
}
