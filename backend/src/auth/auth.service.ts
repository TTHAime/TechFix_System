import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { HashService } from 'src/common/services/hash.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';

const MAX_FAILED_ATTEMPS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

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
      const attempts = user.failedAttempts + 1;
      const lockedUntil =
        attempts >= MAX_FAILED_ATTEMPS
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts, lockedUntil: lockedUntil },
      });

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
    user: { id: number; email: string; roleId: number },
    res: Response,
  ) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    const rawRefreshToken = randomBytes(40).toString('hex');
    const refreshHash = await this.hashService.hash(rawRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.cookie('refresh_token', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    this.logger.log(`User logged in: ${user.id}`);
    return { accessToken };
  }

  async logout(userId: number, rawToken: string, res: Response) {
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    for (const token of activeTokens) {
      const match = await this.hashService.verify(token.tokenHash, rawToken);
      if (match) {
        await this.prisma.refreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
