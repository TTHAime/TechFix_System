import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HRCreateUserDto } from './dto/hr-create-user.dto';
import { HRUpdateUserDto } from './dto/hr-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

interface JwtUser {
  sub: number;
  email: string;
  roleId: number;
  roleName: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  getMe(@Req() req: Request & { user: JwtUser }) {
    return this.usersService.findOne(req.user.sub);
  }

  @Patch('me')
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  updateMe(
    @Req() req: Request & { user: JwtUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Post('onboard')
  @Roles(Role.HR)
  hrCreate(@Body() hrCreateDto: HRCreateUserDto) {
    return this.usersService.hrCreate(hrCreateDto);
  }

  @Patch(':id/profile')
  @Roles(Role.Admin, Role.HR)
  hrUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() hrUpdateDto: HRUpdateUserDto,
  ) {
    return this.usersService.hrUpdate(id, hrUpdateDto);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Technician)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.HR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
