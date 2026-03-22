import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuthProvider } from 'src/common/enums/auth-provider.enum';
import { HashService } from 'src/common/services/hash.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    if (
      createUserDto.provider === AuthProvider.LOCAL &&
      !createUserDto.password
    ) {
      throw new BadRequestException('Password is required for local accounts');
    }

    const { password, ...rest } = createUserDto;
    const passwordHash = password
      ? await this.hashService.hash(password)
      : null;

    try {
      const user = await this.prisma.user.create({
        data: { ...rest, passwordHash: passwordHash },
        omit: { passwordHash: true },
      });
      this.logger.log(`User created: ${user.id}`);
      return user;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }
      throw e;
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        omit: { passwordHash: true },
      });
    } catch (e) {
      this.logger.error('Failed to fetch users', e);
      throw e;
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        omit: { passwordHash: true },
      });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      this.logger.error(`Failed to fetch user ${id}`, e);
      throw e;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    const passwordHash = password
      ? await this.hashService.hash(password)
      : undefined;

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { ...rest, ...(passwordHash && { passwordHash }) },
        omit: { passwordHash: true },
      });
      this.logger.log(`User updated: ${id}`);
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('User not found');
        if (e.code === 'P2002')
          throw new ConflictException('Email already in use');
      }
      this.logger.error(`Failed to update user ${id}`, e);
      throw e;
    }
  }

  async findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateLoginAttempt(
    id: number,
    failedAttempts: number,
    lockedUntil: Date | null,
  ) {
    await this.prisma.user.update({
      where: { id },
      data: { failedAttempts, lockedUntil },
    });
  }

  async remove(id: number) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      this.logger.log(`User soft-deleted: ${id}`);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      this.logger.error(`Failed to remove user ${id}`, e);
      throw e;
    }
  }
}
