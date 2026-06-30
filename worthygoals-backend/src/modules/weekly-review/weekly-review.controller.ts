import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { WeeklyReviewService } from './weekly-review.service';
import { WeeklyReviewDto } from './dto/weekly-review.dto';

@ApiTags('weekly-review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('weekly-review')
export class WeeklyReviewController {
  constructor(private readonly weeklyReviewService: WeeklyReviewService) {}

  @Get()
  @ApiOkResponse({ type: WeeklyReviewDto })
  getReview(@Request() req: any): Promise<WeeklyReviewDto> {
    return this.weeklyReviewService.getReview(req.user.sub);
  }
}
