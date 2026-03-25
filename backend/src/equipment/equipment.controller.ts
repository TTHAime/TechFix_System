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
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body() createEquipmentDto: CreateEquipmentDto,
  ) {
    const data = await this.equipmentService.create(
      createEquipmentDto,
      req.user.sub,
    );
    return { data, message: 'Equipment created successfully' };
  }

  @Get()
  @Roles(Role.Admin, Role.Technician, Role.User)
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.equipmentService.findAll(query);
    return { ...result, message: 'Equipment retrieved successfully' };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Technician, Role.User)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.equipmentService.findOne(id);
    return { data, message: 'Equipment retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    const data = await this.equipmentService.update(
      id,
      updateEquipmentDto,
      req.user.sub,
    );
    return { data, message: 'Equipment updated successfully' };
  }

  @Delete(':id')
  async remove(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const data = await this.equipmentService.remove(id, req.user.sub);
    return { data, message: 'Equipment deleted successfully' };
  }
}
