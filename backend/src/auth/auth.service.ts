import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { HashService } from 'src/common/services/hash.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import type { Response } from 'express';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailForAuth(email);
    if (!user || !user.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    const isValid = await this.hashService.verify(user.passwordHash, password);

    if (!isValid) {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: { increment: 1 } },
        select: { failedAttempts: true },
      });

      if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) },
        });
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(
    user: { id: number; email: string; roleId: number; roleName: string },
    res: Response,
  ) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
    });

    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = hashRefreshToken(rawRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    this.setRefreshCookie(res, rawRefreshToken);
    this.logger.log(`User logged in: ${user.id}`);
    return { accessToken };
  }

  async refresh(rawToken: string, res: Response) {
    const tokenHash = hashRefreshToken(rawToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true } } },
    });

    if (!storedToken || !storedToken.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = storedToken.user;
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    });

    // Issue new refresh token (rotation)
    const newRawToken = randomBytes(40).toString('hex');
    const newTokenHash = hashRefreshToken(newRawToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    this.setRefreshCookie(res, newRawToken);
    this.logger.log(`Token refreshed for user: ${user.id}`);
    return { accessToken };
  }

  async logout(userId: number, rawToken: string, res: Response) {
    const tokenHash = hashRefreshToken(rawToken);

    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  async googleLogin(
    googleUser: { providerUid: string; email: string; name: string },
    res: Response,
  ) {
    const user = await this.usersService.findByEmailForAuth(googleUser.email);

    if (!user) {
      throw new UnauthorizedException(
        'No account found — please contact HR to be onboarded first',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Link providerUid on first Google login if not set yet
    if (!user.providerUid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { provider: 'google', providerUid: googleUser.providerUid },
      });
    }

    return this.login(
      {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
      },
      res,
    );
  }

  async getMe(userId: number) {
    return this.usersService.findOne(userId);
  }

  private setRefreshCookie(res: Response, rawToken: string) {
    res.cookie('refresh_token', rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });
  }
}
