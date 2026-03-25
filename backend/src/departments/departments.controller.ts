import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body() createDepartmentDto: CreateDepartmentDto,
  ) {
    const data = await this.departmentsService.create(
      createDepartmentDto,
      req.user.sub,
    );
    return { data, message: 'Department created successfully' };
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.departmentsService.findAll(query);
    return { ...result, message: 'Departments retrieved successfully' };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.departmentsService.findOne(id);
    return { data, message: 'Department retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const data = await this.departmentsService.update(
      id,
      updateDepartmentDto,
      req.user.sub,
    );
    return { data, message: 'Department updated successfully' };
  }

  @Delete(':id')
  async remove(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.departmentsService.remove(id, req.user.sub);
    return { data, message: 'Department deleted successfully' };
  }
}
