import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync('prisma/migrations/20260406050000_complete_audit_trail/migration.sql', 'utf8');
  await prisma.$executeRawUnsafe(sql);
  console.log('Migration successfully applied');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
