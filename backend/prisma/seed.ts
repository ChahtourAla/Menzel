import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';

import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured.');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
  });

  const email = 'admin@test.com';
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    });
    console.log('Admin user verified and activated.');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: 'Platform Admin',
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      isActive: true,
    },
  });

  console.log('Seed admin created: admin@test.com / Password123!');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
