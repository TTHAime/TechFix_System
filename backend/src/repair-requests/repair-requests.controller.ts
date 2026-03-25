import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { RepairRequestsService } from './repair-requests.service';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('repair-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class RepairRequestsController {
  constructor(private readonly repairRequestsService: RepairRequestsService) {}

  @Post()
  @Roles(Role.Admin, Role.HR, Role.User)
  async create(
    @Body() createRepairRequestDto: CreateRepairRequestDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.create(
      createRepairRequestDto,
      req.user.sub,
    );
    return { data, message: 'Repair request created successfully' };
  }

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const result = await this.repairRequestsService.findAll(
      req.user.sub,
      req.user.roleName,
      query,
    );
    return { ...result, message: 'Repair requests retrieved successfully' };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.findOne(
      id,
      req.user.sub,
      req.user.roleName,
    );
    return { data, message: 'Repair request retrieved successfully' };
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Technician)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRepairRequestDto: UpdateRepairRequestDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.update(
      id,
      updateRepairRequestDto,
      req.user.sub,
    );
    return { data, message: 'Repair request updated successfully' };
  }

  @Patch(':id/close')
  @Roles(Role.Admin, Role.Technician)
  async close(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.close(id, req.user.sub);
    return { data, message: 'Repair request closed successfully' };
  }

  @Post(':id/assign')
  @Roles(Role.Admin)
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTechnicianDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.assignTechnician(
      id,
      dto.technicianId,
      req.user.sub,
    );
    return { data, message: 'Technician assigned successfully' };
  }

  @Post(':id/unassign')
  @Roles(Role.Admin)
  async unassign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTechnicianDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.unassignTechnician(
      id,
      dto.technicianId,
      req.user.sub,
    );
    return { data, message: 'Technician unassigned successfully' };
  }

  @Get(':id/assignment-logs')
  @Roles(Role.Admin, Role.HR, Role.Technician)
  async getAssignmentLogs(@Param('id', ParseIntPipe) id: number) {
    const data = await this.repairRequestsService.getAssignmentLogs(id);
    return { data, message: 'Assignment logs retrieved successfully' };
  }

  @Get(':id/status-logs')
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  async getStatusLogs(@Param('id', ParseIntPipe) id: number) {
    const data = await this.repairRequestsService.getStatusLogs(id);
    return { data, message: 'Status logs retrieved successfully' };
  }
}
