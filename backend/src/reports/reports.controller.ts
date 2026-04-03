import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ─── Dashboard ──────────────────────────────────────────────────

  @Get('dashboard/admin')
  @Roles(Role.Admin)
  async dashboardAdmin(@Query() filter: ReportFilterDto) {
    const data = await this.reportsService.getDashboardAdmin(filter);
    return { data, message: 'Admin dashboard retrieved successfully' };
  }

  @Get('dashboard/technician')
  @Roles(Role.Technician)
  async dashboardTechnician(
    @Query() filter: ReportFilterDto,
    @Req() req: express.Request & { user: JwtPayload },
  ) {
    const data = await this.reportsService.getDashboardTechnician(
      req.user.sub,
      filter,
    );
    return { data, message: 'Technician dashboard retrieved successfully' };
  }

  @Get('dashboard/hr')
  @Roles(Role.HR)
  async dashboardHr(@Query() filter: ReportFilterDto) {
    const data = await this.reportsService.getDashboardHr(filter);
    return { data, message: 'HR dashboard retrieved successfully' };
  }

  @Get('dashboard/user')
  @Roles(Role.User)
  async dashboardUser(
    @Query() filter: ReportFilterDto,
    @Req() req: express.Request & { user: JwtPayload },
  ) {
    const data = await this.reportsService.getDashboardUser(
      req.user.sub,
      filter,
    );
    return { data, message: 'User dashboard retrieved successfully' };
  }

  // ─── Export Excel ───────────────────────────────────────────────

  private sendExcel(
    res: express.Response,
    buffer: ArrayBuffer,
    filename: string,
  ) {
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.end(Buffer.from(buffer));
  }

  @Get('export/repair-requests')
  @Roles(Role.Admin)
  async exportRepairRequests(
    @Query() filter: ReportFilterDto,
    @Res() res: express.Response,
  ) {
    const buffer = await this.reportsService.exportRepairRequests(filter);
    this.sendExcel(res, buffer, 'repair-requests.xlsx');
  }

  @Get('export/equipment')
  @Roles(Role.Admin)
  async exportEquipment(
    @Query() filter: ReportFilterDto,
    @Res() res: express.Response,
  ) {
    const buffer = await this.reportsService.exportEquipment(filter);
    this.sendExcel(res, buffer, 'equipment.xlsx');
  }

  @Get('export/my-tasks')
  @Roles(Role.Technician)
  async exportMyTasks(
    @Query() filter: ReportFilterDto,
    @Req() req: express.Request & { user: JwtPayload },
    @Res() res: express.Response,
  ) {
    const buffer = await this.reportsService.exportMyTasks(
      req.user.sub,
      filter,
    );
    this.sendExcel(res, buffer, 'my-tasks.xlsx');
  }

  @Get('export/users')
  @Roles(Role.HR)
  async exportUsers(
    @Query() filter: ReportFilterDto,
    @Res() res: express.Response,
  ) {
    const buffer = await this.reportsService.exportUsers(filter);
    this.sendExcel(res, buffer, 'users.xlsx');
  }

  @Get('export/my-requests')
  @Roles(Role.User)
  async exportMyRequests(
    @Query() filter: ReportFilterDto,
    @Req() req: express.Request & { user: JwtPayload },
    @Res() res: express.Response,
  ) {
    const buffer = await this.reportsService.exportMyRequests(
      req.user.sub,
      filter,
    );
    this.sendExcel(res, buffer, 'my-requests.xlsx');
  }
}
