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
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as {
      id: number;
      email: string;
      roleId: number;
      role: { name: string };
    };
    return this.authService.login(
      {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
      },
      res,
    );
  }

  @Post('refresh')
  @HttpCode(200)
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const data = await this.authService.getMe(user.sub);
    return { data, message: 'User retrieved successfully' };
  }
}
