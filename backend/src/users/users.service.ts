import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HRCreateUserDto } from './dto/hr-create-user.dto';
import { HRUpdateUserDto } from './dto/hr-update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuthProvider } from 'src/common/enums/auth-provider.enum';
import { Role } from 'src/common/enums/role.enum';
import { HashService } from 'src/common/services/hash.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createUserDto: CreateUserDto, actorId: number) {
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
        data: {
          ...rest,
          passwordHash,
          mustChangePassword: !!password,
        },
        include: { role: true, department: true },
        omit: { passwordHash: true },
      });
      this.logger.log(`User created: ${user.id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'user',
        entityId: user.id,
        action: 'created',
        newValue: user,
      });
      return user;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }
      this.logger.error(
        `Failed to create user`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async findAll(query: PaginationQueryDto, includeInactive = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = includeInactive ? {} : { isActive: true };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: { role: true, department: true },
        omit: { passwordHash: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, department: true },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, actorId: number) {
    const oldUser = await this.findOne(id);
    const { password, ...rest } = updateUserDto;
    const passwordHash = password
      ? await this.hashService.hash(password)
      : undefined;

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { ...rest, ...(passwordHash && { passwordHash }) },
        include: { role: true, department: true },
        omit: { passwordHash: true },
      });
      this.logger.log(`User updated: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'user',
        entityId: id,
        action: 'updated',
        oldValue: oldUser,
        newValue: user,
      });
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

  async hrCreate(hrCreateDto: HRCreateUserDto, actorId: number) {
    if (hrCreateDto.provider === AuthProvider.LOCAL && !hrCreateDto.password) {
      throw new BadRequestException('Password is required for local accounts');
    }

    const defaultRole = await this.prisma.role.findFirst({
      where: { name: Role.User },
    });
    if (!defaultRole) {
      throw new InternalServerErrorException('Default role not configured');
    }

    const { password, ...rest } = hrCreateDto;
    const passwordHash = password
      ? await this.hashService.hash(password)
      : null;

    try {
      const user = await this.prisma.user.create({
        data: {
          ...rest,
          roleId: defaultRole.id,
          passwordHash,
          mustChangePassword: !!password,
        },
        include: { role: true, department: true },
        omit: { passwordHash: true },
      });
      this.logger.log(`User onboarded by HR: ${user.id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'user',
        entityId: user.id,
        action: 'created',
        newValue: user,
      });
      return user;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }
      this.logger.error(
        `Failed to onboard user by HR`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async hrUpdate(
    id: number,
    hrUpdateDto: HRUpdateUserDto,
    actorId: number,
    callerRole: Role,
  ) {
    const oldUser = await this.findOne(id);
    if (callerRole === Role.HR && (oldUser.role.name as Role) === Role.Admin) {
      throw new ForbiddenException('HR cannot modify admin users');
    }
    const { password, ...rest } = hrUpdateDto;
    const passwordHash = password
      ? await this.hashService.hash(password)
      : undefined;

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { ...rest, ...(passwordHash && { passwordHash }) },
        include: { role: true, department: true },
        omit: { passwordHash: true },
      });
      this.logger.log(`User updated by HR/Admin: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'user',
        entityId: id,
        action: 'updated',
        oldValue: oldUser,
        newValue: user,
      });
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('User not found');
        if (e.code === 'P2002')
          throw new ConflictException('Email already in use');
      }
      this.logger.error(
        `Failed to update user ${id} by HR`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto) {
    const oldUser = await this.findOne(id);
    const { password, ...rest } = updateProfileDto;
    const passwordHash = password
      ? await this.hashService.hash(password)
      : undefined;

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { ...rest, ...(passwordHash && { passwordHash }) },
        include: { role: true, department: true },
        omit: { passwordHash: true },
      });
      this.logger.log(`Profile updated: ${id}`);
      await this.auditLogsService.create({
        actorId: id,
        entityType: 'user',
        entityId: id,
        action: 'updated',
        oldValue: oldUser,
        newValue: user,
      });
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('User not found');
        if (e.code === 'P2002')
          throw new ConflictException('Email already in use');
      }
      this.logger.error(
        `Failed to update profile ${id}`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async forceChangePassword(userId: number, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mustChangePassword) {
      throw new BadRequestException('Password change is not required');
    }

    const passwordHash = await this.hashService.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    this.logger.log(`User ${userId} completed forced password change`);
    await this.auditLogsService.create({
      actorId: userId,
      entityType: 'user',
      entityId: userId,
      action: 'updated',
      oldValue: { mustChangePassword: true },
      newValue: { mustChangePassword: false },
    });
  }

  async findPendingPasswordChange() {
    const users = await this.prisma.user.findMany({
      where: { mustChangePassword: true, isActive: true },
      include: { role: true, department: true },
      omit: { passwordHash: true },
      orderBy: { createdAt: 'desc' },
    });
    this.logger.log(
      `Exported pending password change list: ${users.length} user(s)`,
    );
    return users;
  }

  async findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async remove(id: number, actorId: number, callerRole: Role) {
    const oldUser = await this.findOne(id);
    if (callerRole === Role.HR && (oldUser.role.name as Role) === Role.Admin) {
      throw new ForbiddenException('HR cannot delete admin users');
    }
    try {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      this.logger.log(`User soft-deleted: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'user',
        entityId: id,
        action: 'deleted',
        oldValue: oldUser,
      });
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
