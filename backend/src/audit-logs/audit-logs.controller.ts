import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { AuditLogsService } from './audit-logs.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.auditLogsService.findAll(query);
    return { ...result, message: 'Audit logs retrieved successfully' };
  }

  @Get(':entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.auditLogsService.findByEntity(entityType, entityId, query);
    return { ...result, message: 'Audit logs retrieved successfully' };
  }
}
