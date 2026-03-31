import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.PEPPER ?? '';
  return argon2.hash(`${pepper}:${password}`, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
}

async function main() {
  // ─── Clean slate + reset sequences ───
  await prisma.statusLog.deleteMany();
  await prisma.assignmentLog.deleteMany();
  await prisma.requestEquipment.deleteMany();
  await prisma.repairRequest.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.requestStatus.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();

  // Reset autoincrement sequences
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE roles_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE request_status_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE departments_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE equipment_categories_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE equipment_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE repair_requests_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE status_logs_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE assignment_logs_id_seq RESTART WITH 1`,
  );

  // ─── Roles (sequential เพื่อให้ id เรียงตามลำดับ) ───
  const adminRole = await prisma.role.create({ data: { name: 'admin' } });
  const hrRole = await prisma.role.create({ data: { name: 'hr' } });
  const techRole = await prisma.role.create({ data: { name: 'technician' } });
  const userRole = await prisma.role.create({ data: { name: 'user' } });

  // ─── Request Statuses (ลำดับ: open=1, in_progress=2, resolved=3, closed=4) ───
  const openStatus = await prisma.requestStatus.create({
    data: { name: 'open' },
  });
  const inProgressStatus = await prisma.requestStatus.create({
    data: { name: 'in_progress' },
  });
  const resolvedStatus = await prisma.requestStatus.create({
    data: { name: 'resolved' },
  });
  const closedStatus = await prisma.requestStatus.create({
    data: { name: 'closed' },
  });

  // ─── Departments ───
  const deptIT = await prisma.department.create({
    data: { name: 'ฝ่ายเทคโนโลยีสารสนเทศ', location: 'อาคาร A ชั้น 3' },
  });
  const deptHR = await prisma.department.create({
    data: { name: 'ฝ่ายทรัพยากรบุคคล', location: 'อาคาร A ชั้น 2' },
  });
  const deptAcc = await prisma.department.create({
    data: { name: 'ฝ่ายบัญชีและการเงิน', location: 'อาคาร B ชั้น 1' },
  });
  const deptMkt = await prisma.department.create({
    data: { name: 'ฝ่ายการตลาด', location: 'อาคาร B ชั้น 2' },
  });
  const deptOps = await prisma.department.create({
    data: { name: 'ฝ่ายปฏิบัติการ', location: 'อาคาร C ชั้น 1' },
  });

  // ─── Users ───
  const demoHash = await hashPassword('P@ssw0rd');

  const admin = await prisma.user.create({
    data: {
      name: 'สมชาย แอดมิน',
      email: 'admin@company.com',
      roleId: adminRole.id,
      deptId: deptIT.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });
  const hr = await prisma.user.create({
    data: {
      name: 'สมหญิง เอชอาร์',
      email: 'hr@company.com',
      roleId: hrRole.id,
      deptId: deptHR.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });
  const tech1 = await prisma.user.create({
    data: {
      name: 'สมศักดิ์ ช่างคอม',
      email: 'tech1@company.com',
      roleId: techRole.id,
      deptId: deptIT.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });
  const tech2 = await prisma.user.create({
    data: {
      name: 'สมปอง ช่างเน็ต',
      email: 'tech2@company.com',
      roleId: techRole.id,
      deptId: deptIT.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });
  const user1 = await prisma.user.create({
    data: {
      name: 'สมใจ พนักงาน',
      email: 'somjai@company.com',
      roleId: userRole.id,
      deptId: deptAcc.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: 'สมศรี การตลาด',
      email: 'somsri@company.com',
      roleId: userRole.id,
      deptId: deptMkt.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });
  const user3 = await prisma.user.create({
    data: {
      name: 'สมศักดิ์ ปฏิบัติการ',
      email: 'somsak@company.com',
      roleId: userRole.id,
      deptId: deptOps.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  // ─── Equipment Categories ───
  const catComputer = await prisma.equipmentCategory.create({
    data: { name: 'คอมพิวเตอร์ / โน้ตบุ๊ก' },
  });
  const catPrinter = await prisma.equipmentCategory.create({
    data: { name: 'เครื่องพิมพ์ / สแกนเนอร์' },
  });
  const catNetwork = await prisma.equipmentCategory.create({
    data: { name: 'อุปกรณ์เครือข่าย' },
  });
  const catPeripheral = await prisma.equipmentCategory.create({
    data: { name: 'อุปกรณ์ต่อพ่วง' },
  });

  // ─── Equipment ───
  const eq1 = await prisma.equipment.create({
    data: {
      name: 'Dell OptiPlex 7090',
      serialNo: 'PC-ACC-001',
      categoryId: catComputer.id,
      deptId: deptAcc.id,
    },
  });
  const eq2 = await prisma.equipment.create({
    data: {
      name: 'Lenovo ThinkPad T14',
      serialNo: 'NB-MKT-001',
      categoryId: catComputer.id,
      deptId: deptMkt.id,
    },
  });
  const eq3 = await prisma.equipment.create({
    data: {
      name: 'HP LaserJet Pro M404dn',
      serialNo: 'PRN-ACC-001',
      categoryId: catPrinter.id,
      deptId: deptAcc.id,
    },
  });
  const eq4 = await prisma.equipment.create({
    data: {
      name: 'Cisco Catalyst 2960',
      serialNo: 'SW-IT-001',
      categoryId: catNetwork.id,
      deptId: deptIT.id,
    },
  });
  const eq5 = await prisma.equipment.create({
    data: {
      name: 'Samsung 27" Monitor',
      serialNo: 'MON-OPS-001',
      categoryId: catPeripheral.id,
      deptId: deptOps.id,
    },
  });

  // ─── Repair Requests ───

  // Request 1: open — เพิ่งแจ้ง multi-equipment (user1) — seq1=eq1, seq2=eq4
  const req1 = await prisma.repairRequest.create({
    data: {
      requesterId: user1.id,
      statusId: openStatus.id,
      description: 'คอมพิวเตอร์เปิดไม่ติด และ switch พอร์ตตาย',
      requestEquipment: {
        create: [
          {
            seqNo: 1,
            equipmentId: eq1.id,
            issueDetail: 'กดปุ่ม power แล้วไม่มีไฟ ไม่มีเสียง',
          },
          {
            seqNo: 2,
            equipmentId: eq4.id,
            issueDetail: 'Port 5 ของ switch ไม่มีสัญญาณ',
          },
        ],
      },
    },
  });
  await prisma.statusLog.create({
    data: {
      requestId: req1.id,
      changedBy: user1.id,
      oldStatusId: openStatus.id,
      newStatusId: openStatus.id,
      note: 'Request created',
    },
  });

  // Request 2: in_progress — admin assign ให้ tech1 (seq1=eq2)
  const req2 = await prisma.repairRequest.create({
    data: {
      requesterId: user2.id,
      statusId: inProgressStatus.id,
      description: 'โน้ตบุ๊กจอดำ เปิดได้แต่ไม่มีภาพ',
      requestEquipment: {
        create: {
          seqNo: 1,
          equipmentId: eq2.id,
          issueDetail: 'จอดำ มีไฟ power แต่ไม่แสดงภาพ',
          statusId: inProgressStatus.id,
          technicianId: tech1.id,
        },
      },
    },
    include: { requestEquipment: true },
  });
  await prisma.assignmentLog.create({
    data: {
      requestId: req2.id,
      itemRequestId: req2.id,
      itemSeqNo: 1,
      actorId: admin.id,
      technicianId: tech1.id,
      action: 'assigned',
    },
  });
  await prisma.statusLog.create({
    data: {
      requestId: req2.id,
      changedBy: admin.id,
      oldStatusId: openStatus.id,
      newStatusId: inProgressStatus.id,
      note: 'มอบหมายให้ช่างสมศักดิ์ดูแล',
    },
  });

  // Request 3: resolved — ช่างซ่อมเสร็จแล้ว รอ user1 confirm (seq1=eq3)
  const req3 = await prisma.repairRequest.create({
    data: {
      requesterId: user1.id,
      statusId: resolvedStatus.id,
      description: 'เครื่องพิมพ์พิมพ์ไม่ออก กระดาษติด',
      completedAt: new Date('2026-03-15T10:30:00Z'),
      requestEquipment: {
        create: {
          seqNo: 1,
          equipmentId: eq3.id,
          issueDetail: 'กระดาษติดบ่อย พิมพ์แล้วเส้นเป็นทาง',
          statusId: resolvedStatus.id,
          technicianId: tech2.id,
          partsUsed: 'ลูกยางดึงกระดาษ 1 ชุด',
          repairSummary: 'เปลี่ยนลูกยางดึงกระดาษและทำความสะอาดภายใน',
          resolvedAt: new Date('2026-03-15T10:30:00Z'),
        },
      },
    },
    include: { requestEquipment: true },
  });
  await prisma.assignmentLog.create({
    data: {
      requestId: req3.id,
      itemRequestId: req3.id,
      itemSeqNo: 1,
      actorId: admin.id,
      technicianId: tech2.id,
      action: 'assigned',
    },
  });
  await prisma.statusLog.create({
    data: {
      requestId: req3.id,
      changedBy: admin.id,
      oldStatusId: openStatus.id,
      newStatusId: inProgressStatus.id,
      note: 'มอบหมายให้ช่างสมปอง',
    },
  });
  await prisma.statusLog.create({
    data: {
      requestId: req3.id,
      changedBy: tech2.id,
      oldStatusId: inProgressStatus.id,
      newStatusId: resolvedStatus.id,
      note: 'เปลี่ยนลูกยางดึงกระดาษเรียบร้อย ทดสอบพิมพ์แล้วปกติ',
    },
  });

  // Request 4: open — แจ้งซ่อมจอมอนิเตอร์ (user3) seq1=eq5
  const req4 = await prisma.repairRequest.create({
    data: {
      requesterId: user3.id,
      statusId: openStatus.id,
      description: 'จอมอนิเตอร์มีเส้นสีเขียวแนวตั้งกลางจอ',
      requestEquipment: {
        create: {
          seqNo: 1,
          equipmentId: eq5.id,
          issueDetail: 'มีเส้นสีเขียวแนวตั้ง 1 เส้นตรงกลางจอ ใช้งานไม่สะดวก',
        },
      },
    },
  });
  await prisma.statusLog.create({
    data: {
      requestId: req4.id,
      changedBy: user3.id,
      oldStatusId: openStatus.id,
      newStatusId: openStatus.id,
      note: 'Request created',
    },
  });

  console.log('Seed completed successfully!');
  console.log({
    statuses: {
      open: openStatus.id,
      in_progress: inProgressStatus.id,
      resolved: resolvedStatus.id,
      closed: closedStatus.id,
    },
    roles: {
      admin: adminRole.id,
      hr: hrRole.id,
      technician: techRole.id,
      user: userRole.id,
    },
    users: {
      admin: admin.id,
      hr: hr.id,
      tech1: tech1.id,
      tech2: tech2.id,
      user1: user1.id,
      user2: user2.id,
      user3: user3.id,
    },
    repairRequests: {
      req1: req1.id,
      req2: req2.id,
      req3: req3.id,
      req4: req4.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
