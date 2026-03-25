import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { EquipmentCategoriesService } from './equipment-categories.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('equipment-categories')
export class EquipmentCategoriesController {
  constructor(
    private readonly equipmentCategoriesService: EquipmentCategoriesService,
  ) {}

  @Post()
  async create(@Body() createEquipmentCategoryDto: CreateEquipmentCategoryDto) {
    const data = await this.equipmentCategoriesService.create(
      createEquipmentCategoryDto,
    );
    return { data, message: 'Equipment category created successfully' };
  }

  @Get()
  @Roles(Role.Admin, Role.Technician)
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.equipmentCategoriesService.findAll(query);
    return {
      ...result,
      message: 'Equipment categories retrieved successfully',
    };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Technician)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.equipmentCategoriesService.findOne(id);
    return { data, message: 'Equipment category retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentCategoryDto: UpdateEquipmentCategoryDto,
  ) {
    const data = await this.equipmentCategoriesService.update(
      id,
      updateEquipmentCategoryDto,
    );
    return { data, message: 'Equipment category updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.equipmentCategoriesService.remove(id);
    return { data, message: 'Equipment category deleted successfully' };
  }
}
