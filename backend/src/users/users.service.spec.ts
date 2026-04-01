import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashService } from 'src/common/services/hash.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuthProvider } from 'src/common/enums/auth-provider.enum';
import { Role } from 'src/common/enums/role.enum';

const fakeRole = { id: 1, name: Role.User };
const fakeDepartment = { id: 1, name: 'IT', location: 'Building A' };
const fakeUser = {
  id: 1,
  name: 'User Example',
  email: 'user@example.com',
  provider: AuthProvider.LOCAL,
  isActive: true,
  role: fakeRole,
  department: fakeDepartment,
};

const actorId = 99;
const paginationQuery = { page: 1, limit: 20 };

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
}

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
  };

  const mockHash = {
    hash: jest.fn().mockResolvedValue('hashed_password'),
  };

  const mockAuditLogs = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HashService, useValue: mockHash },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'User Example',
      email: 'user@example.com',
      roleId: 1,
      deptId: 1,
      provider: AuthProvider.LOCAL,
      password: 'Secret1234!@#Te',
    };

    it('should return created user when input is valid', async () => {
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      const result = await service.create(createDto, actorId);

      expect(result).toEqual(fakeUser);
    });

    it('should hash the password before persisting', async () => {
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      await service.create(createDto, actorId);

      expect(mockHash.hash).toHaveBeenCalledWith('Secret1234!@#Te');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: 'hashed_password' }),
        }),
      );
    });

    it('should call auditLogsService.create with correct payload after successful creation', async () => {
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      await service.create(createDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'user',
          entityId: fakeUser.id,
          action: 'created',
          newValue: fakeUser,
        }),
      );
    });

    it('should throw BadRequestException when provider is LOCAL and no password is given', async () => {
      const dto = { ...createDto, password: undefined };

      await expect(service.create(dto, actorId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not hash password when provider is GOOGLE (no password)', async () => {
      const googleDto = {
        name: 'User Example',
        email: 'user@example.com',
        roleId: 1,
        deptId: 1,
        provider: AuthProvider.GOOGLE,
      };
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      await service.create(googleDto, actorId);

      expect(mockHash.hash).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email is already taken (P2002)', async () => {
      mockPrisma.user.create.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping', async () => {
      mockPrisma.user.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('findAll', () => {
    it('should return data and pagination meta when query is valid', async () => {
      mockPrisma.user.findMany.mockResolvedValue([fakeUser]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeUser]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([fakeUser]);
      mockPrisma.user.count.mockResolvedValue(1);

      await service.findAll({});

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(50);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the user when id exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);

      const result = await service.findOne(1);

      expect(result).toEqual(fakeUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'User Updated', password: 'NewSecret1234!@@#Te' };
    const updatedUser = { ...fakeUser, name: 'User Updated' };

    it('should return the updated user when input is valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto, actorId);

      expect(result).toEqual(updatedUser);
    });

    it('should hash the new password before persisting', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.update(1, updateDto, actorId);

      expect(mockHash.hash).toHaveBeenCalledWith('NewSecret1234!@@#Te');
    });

    it('should call auditLogsService.create with old and new values after successful update', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.update(1, updateDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'user',
          entityId: 1,
          action: 'updated',
          oldValue: fakeUser,
          newValue: updatedUser,
        }),
      );
    });

    it('should throw NotFoundException when user does not exist (P2025)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.update(999, updateDto, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when email is already in use (P2002)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('hrCreate', () => {
    const hrCreateDto = {
      name: 'User Example',
      email: 'user@example.com',
      deptId: 1,
      provider: AuthProvider.LOCAL,
      password: 'Secret1234!@#Te',
    };

    it('should return created user with default role when input is valid', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(fakeRole);
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      const result = await service.hrCreate(hrCreateDto, actorId);

      expect(result).toEqual(fakeUser);
    });

    it('should assign the default "user" role when creating via HR', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(fakeRole);
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      await service.hrCreate(hrCreateDto, actorId);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roleId: fakeRole.id }),
        }),
      );
    });

    it('should throw BadRequestException when provider is LOCAL and no password is given', async () => {
      const dto = { ...hrCreateDto, password: undefined };

      await expect(service.hrCreate(dto, actorId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException when default role is not configured', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(null);

      await expect(service.hrCreate(hrCreateDto, actorId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw ConflictException when email is already taken (P2002)', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(fakeRole);
      mockPrisma.user.create.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.hrCreate(hrCreateDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(fakeRole);
      mockPrisma.user.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.hrCreate(hrCreateDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('hrUpdate', () => {
    const hrUpdateDto = { name: 'User Updated' };
    const updatedUser = { ...fakeUser, name: 'User Updated' };

    it('should return the updated user when input is valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.hrUpdate(1, hrUpdateDto, actorId);

      expect(result).toEqual(updatedUser);
    });

    it('should call auditLogsService.create with old and new values after successful update', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.hrUpdate(1, hrUpdateDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'user',
          entityId: 1,
          action: 'updated',
          oldValue: fakeUser,
          newValue: updatedUser,
        }),
      );
    });

    it('should throw NotFoundException when user does not exist (P2025)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.hrUpdate(999, hrUpdateDto, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when email is already in use (P2002)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.hrUpdate(1, hrUpdateDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.hrUpdate(1, hrUpdateDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('updateProfile', () => {
    const profileDto = { name: 'User Updated' };
    const updatedUser = { ...fakeUser, name: 'User Updated' };

    it('should return the updated user when input is valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(1, profileDto);

      expect(result).toEqual(updatedUser);
    });

    it('should use self as actorId in audit log', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.updateProfile(1, profileDto);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({ actorId: 1, entityId: 1 }),
      );
    });

    it('should throw NotFoundException when user does not exist (P2025)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.updateProfile(999, profileDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when email is already in use (P2002)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.updateProfile(1, profileDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.updateProfile(1, profileDto)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('findByEmailForAuth', () => {
    it('should return user with role when email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);

      const result = await service.findByEmailForAuth('user@example.com');

      expect(result).toEqual(fakeUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'user@example.com' },
        }),
      );
    });

    it('should return null when email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmailForAuth('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should soft-delete the user by setting isActive to false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue({
        ...fakeUser,
        isActive: false,
      });

      await service.remove(1, actorId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { isActive: false },
        }),
      );
    });

    it('should call auditLogsService.create with action "deleted" and oldValue after soft-delete', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockResolvedValue({
        ...fakeUser,
        isActive: false,
      });

      await service.remove(1, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'user',
          entityId: 1,
          action: 'deleted',
          oldValue: fakeUser,
        }),
      );
    });

    it('should throw NotFoundException when user does not exist (P2025)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.remove(999, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should re-throw unexpected errors without wrapping', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.update.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.remove(1, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });
});
