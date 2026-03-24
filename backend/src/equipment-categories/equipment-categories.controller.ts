import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { EquipmentCategoriesService } from './equipment-categories.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';
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
  create(@Body() createEquipmentCategoryDto: CreateEquipmentCategoryDto) {
    return this.equipmentCategoriesService.create(createEquipmentCategoryDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Technician)
  findAll() {
    return this.equipmentCategoriesService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Technician)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentCategoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentCategoryDto: UpdateEquipmentCategoryDto,
  ) {
    return this.equipmentCategoriesService.update(
      id,
      updateEquipmentCategoryDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentCategoriesService.remove(id);
  }
}
