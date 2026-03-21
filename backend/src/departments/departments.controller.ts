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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const data = await this.departmentsService.create(createDepartmentDto);
    return { data, message: 'Department created successfully' };
  }

  @Get()
  async findAll() {
    const data = await this.departmentsService.findAll();
    return { data, message: 'Departments retrieved successfully' };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.departmentsService.findOne(id);
    return { data, message: 'Department retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const data = await this.departmentsService.update(id, updateDepartmentDto);
    return { data, message: 'Department updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.departmentsService.remove(id);
    return { data, message: 'Department deleted successfully' };
  }
}
