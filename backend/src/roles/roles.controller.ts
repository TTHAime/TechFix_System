import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.rolesService.create(createRoleDto);
    return { data, message: 'Role created successfully' };
  }

  @Get()
  async findAll() {
    const data = await this.rolesService.findAll();
    return { data, message: 'Roles retrieved successfully' };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.rolesService.findOne(id);
    return { data, message: 'Role retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const data = await this.rolesService.update(id, updateRoleDto);
    return { data, message: 'Role updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.rolesService.remove(id);
    return { data, message: 'Role deleted successfully' };
  }
}
