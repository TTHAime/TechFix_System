import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface LocalUser {
  id: number;
  email: string;
  roleId: number;
  roleName: string;
}

interface JwtUser {
  sub: number;
  email: string;
  roleId: number;
  roleName: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user as LocalUser, res);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies['refresh_token'] as string | undefined;
    if (!rawToken) throw new UnauthorizedException('No refresh token');

    const user = req.user as JwtUser;
    return this.authService.logout(user.sub, rawToken, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return { data: req.user as JwtUser };
  }
}
