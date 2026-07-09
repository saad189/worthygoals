import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Account, Role, User } from 'src/database/models';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { USER_ROLES } from 'src/common/constants';
import { calculateAge } from 'src/shared/utils';
/**
 * User Flows
 *
 * 1. Child (self) creates profile, by default the role assigned is Child
 * 2. Adming creates profile, isAdmin -> role is Admin
 * 3. Person creats profile. From UI they select, I am a parent | Creates their profile, but not children's -> They are marked child
 *          - Their child creats profile, sets parentId as their parent. We update their parent's role as Parent, If not already parent
 * 4. Parent creates profile. Creates their own profile, Adds children's auth. Their children would have to fill their profiles themselves. or the parent must login via child account to complete profile
 *      Caveat: Without an Auth Data, we will not create a Profile in Users
 */

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findByUserIds(userIds: number[]): Promise<User[]> {
    try {
      if (!userIds.length)
        throw new BadRequestException('User Ids must be provided.');

      return this.userRepository.findBy({ id: In(userIds) });
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.findByUserIds.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) throw new NotFoundException(`User with id: ${id} not found.`);

      return user;
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.findOne.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async findByAccountSub(sub: string): Promise<User | null> {
    if (!sub) return null;
    return this.userRepository.findOne({ where: { account: { sub } } });
  }

  private async findUserByIdentity(identity: string): Promise<User> {
    try {
      if (!identity)
        throw new BadRequestException('Identity must be provided.');

      const user = await this.userRepository.findOne({
        where: { account: { sub: identity } },
      });

      if (!user)
        throw new NotFoundException(`User with the given identity not found.`);

      return user;
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.findUserByIdentity.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async getUserProfile(identity: string): Promise<ResponseUserDto> {
    try {
      const user = await this.findUserByIdentity(identity);
      return this.getResponseDto(user);
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.getUserProfile.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  private async getOrCreateAccount(params: {
    accountSub: string;
    email: string;
  }): Promise<Account> {
    const { accountSub, email } = params;

    if (!accountSub) {
      throw new BadRequestException('accountSub must be provided.');
    }
    if (!email) {
      throw new BadRequestException('email must be provided.');
    }

    // Try by sub first.
    let account = await this.accountRepository.findOne({
      where: { sub: accountSub },
      relations: { user: true },
    });

    // If no account exists for this sub, ensure email isn't already taken.
    if (!account) {
      const existingByEmail = await this.accountRepository.findOne({
        where: { email },
      });
      if (existingByEmail) {
        throw new ConflictException(
          `Account with email: ${email} already exists`,
        );
      }

      account = this.accountRepository.create({
        sub: accountSub,
        email,
        isSignUp: true,
      });
    } else {
      // Keep email in sync if Cognito/claims provide it.
      if (email && account.email !== email) {
        account.email = email;
      }
    }

    return this.accountRepository.save(account);
  }

  async createForAccount(params: {
    accountSub: string;
    dto: CreateUserDto;
  }): Promise<ResponseUserDto> {
    try {
      const { accountSub, dto } = params;
      const { email } = dto;

      const account = await this.getOrCreateAccount({ accountSub, email });

      // If a profile already exists for this account, block.
      const existingProfile = await this.userRepository.findOne({
        where: { account: { sub: accountSub } },
      });
      if (existingProfile) {
        throw new ConflictException(
          'User profile already exists for this account',
        );
      }

      // Keep legacy behavior: avoid duplicate profiles by email.
      const existingByEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingByEmail) {
        throw new ConflictException(`User with email: ${email} already exists`);
      }

      // Create the user entity from DTO.
      const user = this.userRepository.create(dto);
      user.account = account;

      // Set the user's role based on its properties.
      user.role = await this.getRole(user);

      // Save the new user.
      const newUser = await this.userRepository.save(user);

      return this.getResponseDto(newUser);
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.createForAccount.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async updateProfile(
    sub: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.findUserByIdentity(sub);

      this.userRepository.merge(user, updateUserDto);
      const updatedUser = await this.userRepository.save(user);

      return this.getResponseDto(updatedUser);
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.updateProfile.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  // NOTE: legacy checkExistingUser removed (sub is now on Account)

  /**
   * Calculate the role based on the user's properties.
   * If the user is an admin, return ADMIN.
   * Otherwise, if the user has children, return PARENT, else return CHILD.
   */
  private async getRole(user: User): Promise<Role> {
    try {
      if (!user) throw new NotFoundException('User not found.');
      const { USER, ADMIN } = USER_ROLES;

      const roleName = user.isAdmin ? ADMIN : USER;

      return this.roleRepository.findOne({
        where: { name: roleName },
      });
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.getRole.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  private async getResponseDto(user: User): Promise<ResponseUserDto> {
    if (!user)
      throw new NotFoundException(`User not found, trying to extract Dto`);

    const {
      id,
      firstName,
      lastName,
      email,
      latitude,
      longitude,
      dateOfBirth,
      tone,
      personalityId,
    } = user;

    const role = await this.roleRepository.findOne({
      where: { id: user.role.id },
    });

    const age = calculateAge(dateOfBirth);

    return {
      firstName,
      lastName,
      localtion: { latitude, longitude },
      email,
      id,
      age,
      tone: tone ?? null,
      personalityId: personalityId ?? null,
      role: {
        id: role.id,
        name: role.name,
        permissions: (await role.permissions).map(({ id, name }) => ({
          id,
          name,
        })),
      },
    };
  }
}
