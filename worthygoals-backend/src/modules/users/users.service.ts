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
import { Role, User } from 'src/database/models';
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
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findByUserIds(userIds: number[]): Promise<User[]> {
    try {
      if (!userIds.length) throw new BadRequestException('User Ids must be provided.');

      return this.userRepository.findBy({ id: In(userIds) });
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.findByUserIds.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async findOne(
    id: number,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id }
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

  private async findUserByEmail(email: string): Promise<User> {
    try {
      if (!email) throw new BadRequestException('Email must be provided.');

      const user = await this.userRepository.findOne({ where: { email } });
      console.log({ user, email });
      if (!user)
        throw new NotFoundException(`User with email: ${email} not found.`);

      return user;
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.findUserByEmail.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  private async findUserByIdentity(identity: string): Promise<User> {
    try {
      if (!identity)
        throw new BadRequestException('Identity must be provided.');

      const user = await this.userRepository.findOne({
        where: { sub: identity },
      });

      if (!user)
        throw new NotFoundException(`User with the given identity not found.`);

      return user;
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.findUserByEmail.name}: ${JSON.stringify(error.message)}`,
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

  async create(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    try {
      const { email, parentId } = createUserDto;

      const existingUser = await this.checkExistingUser(createUserDto);
      if (existingUser)
        throw new ConflictException(`User with email: ${email} already exists`);

      // Create the user entity from DTO.
      const user = this.userRepository.create(createUserDto);

      // Set the user's role based on its properties.
      user.role = await this.getRole(user);

      // Save the new user.
      const newUser = await this.userRepository.save(user);

      return this.getResponseDto(newUser);
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.create.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    try {
      const user = await this.findOne(id);

      this.userRepository.merge(user, updateUserDto);
      const updatedUser = await this.userRepository.save(user);

      return this.getResponseDto(updatedUser);
    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.update.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const user = await this.findOne(id);
      await this.userRepository.remove(user);
      // Add code for auth removal too.

    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.remove.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async removeWithIdentity(identity: string): Promise<void> {
    try {
      const user = await this.findUserByEmail(identity);
      await this.userRepository.remove(user);

    } catch (error) {
      this.logger.log(
        `${UsersService.name}:${this.removeWithIdentity.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  private async checkExistingUser(userDto: CreateUserDto): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: userDto.email }, { sub: userDto.sub }],
    });
    return !!existingUser;
  }

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

    const { id, firstName, lastName, email, latitude, longitude, dateOfBirth } =
      user;

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
