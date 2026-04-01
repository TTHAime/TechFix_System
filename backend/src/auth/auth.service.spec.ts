import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { HashService } from 'src/common/services/hash.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { UnauthorizedException } from '@nestjs/common';

const mockPrisma = {
  user: {
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockAccessToken = 'mock_access_token';

const mockJwtService = {
  sign: jest.fn().mockReturnValue(mockAccessToken),
};

const mockHashService = {
  hash: jest.fn(),
  verify: jest.fn(),
};

const mockUserService = {
  findByEmailForAuth: jest.fn(),
  findOne: jest.fn(),
};

const TEST_EMAIL = 'test@techfix.com';
const TEST_PASSWORD = 'P@ssw0rd1234!Te';

const mockUser = {
  id: 1,
  email: TEST_EMAIL,
  passwordHash: 'hashed_password',
  isActive: true,
  failedAttempts: 0,
  lockedUntil: null,
  roleId: 2,
  providerUid: null,
  provider: 'local',
  role: { id: 2, name: 'user' },
};

const mockLoginUser = {
  id: mockUser.id,
  email: mockUser.email,
  roleId: mockUser.roleId,
  roleName: mockUser.role.name,
};

const { passwordHash: _pw, ...mockUserWithoutPasswordHash } = mockUser;

const mockUserLocked = {
  ...mockUser,
  lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
};

const mockRefreshToken = {
  id: 10,
  userId: 1,
  tokenHash: 'some_hash',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  user: {
    ...mockUser,
    role: { id: 2, name: 'user' },
  },
};

const mockRes = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as Partial<Response> as Response;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: HashService, useValue: mockHashService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without passwordHash on success', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(mockUser);
      mockHashService.verify.mockResolvedValue(true);

      const result = await service.validateUser(TEST_EMAIL, TEST_PASSWORD);

      expect(result).toEqual(mockUserWithoutPasswordHash);
    });
    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(null);
      await expect(
        service.validateUser(TEST_EMAIL, TEST_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException when user has no passwordHash', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expect(
        service.validateUser(TEST_EMAIL, TEST_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException when user is inactive', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.validateUser(TEST_EMAIL, TEST_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(mockUserLocked);

      await expect(
        service.validateUser(TEST_EMAIL, TEST_PASSWORD),
      ).rejects.toThrow('Account temporarily locked');
    });

    it('should increment failedAttempts when password is wrong', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(mockUser);
      mockHashService.verify.mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValueOnce({ failedAttempts: 1 });

      await expect(
        service.validateUser(TEST_EMAIL, TEST_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedAttempts: { increment: 1 } },
        select: { failedAttempts: true },
      });
    });

    it('should set lockedUntil when failedAttempts reaches MAX_FAILED_ATTEMPTS', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(mockUser);
      mockHashService.verify.mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValueOnce({ failedAttempts: 5 });

      await expect(
        service.validateUser(TEST_EMAIL, TEST_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            lockedUntil: expect.any(Date) as Date,
          }),
        }),
      );
    });

    it('should not set lockedUntil when failedAttempts is below threshold', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(mockUser);
      mockHashService.verify.mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValueOnce({ failedAttempts: 3 });

      await expect(
        service.validateUser(TEST_EMAIL, TEST_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lockedUntil: expect.any(Date) as Date,
          }),
        }),
      );
    });

    it('should reset failedAttempts and lockedUntil on successful login', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(mockUser);
      mockHashService.verify.mockResolvedValue(true);

      await service.validateUser(TEST_EMAIL, TEST_PASSWORD);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    });
  });

  describe('login', () => {
    it('should return accessToken', async () => {
      const result = await service.login(mockLoginUser, mockRes);

      expect(result).toEqual({ accessToken: mockAccessToken });
    });
    it('should sign JWT with correct payload', async () => {
      await service.login(mockLoginUser, mockRes);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockLoginUser.id,
        email: mockLoginUser.email,
        roleId: mockLoginUser.roleId,
        roleName: mockLoginUser.roleName,
      });
    });
    it('should create a RefreshToken record with hashed token', async () => {
      await service.login(mockLoginUser, mockRes);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: mockLoginUser.id,
          tokenHash: expect.any(String) as string,
          expiresAt: expect.any(Date) as Date,
        },
      });
    });
    it('should set refresh_token httpOnly cookie', async () => {
      await service.login(mockLoginUser, mockRes);

      expect(mockRes.cookie as jest.Mock).toHaveBeenCalledWith(
        'refresh_token',
        expect.any(String) as string,
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('refresh', () => {
    it('should return new accessToken', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(mockRefreshToken);

      const result = await service.refresh('raw_token', mockRes);

      expect(result).toEqual({ accessToken: mockAccessToken });
    });

    it('should revoke old refresh token', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(mockRefreshToken);

      await service.refresh('raw_token', mockRes);

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: { revokedAt: expect.any(Date) as Date },
      });
    });

    it('should create new refresh token (rotation)', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(mockRefreshToken);

      await service.refresh('raw_token', mockRes);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: mockRefreshToken.user.id,
          tokenHash: expect.any(String) as string,
          expiresAt: expect.any(Date) as Date,
        },
      });
    });

    it('should throw UnauthorizedException when token not found', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('raw_token', mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is revoked', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('raw_token', mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('raw_token', mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        ...mockRefreshToken,
        user: { ...mockRefreshToken.user, isActive: false },
      });

      await expect(service.refresh('raw_token', mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke the matching refresh token', async () => {
      await service.logout(mockUser.id, 'raw_token', mockRes);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          tokenHash: expect.any(String) as string,
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) as Date },
      });
    });

    it('should clear the refresh_token cookie', async () => {
      await service.logout(mockUser.id, 'raw_token', mockRes);

      expect(mockRes.clearCookie as jest.Mock).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('googleLogin', () => {
    it('should throw UnauthorizedException when email not found', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue(null);

      await expect(
        service.googleLogin(
          { providerUid: 'uid', email: TEST_EMAIL, name: 'Test' },
          mockRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.googleLogin(
          { providerUid: 'uid', email: TEST_EMAIL, name: 'Test' },
          mockRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should link providerUid on first Google login', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue({
        ...mockUser,
        providerUid: null,
      });

      await service.googleLogin(
        { providerUid: 'google-uid', email: TEST_EMAIL, name: 'Test' },
        mockRes,
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { provider: 'google', providerUid: 'google-uid' },
      });
    });

    it('should not update user when providerUid is already set', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue({
        ...mockUser,
        providerUid: 'existing-uid',
      });

      await service.googleLogin(
        { providerUid: 'google-uid', email: TEST_EMAIL, name: 'Test' },
        mockRes,
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should call login and return accessToken on success', async () => {
      mockUserService.findByEmailForAuth.mockResolvedValue({
        ...mockUser,
        providerUid: 'existing-uid',
      });

      const result = await service.googleLogin(
        { providerUid: 'existing-uid', email: TEST_EMAIL, name: 'Test' },
        mockRes,
      );

      expect(result).toEqual({ accessToken: mockAccessToken });
    });
  });

  describe('getMe', () => {
    it('should return the result of usersService.findOne', async () => {
      mockUserService.findOne.mockResolvedValue(mockUserWithoutPasswordHash);

      const result = await service.getMe(mockUser.id);

      expect(mockUserService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUserWithoutPasswordHash);
    });
  });
});
