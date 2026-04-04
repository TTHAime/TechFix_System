import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Administrator';
  const pepper = process.env.PEPPER ?? '';

  if (!email || !password) {
    console.error('Error: Crendentials are required.');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: { name: 'admin' } },
  });
  if (existingAdmin) {
    console.error(`Admin already exists. Aborting.`);
    process.exit(1);
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  for (const roleName of ['hr', 'technician', 'user']) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  for (const statusName of ['open', 'in_progress', 'resolved', 'closed']) {
    await prisma.requestStatus.upsert({
      where: {
        id:
          ['open', 'in_progress', 'resolved', 'closed'].indexOf(statusName) + 1,
      },
      update: {},
      create: { name: statusName },
    });
  }

  const departments: { name: string; location: string }[] = [
    { name: 'ฝ่ายเทคโนโลยีสารสนเทศ', location: 'อาคาร A ชั้น 3' },
    { name: 'ฝ่ายทรัพยากรบุคคล', location: 'อาคาร A ชั้น 2' },
    { name: 'ฝ่ายบัญชีและการเงิน', location: 'อาคาร B ชั้น 1' },
    { name: 'ฝ่ายการตลาด', location: 'อาคาร B ชั้น 2' },
    { name: 'ฝ่ายปฏิบัติการ', location: 'อาคาร C ชั้น 1' },
  ];
  for (const deptData of departments) {
    await prisma.department.upsert({
      where: { name: deptData.name },
      update: {},
      create: deptData,
    });
  }

  for (const categoryName of [
    'คอมพิวเตอร์ / โน้ตบุ๊ก',
    'เครื่องพิมพ์ / สแกนเนอร์',
    'อุปกรณ์เครือข่าย',
    'อุปกรณ์ต่อพ่วง',
  ]) {
    await prisma.equipmentCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
  }

  const itDept = await prisma.department.findFirstOrThrow({
    where: { name: 'ฝ่ายเทคโนโลยีสารสนเทศ' },
  });

  const passwordHash = await argon2.hash(`${pepper}:${password}`, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      roleId: adminRole.id,
      deptId: itDept.id,
      provider: 'local',
      passwordHash,
    },
  });

  console.log(`Admin created successfully: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
