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
  // ─── Roles ───
  const roles = await Promise.all(
    ['admin', 'hr', 'technician', 'user'].map((name) =>
      prisma.role.upsert({
        where: { id: ['admin', 'hr', 'technician', 'user'].indexOf(name) + 1 },
        update: {},
        create: { name },
      }),
    ),
  );
  const [adminRole, hrRole, techRole, userRole] = roles;

  // ─── Request Statuses ───
  const statuses = await Promise.all(
    ['open', 'in_progress', 'resolved', 'closed'].map((name) =>
      prisma.requestStatus.upsert({
        where: {
          id: ['open', 'in_progress', 'resolved', 'closed'].indexOf(name) + 1,
        },
        update: {},
        create: { name },
      }),
    ),
  );
  const [openStatus, inProgressStatus, resolvedStatus] = statuses;

  // ─── Departments ───
  const deptIT = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'ฝ่ายเทคโนโลยีสารสนเทศ', location: 'อาคาร A ชั้น 3' },
  });
  const deptHR = await prisma.department.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'ฝ่ายทรัพยากรบุคคล', location: 'อาคาร A ชั้น 2' },
  });
  const deptAcc = await prisma.department.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'ฝ่ายบัญชีและการเงิน', location: 'อาคาร B ชั้น 1' },
  });
  const deptMkt = await prisma.department.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'ฝ่ายการตลาด', location: 'อาคาร B ชั้น 2' },
  });
  const deptOps = await prisma.department.upsert({
    where: { id: 5 },
    update: {},
    create: { name: 'ฝ่ายปฏิบัติการ', location: 'อาคาร C ชั้น 1' },
  });

  // ─── Users ───
  const demoHash = await hashPassword('P@ssw0rd');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { passwordHash: demoHash },
    create: {
      name: 'สมชาย แอดมิน',
      email: 'admin@company.com',
      roleId: adminRole.id,
      deptId: deptIT.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hr@company.com' },
    update: { passwordHash: demoHash },
    create: {
      name: 'สมหญิง เอชอาร์',
      email: 'hr@company.com',
      roleId: hrRole.id,
      deptId: deptHR.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: 'tech1@company.com' },
    update: { passwordHash: demoHash },
    create: {
      name: 'สมศักดิ์ ช่างคอม',
      email: 'tech1@company.com',
      roleId: techRole.id,
      deptId: deptIT.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'tech2@company.com' },
    update: { passwordHash: demoHash },
    create: {
      name: 'สมปอง ช่างเน็ต',
      email: 'tech2@company.com',
      roleId: techRole.id,
      deptId: deptIT.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'somjai@company.com' },
    update: { passwordHash: demoHash },
    create: {
      name: 'สมใจ พนักงาน',
      email: 'somjai@company.com',
      roleId: userRole.id,
      deptId: deptAcc.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'somsri@company.com' },
    update: { passwordHash: demoHash },
    create: {
      name: 'สมศรี การตลาด',
      email: 'somsri@company.com',
      roleId: userRole.id,
      deptId: deptMkt.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'somsak@company.com' },
    update: { passwordHash: demoHash },
    create: {
      name: 'สมศักดิ์ ปฏิบัติการ',
      email: 'somsak@company.com',
      roleId: userRole.id,
      deptId: deptOps.id,
      provider: 'local',
      passwordHash: demoHash,
    },
  });

  // ─── Equipment Categories ───
  const catComputer = await prisma.equipmentCategory.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'คอมพิวเตอร์ / โน้ตบุ๊ก' },
  });
  const catPrinter = await prisma.equipmentCategory.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'เครื่องพิมพ์ / สแกนเนอร์' },
  });
  const catNetwork = await prisma.equipmentCategory.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'อุปกรณ์เครือข่าย' },
  });
  const catPeripheral = await prisma.equipmentCategory.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'อุปกรณ์ต่อพ่วง' },
  });

  // ─── Equipment ───
  const eq1 = await prisma.equipment.upsert({
    where: { serialNo: 'PC-ACC-001' },
    update: {},
    create: {
      name: 'Dell OptiPlex 7090',
      serialNo: 'PC-ACC-001',
      categoryId: catComputer.id,
      deptId: deptAcc.id,
    },
  });
  const eq2 = await prisma.equipment.upsert({
    where: { serialNo: 'NB-MKT-001' },
    update: {},
    create: {
      name: 'Lenovo ThinkPad T14',
      serialNo: 'NB-MKT-001',
      categoryId: catComputer.id,
      deptId: deptMkt.id,
    },
  });
  const eq3 = await prisma.equipment.upsert({
    where: { serialNo: 'PRN-ACC-001' },
    update: {},
    create: {
      name: 'HP LaserJet Pro M404dn',
      serialNo: 'PRN-ACC-001',
      categoryId: catPrinter.id,
      deptId: deptAcc.id,
    },
  });
  const eq4 = await prisma.equipment.upsert({
    where: { serialNo: 'SW-IT-001' },
    update: {},
    create: {
      name: 'Cisco Catalyst 2960',
      serialNo: 'SW-IT-001',
      categoryId: catNetwork.id,
      deptId: deptIT.id,
    },
  });
  const eq5 = await prisma.equipment.upsert({
    where: { serialNo: 'MON-OPS-001' },
    update: {},
    create: {
      name: 'Samsung 27" Monitor',
      serialNo: 'MON-OPS-001',
      categoryId: catPeripheral.id,
      deptId: deptOps.id,
    },
  });

  // ─── Repair Requests ───

  // Request 1: open — เพิ่งแจ้ง
  const req1 = await prisma.repairRequest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      requesterId: user1.id,
      statusId: openStatus.id,
      description: 'คอมพิวเตอร์เปิดไม่ติด กดปุ่ม power แล้วไม่มีอะไรเกิดขึ้น',
    },
  });
  await prisma.requestEquipment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      requestId: req1.id,
      equipmentId: eq1.id,
      issueDetail: 'กดปุ่ม power แล้วไม่มีไฟ ไม่มีเสียง',
    },
  });

  // Request 2: in_progress — admin assign ให้ tech1
  const req2 = await prisma.repairRequest.upsert({
    where: { id: 2 },
    update: {},
    create: {
      requesterId: user2.id,
      statusId: inProgressStatus.id,
      description: 'โน้ตบุ๊กจอดำ เปิดได้แต่ไม่มีภาพ',
    },
  });
  await prisma.requestEquipment.upsert({
    where: { id: 2 },
    update: {},
    create: {
      requestId: req2.id,
      equipmentId: eq2.id,
      issueDetail: 'จอดำ มีไฟ power แต่ไม่แสดงภาพ',
    },
  });
  await prisma.assignmentLog.upsert({
    where: { id: 1 },
    update: {},
    create: {
      requestId: req2.id,
      actorId: admin.id,
      technicianId: tech1.id,
      action: 'assigned',
    },
  });
  await prisma.statusLog.upsert({
    where: { id: 1 },
    update: {},
    create: {
      requestId: req2.id,
      changedBy: admin.id,
      oldStatusId: openStatus.id,
      newStatusId: inProgressStatus.id,
      note: 'มอบหมายให้ช่างสมศักดิ์ดูแล',
    },
  });

  // Request 3: resolved — ซ่อมเสร็จแล้ว
  const req3 = await prisma.repairRequest.upsert({
    where: { id: 3 },
    update: {},
    create: {
      requesterId: user1.id,
      statusId: resolvedStatus.id,
      description: 'เครื่องพิมพ์พิมพ์ไม่ออก กระดาษติด',
      partsUsed: 'ลูกยางดึงกระดาษ 1 ชุด',
      repairSummary: 'เปลี่ยนลูกยางดึงกระดาษและทำความสะอาดภายใน',
      completedAt: new Date('2026-03-15T10:30:00Z'),
    },
  });
  await prisma.requestEquipment.upsert({
    where: { id: 3 },
    update: {},
    create: {
      requestId: req3.id,
      equipmentId: eq3.id,
      issueDetail: 'กระดาษติดบ่อย พิมพ์แล้วเส้นเป็นทาง',
    },
  });
  await prisma.assignmentLog.upsert({
    where: { id: 2 },
    update: {},
    create: {
      requestId: req3.id,
      actorId: admin.id,
      technicianId: tech2.id,
      action: 'assigned',
    },
  });
  await prisma.statusLog.upsert({
    where: { id: 2 },
    update: {},
    create: {
      requestId: req3.id,
      changedBy: admin.id,
      oldStatusId: openStatus.id,
      newStatusId: inProgressStatus.id,
      note: 'มอบหมายให้ช่างสมปอง',
    },
  });
  await prisma.statusLog.upsert({
    where: { id: 3 },
    update: {},
    create: {
      requestId: req3.id,
      changedBy: tech2.id,
      oldStatusId: inProgressStatus.id,
      newStatusId: resolvedStatus.id,
      note: 'เปลี่ยนลูกยางดึงกระดาษเรียบร้อย ทดสอบพิมพ์แล้วปกติ',
    },
  });

  // Request 4: open — แจ้งซ่อมจอมอนิเตอร์
  const req4 = await prisma.repairRequest.upsert({
    where: { id: 4 },
    update: {},
    create: {
      requesterId: user3.id,
      statusId: openStatus.id,
      description: 'จอมอนิเตอร์มีเส้นสีเขียวแนวตั้งกลางจอ',
    },
  });
  await prisma.requestEquipment.upsert({
    where: { id: 4 },
    update: {},
    create: {
      requestId: req4.id,
      equipmentId: eq5.id,
      issueDetail: 'มีเส้นสีเขียวแนวตั้ง 1 เส้นตรงกลางจอ ใช้งานไม่สะดวก',
    },
  });

  console.log('Seed completed successfully!');
  console.log({
    roles: roles.length,
    statuses: statuses.length,
    departments: 5,
    users: 7,
    categories: 4,
    equipment: 5,
    repairRequests: 4,
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
