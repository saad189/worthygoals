import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { RegisterTokenDto } from './dto/register-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Post('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerToken(
    @Request() req,
    @Body() dto: RegisterTokenDto,
  ): Promise<void> {
    await this.notifService.registerToken(req.user.sub, dto);
  }

  @Delete('token/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterToken(
    @Request() req,
    @Param('token') token: string,
  ): Promise<void> {
    await this.notifService.unregisterToken(req.user.sub, token);
  }

  @Get('tokens')
  getTokens(@Request() req) {
    return this.notifService.getTokens(req.user.sub);
  }
}
