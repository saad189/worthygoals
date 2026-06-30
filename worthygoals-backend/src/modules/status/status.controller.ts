import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  list(@Request() req: any): Promise<StatusPostDto[]> {
    return this.statusService.findAllForUser(req.user.sub);
  }

  @Post()
  @ApiOkResponse({ type: StatusPostDto })
  create(
    @Request() req: any,
    @Body() dto: CreateStatusDto,
  ): Promise<StatusPostDto> {
    return this.statusService.create(req.user.sub, dto);
  }
}
