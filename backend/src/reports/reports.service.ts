import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Date filter helper ───────────────────────────────────────────

  private buildDateFilter(filter: ReportFilterDto) {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.createdAt = {
        ...(filter.startDate && { gte: new Date(filter.startDate) }),
        ...(filter.endDate && { lte: new Date(filter.endDate) }),
      };
    }
    if (filter.statusId) where.statusId = filter.statusId;
    return where;
  }

  // ─── Raw query helper for requests by department with date filter ─

  private getRequestsByDepartment(filter: ReportFilterDto) {
    type Row = { dept_name: string; count: bigint };
    if (filter.startDate && filter.endDate) {
      return this.prisma.$queryRaw<Row[]>`
        SELECT d.name AS dept_name, COUNT(rr.id)::int AS count
        FROM repair_requests rr
        JOIN users u ON u.id = rr.requester_id
        JOIN departments d ON d.id = u.dept_id
        WHERE rr.created_at >= ${new Date(filter.startDate)}
          AND rr.created_at <= ${new Date(filter.endDate)}
        GROUP BY d.name ORDER BY count DESC`;
    }
    if (filter.startDate) {
      return this.prisma.$queryRaw<Row[]>`
        SELECT d.name AS dept_name, COUNT(rr.id)::int AS count
        FROM repair_requests rr
        JOIN users u ON u.id = rr.requester_id
        JOIN departments d ON d.id = u.dept_id
        WHERE rr.created_at >= ${new Date(filter.startDate)}
        GROUP BY d.name ORDER BY count DESC`;
    }
    if (filter.endDate) {
      return this.prisma.$queryRaw<Row[]>`
        SELECT d.name AS dept_name, COUNT(rr.id)::int AS count
        FROM repair_requests rr
        JOIN users u ON u.id = rr.requester_id
        JOIN departments d ON d.id = u.dept_id
        WHERE rr.created_at <= ${new Date(filter.endDate)}
        GROUP BY d.name ORDER BY count DESC`;
    }
    return this.prisma.$queryRaw<Row[]>`
      SELECT d.name AS dept_name, COUNT(rr.id)::int AS count
      FROM repair_requests rr
      JOIN users u ON u.id = rr.requester_id
      JOIN departments d ON d.id = u.dept_id
      GROUP BY d.name ORDER BY count DESC`;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════════════

  async getDashboardAdmin(filter: ReportFilterDto) {
    this.logger.log('Generating admin dashboard');
    const dateFilter = this.buildDateFilter(filter);

    const [
      byStatus,
      byDepartment,
      topEquipment,
      monthlyTrend,
      totalRequests,
      avgResolutionTime,
    ] = await Promise.all([
      // Requests by status
      this.prisma.repairRequest.groupBy({
        by: ['statusId'],
        where: dateFilter,
        _count: { id: true },
      }),
      // Requests by department (through requester)
      this.getRequestsByDepartment(filter),
      // Top 5 most repaired equipment
      this.prisma.$queryRaw<
        { equipment_name: string; serial_no: string; count: bigint }[]
      >`SELECT e.name AS equipment_name, e.serial_no, COUNT(re.id)::int AS count
        FROM request_equipment re
        JOIN equipment e ON e.id = re.equipment_id
        GROUP BY e.name, e.serial_no
        ORDER BY count DESC LIMIT 5`,
      // Monthly trend (last 6 months)
      this.prisma.$queryRaw<
        { month: string; count: bigint }[]
      >`SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(id)::int AS count
        FROM repair_requests
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month ASC`,
      // Total requests
      this.prisma.repairRequest.count({ where: dateFilter }),
      // Average resolution time (requests that have completedAt)
      this.prisma.$queryRaw<
        { avg_hours: number }[]
      >`SELECT COALESCE(
          ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::numeric, 1),
          0
        )::float AS avg_hours
        FROM repair_requests
        WHERE completed_at IS NOT NULL`,
    ]);

    // Map status IDs to names
    const statuses = await this.prisma.requestStatus.findMany();
    const statusMap = new Map(statuses.map((s) => [s.id, s.name]));

    return {
      totalRequests,
      avgResolutionHours: avgResolutionTime[0]?.avg_hours ?? 0,
      byStatus: byStatus.map((s) => ({
        status: statusMap.get(s.statusId) ?? `Unknown(${s.statusId})`,
        count: s._count.id,
      })),
      byDepartment: byDepartment.map((d) => ({
        department: d.dept_name,
        count: Number(d.count),
      })),
      topEquipment: topEquipment.map((e) => ({
        name: e.equipment_name,
        serialNo: e.serial_no,
        count: Number(e.count),
      })),
      monthlyTrend: monthlyTrend.map((m) => ({
        month: m.month,
        count: Number(m.count),
      })),
    };
  }

  async getDashboardTechnician(userId: number, filter: ReportFilterDto) {
    this.logger.log(`Generating technician dashboard for user ${userId}`);
    const dateFilter = this.buildDateFilter(filter);

    // Get request IDs assigned to this technician (latest assignment per request)
    const assignedRequestIds = await this.prisma.$queryRaw<
      { request_id: number }[]
    >`SELECT DISTINCT al.request_id
      FROM assignment_logs al
      WHERE al.technician_id = ${userId}
        AND al.action = 'assigned'
        AND NOT EXISTS (
          SELECT 1 FROM assignment_logs al2
          WHERE al2.request_id = al.request_id
            AND al2.technician_id = ${userId}
            AND al2.action = 'unassigned'
            AND al2.logged_at > al.logged_at
        )`;

    const ids = assignedRequestIds.map((r) => r.request_id);

    const myWhere = {
      ...dateFilter,
      id: { in: ids.length > 0 ? ids : [-1] },
    };

    const [byStatus, totalAssigned, completedThisMonth] = await Promise.all([
      this.prisma.repairRequest.groupBy({
        by: ['statusId'],
        where: myWhere,
        _count: { id: true },
      }),
      this.prisma.repairRequest.count({ where: { id: { in: ids.length > 0 ? ids : [-1] } } }),
      this.prisma.repairRequest.count({
        where: {
          id: { in: ids.length > 0 ? ids : [-1] },
          completedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const statuses = await this.prisma.requestStatus.findMany();
    const statusMap = new Map(statuses.map((s) => [s.id, s.name]));

    return {
      totalAssigned,
      completedThisMonth,
      byStatus: byStatus.map((s) => ({
        status: statusMap.get(s.statusId) ?? `Unknown(${s.statusId})`,
        count: s._count.id,
      })),
    };
  }

  async getDashboardHr(filter: ReportFilterDto) {
    this.logger.log('Generating HR dashboard');

    const [usersByDepartment, requestsByDepartment] = await Promise.all([
      this.prisma.$queryRaw<
        { dept_name: string; count: bigint }[]
      >`SELECT d.name AS dept_name, COUNT(u.id)::int AS count
        FROM users u
        JOIN departments d ON d.id = u.dept_id
        WHERE u.is_active = true
        GROUP BY d.name ORDER BY count DESC`,
      this.getRequestsByDepartment(filter),
    ]);

    return {
      usersByDepartment: usersByDepartment.map((d) => ({
        department: d.dept_name,
        count: Number(d.count),
      })),
      requestsByDepartment: requestsByDepartment.map((d) => ({
        department: d.dept_name,
        count: Number(d.count),
      })),
    };
  }

  async getDashboardUser(userId: number, filter: ReportFilterDto) {
    this.logger.log(`Generating user dashboard for user ${userId}`);
    const dateFilter = this.buildDateFilter(filter);
    const userWhere = { ...dateFilter, requesterId: userId };

    const [byStatus, totalRequests, recentRequests] = await Promise.all([
      this.prisma.repairRequest.groupBy({
        by: ['statusId'],
        where: userWhere,
        _count: { id: true },
      }),
      this.prisma.repairRequest.count({ where: userWhere }),
      this.prisma.repairRequest.findMany({
        where: { requesterId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          status: true,
          requestEquipment: { include: { equipment: true } },
        },
      }),
    ]);

    const statuses = await this.prisma.requestStatus.findMany();
    const statusMap = new Map(statuses.map((s) => [s.id, s.name]));

    return {
      totalRequests,
      byStatus: byStatus.map((s) => ({
        status: statusMap.get(s.statusId) ?? `Unknown(${s.statusId})`,
        count: s._count.id,
      })),
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        description: r.description,
        status: r.status.name,
        equipment: r.requestEquipment.map((re) => re.equipment.name),
        createdAt: r.createdAt,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  EXPORT EXCEL
  // ═══════════════════════════════════════════════════════════════════

  private styleHeader(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { horizontal: 'center' };
    sheet.columns.forEach((col) => {
      col.width = Math.max(col.width ?? 12, 15);
    });
  }

  async exportRepairRequests(filter: ReportFilterDto): Promise<ArrayBuffer> {
    this.logger.log('Exporting repair requests to Excel');
    const dateFilter = this.buildDateFilter(filter);
    const deptFilter = filter.deptId
      ? { requester: { deptId: filter.deptId } }
      : {};

    const requests = await this.prisma.repairRequest.findMany({
      where: { ...dateFilter, ...deptFilter },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { include: { department: true } },
        status: true,
        requestEquipment: { include: { equipment: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Repair Requests');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Requester', key: 'requester', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Equipment', key: 'equipment', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Parts Used', key: 'partsUsed', width: 25 },
      { header: 'Repair Summary', key: 'repairSummary', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
    ];

    for (const r of requests) {
      sheet.addRow({
        id: r.id,
        description: r.description,
        requester: r.requester.name,
        department: r.requester.department.name,
        equipment: r.requestEquipment.map((re) => re.equipment.name).join(', '),
        status: r.status.name,
        partsUsed: r.partsUsed ?? '-',
        repairSummary: r.repairSummary ?? '-',
        createdAt: r.createdAt.toISOString().split('T')[0],
        completedAt: r.completedAt?.toISOString().split('T')[0] ?? '-',
      });
    }

    this.styleHeader(sheet);
    return workbook.xlsx.writeBuffer();
  }

  async exportEquipment(filter: ReportFilterDto): Promise<ArrayBuffer> {
    this.logger.log('Exporting equipment to Excel');

    const equipment = await this.prisma.equipment.findMany({
      where: filter.deptId ? { deptId: filter.deptId } : undefined,
      orderBy: { id: 'asc' },
      include: { category: true, department: true },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Equipment');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Serial No', key: 'serialNo', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Active', key: 'isActive', width: 10 },
    ];

    for (const e of equipment) {
      sheet.addRow({
        id: e.id,
        name: e.name,
        serialNo: e.serialNo,
        category: e.category.name,
        department: e.department.name,
        isActive: e.isActive ? 'Yes' : 'No',
      });
    }

    this.styleHeader(sheet);
    return workbook.xlsx.writeBuffer();
  }

  async exportMyTasks(userId: number): Promise<ArrayBuffer> {
    this.logger.log(`Exporting tasks for technician ${userId}`);

    const assignedRequestIds = await this.prisma.$queryRaw<
      { request_id: number }[]
    >`SELECT DISTINCT al.request_id
      FROM assignment_logs al
      WHERE al.technician_id = ${userId}
        AND al.action = 'assigned'
        AND NOT EXISTS (
          SELECT 1 FROM assignment_logs al2
          WHERE al2.request_id = al.request_id
            AND al2.technician_id = ${userId}
            AND al2.action = 'unassigned'
            AND al2.logged_at > al.logged_at
        )`;

    const ids = assignedRequestIds.map((r) => r.request_id);

    const requests = await this.prisma.repairRequest.findMany({
      where: { id: { in: ids.length > 0 ? ids : [-1] } },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { include: { department: true } },
        status: true,
        requestEquipment: { include: { equipment: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('My Tasks');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Requester', key: 'requester', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Equipment', key: 'equipment', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Parts Used', key: 'partsUsed', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
    ];

    for (const r of requests) {
      sheet.addRow({
        id: r.id,
        description: r.description,
        requester: r.requester.name,
        department: r.requester.department.name,
        equipment: r.requestEquipment.map((re) => re.equipment.name).join(', '),
        status: r.status.name,
        partsUsed: r.partsUsed ?? '-',
        createdAt: r.createdAt.toISOString().split('T')[0],
        completedAt: r.completedAt?.toISOString().split('T')[0] ?? '-',
      });
    }

    this.styleHeader(sheet);
    return workbook.xlsx.writeBuffer();
  }

  async exportUsers(filter: ReportFilterDto): Promise<ArrayBuffer> {
    this.logger.log('Exporting users to Excel');

    const users = await this.prisma.user.findMany({
      where: filter.deptId ? { deptId: filter.deptId } : undefined,
      orderBy: { id: 'asc' },
      include: { role: true, department: true },
      omit: { passwordHash: true },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Active', key: 'isActive', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    for (const u of users) {
      sheet.addRow({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        department: u.department.name,
        isActive: u.isActive ? 'Yes' : 'No',
        createdAt: u.createdAt.toISOString().split('T')[0],
      });
    }

    this.styleHeader(sheet);
    return workbook.xlsx.writeBuffer();
  }

  async exportMyRequests(userId: number): Promise<ArrayBuffer> {
    this.logger.log(`Exporting requests for user ${userId}`);

    const requests = await this.prisma.repairRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        status: true,
        requestEquipment: { include: { equipment: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('My Requests');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Equipment', key: 'equipment', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Parts Used', key: 'partsUsed', width: 25 },
      { header: 'Repair Summary', key: 'repairSummary', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
    ];

    for (const r of requests) {
      sheet.addRow({
        id: r.id,
        description: r.description,
        equipment: r.requestEquipment.map((re) => re.equipment.name).join(', '),
        status: r.status.name,
        partsUsed: r.partsUsed ?? '-',
        repairSummary: r.repairSummary ?? '-',
        createdAt: r.createdAt.toISOString().split('T')[0],
        completedAt: r.completedAt?.toISOString().split('T')[0] ?? '-',
      });
    }

    this.styleHeader(sheet);
    return workbook.xlsx.writeBuffer();
  }
}
