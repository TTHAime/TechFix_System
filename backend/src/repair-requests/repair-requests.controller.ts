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
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { RepairRequestsService } from './repair-requests.service';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
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
  @Roles(Role.Admin, Role.User)
  create(
    @Body() createRepairRequestDto: CreateRepairRequestDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.repairRequestsService.create(
      createRepairRequestDto,
      req.user.sub,
    );
  }

  @Get()
  @Roles(Role.Admin, Role.Technician, Role.User)
  findAll(@Req() req: Request & { user: JwtPayload }) {
    return this.repairRequestsService.findAll(req.user.sub, req.user.roleName);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Technician, Role.User)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.repairRequestsService.findOne(
      id,
      req.user.sub,
      req.user.roleName,
    );
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Technician)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRepairRequestDto: UpdateRepairRequestDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.repairRequestsService.update(
      id,
      updateRepairRequestDto,
      req.user.sub,
    );
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Technician)
  close(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.repairRequestsService.close(id, req.user.sub);
  }
}
