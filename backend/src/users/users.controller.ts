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
  Res,
  Query,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import ExcelJS from 'exceljs';
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
import { UserQueryDto } from './dto/user-query.dto';
import { generatePassword } from 'src/common/utils/generate-password';
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

  @Get('generate-password')
  @Roles(Role.Admin, Role.HR)
  generateUserPassword() {
    return { data: generatePassword(), message: 'Password generated' };
  }

  @Get('export-pending-password')
  @Roles(Role.Admin, Role.HR)
  async exportPendingPassword(@Res() res: Response) {
    const users = await this.usersService.findPendingPasswordChange();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pending Password Change');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };

    for (const u of users) {
      sheet.addRow({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        department: u.department.name,
        createdAt: new Date(u.createdAt).toLocaleString('th-TH'),
      });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=pending-password-change.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
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
  async findAll(
    @Req() req: Request & { user: JwtPayload },
    @Query() query: UserQueryDto,
  ) {
    const isAdmin = req.user.roleName === Role.Admin;
    const showInactive = isAdmin && query.includeInactive === true;
    const result = await this.usersService.findAll(query, showInactive);
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
