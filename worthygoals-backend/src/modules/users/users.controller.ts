import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  HttpCode,
  Request,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { GdprService } from './gdpr.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseUserDto } from './dto/response-user.dto';
import { JwtAuthGuard } from 'src/common/guards';

@ApiTags('User')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly gdprService: GdprService,
  ) {}

  @Get('profile')
  getProfile(@Request() req): Promise<ResponseUserDto> {
    if (!req.user) throw new NotFoundException('User not Logged In');
    return this.usersService.getUserProfile(req.user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    if (!req.user) throw new NotFoundException('User not Logged In');
    return this.usersService.updateProfile(req.user.sub, updateUserDto);
  }

  @Post('me/data-export')
  @ApiOperation({ summary: 'GDPR: export all data for the authenticated user' })
  async exportMyData(@Request() req): Promise<Record<string, unknown>> {
    if (!req.user) throw new NotFoundException('User not Logged In');
    return this.gdprService.exportData(req.user.sub);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'GDPR: permanently delete the authenticated user account and all associated data',
  })
  async deleteMyAccount(@Request() req): Promise<void> {
    if (!req.user) throw new NotFoundException('User not Logged In');
    await this.gdprService.deleteAccount(req.user.sub);
  }

  @Post()
  async create(@Request() req, @Body() createUserDto: Partial<CreateUserDto>) {
    return this.usersService.createForAccount({
      accountSub: req.user.sub,
      dto: createUserDto as CreateUserDto,
    });
  }
}
