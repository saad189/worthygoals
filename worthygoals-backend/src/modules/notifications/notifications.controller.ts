import {
  BadRequestException,
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
import { UsersService } from 'src/modules/users/users.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * All three routes used to pass req.user.sub — a Cognito UUID — straight
   * into methods typed `userId: number`, against an integer column. Nothing
   * threw and nothing was written: push_tokens stayed empty, so every
   * notification had zero tokens to send to.
   */
  private async resolveUserId(req: {
    user?: { sub?: string };
  }): Promise<number> {
    const sub = req.user?.sub;
    if (!sub) throw new BadRequestException('Unauthenticated request.');

    const user = await this.usersService.findByAccountSub(sub);
    if (!user) {
      throw new BadRequestException(
        'User profile not found for this token. Create your user profile first.',
      );
    }
    return user.id;
  }

  @Post('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerToken(
    @Request() req,
    @Body() dto: RegisterTokenDto,
  ): Promise<void> {
    await this.notifService.registerToken(await this.resolveUserId(req), dto);
  }

  @Delete('token/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterToken(
    @Request() req,
    @Param('token') token: string,
  ): Promise<void> {
    await this.notifService.unregisterToken(
      await this.resolveUserId(req),
      token,
    );
  }

  @Get('tokens')
  async getTokens(@Request() req) {
    return this.notifService.getTokens(await this.resolveUserId(req));
  }
}
