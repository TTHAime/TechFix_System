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
import { ResolveItemDto } from './dto/resolve-item.dto';
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

  @Get('assignment-logs')
  @Roles(Role.Admin, Role.HR)
  async getAllAssignmentLogs(@Query() query: PaginationQueryDto) {
    const result = await this.repairRequestsService.getAllAssignmentLogs(query);
    return { ...result, message: 'Assignment logs retrieved successfully' };
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

  @Patch(':id/confirm')
  @Roles(Role.HR, Role.User)
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.confirm(id, req.user.sub);
    return {
      data,
      message: 'Repair request confirmed and closed successfully',
    };
  }

  @Patch(':id/close')
  @Roles(Role.Admin)
  async close(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.close(id, req.user.sub);
    return { data, message: 'Repair request closed successfully' };
  }

  // ─── Per-item endpoints ───────────────────────────────────────────────────────

  /** Technician accepts (self-assigns) a specific item */
  @Patch(':id/items/:seqNo/accept')
  @Roles(Role.Technician)
  async acceptItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('seqNo', ParseIntPipe) seqNo: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.acceptItem(
      id,
      seqNo,
      req.user.sub,
    );
    return { data, message: 'Item accepted successfully' };
  }

  /** Admin assigns a specific item to a technician */
  @Patch(':id/items/:seqNo/assign')
  @Roles(Role.Admin)
  async assignItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('seqNo', ParseIntPipe) seqNo: number,
    @Body() dto: AssignTechnicianDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.assignItem(
      id,
      seqNo,
      dto.technicianId,
      req.user.sub,
    );
    return { data, message: 'Item assigned successfully' };
  }

  /** Admin unassigns a technician from a specific item */
  @Patch(':id/items/:seqNo/unassign')
  @Roles(Role.Admin)
  async unassignItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('seqNo', ParseIntPipe) seqNo: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.unassignItem(
      id,
      seqNo,
      req.user.sub,
    );
    return { data, message: 'Item unassigned successfully' };
  }

  /** Technician marks their item as resolved */
  @Patch(':id/items/:seqNo/resolve')
  @Roles(Role.Technician)
  async resolveItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('seqNo', ParseIntPipe) seqNo: number,
    @Body() dto: ResolveItemDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.resolveItem(
      id,
      seqNo,
      req.user.sub,
      dto,
    );
    return { data, message: 'Item resolved successfully' };
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRepairRequestDto: UpdateRepairRequestDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const data = await this.repairRequestsService.update(
      id,
      updateRepairRequestDto,
      req.user.sub,
      req.user.roleName,
    );
    return { data, message: 'Repair request updated successfully' };
  }
}
