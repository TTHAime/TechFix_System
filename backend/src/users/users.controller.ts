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
  Query,
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
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // /me routes must be declared before :id routes
  @Get('me')
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  async getMe(@Req() req: Request & { user: JwtPayload }) {
    const data = await this.usersService.findOne(req.user.sub);
    return { data, message: 'User retrieved successfully' };
  }

  @Patch('me')
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  async updateMe(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.usersService.updateProfile(req.user.sub, dto);
    return { data, message: 'Profile updated successfully' };
  }

  @Post('onboard')
  @Roles(Role.HR)
  async hrCreate(
    @Req() req: Request & { user: JwtPayload },
    @Body() hrCreateDto: HRCreateUserDto,
  ) {
    const data = await this.usersService.hrCreate(hrCreateDto, req.user.sub);
    return { data, message: 'User onboarded successfully' };
  }

  @Patch(':id/profile')
  @Roles(Role.Admin, Role.HR)
  async hrUpdate(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() hrUpdateDto: HRUpdateUserDto,
  ) {
    const data = await this.usersService.hrUpdate(
      id,
      hrUpdateDto,
      req.user.sub,
      req.user.roleName as Role,
    );
    return { data, message: 'User updated successfully' };
  }

  @Post()
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateUserDto,
  ) {
    const data = await this.usersService.create(dto, req.user.sub);
    return { data, message: 'User created successfully' };
  }

  @Get()
  @Roles(Role.Admin, Role.HR)
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.usersService.findAll(query);
    return { ...result, message: 'Users retrieved successfully' };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Technician)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOne(id);
    return { data, message: 'User retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.usersService.update(id, dto, req.user.sub);
    return { data, message: 'User updated successfully' };
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.HR)
  async remove(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.usersService.remove(id, req.user.sub, req.user.roleName as Role);
    return { data: null, message: 'User deleted successfully' };
  }
}
