import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { BoardService } from './board.service';
import { BoardItemDto } from './dto/board-item.dto';

@ApiTags('board')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  @ApiOkResponse({ type: [BoardItemDto] })
  getBoard(@Request() req: any): Promise<BoardItemDto[]> {
    return this.boardService.getBoard(req.user.sub);
  }
}
