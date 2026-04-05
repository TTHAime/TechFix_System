import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForceChangePasswordDto } from './dto/force-change-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CsrfOriginGuard } from 'src/common/guards/csrf-origin.guard';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(CsrfOriginGuard, LocalAuthGuard)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as {
      id: number;
      email: string;
      roleId: number;
      role: { name: string };
      mustChangePassword: boolean;
    };
    return this.authService.login(
      {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        mustChangePassword: user.mustChangePassword,
      },
      res,
    );
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(CsrfOriginGuard)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies['refresh_token'] as string | undefined;
    if (!rawToken) throw new UnauthorizedException('No refresh token');
    return this.authService.refresh(rawToken, res);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies['refresh_token'] as string | undefined;
    if (!rawToken) throw new UnauthorizedException('No refresh token');
    const user = req.user as JwtPayload;
    return this.authService.logout(user.sub, rawToken, res);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects to Google — this method body is never called
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const googleUser = req.user as {
      providerUid: string;
      email: string;
      name: string;
    };

    const frontendUrl = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

    try {
      const { accessToken } = await this.authService.googleLogin(
        googleUser,
        res,
      );
      res.redirect(`${frontendUrl}/auth/google/callback?token=${accessToken}`);
    } catch (error) {
      const message =
        error instanceof UnauthorizedException ? error.message : 'Login failed';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
    }
  }

  @Post('force-change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async forceChangePassword(
    @Req() req: Request,
    @Body() dto: ForceChangePasswordDto,
  ) {
    const user = req.user as JwtPayload;
    await this.authService.forceChangePassword(user.sub, dto.newPassword);
    return { data: null, message: 'Password changed successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const data = await this.authService.getMe(user.sub);
    return { data, message: 'User retrieved successfully' };
  }
}
