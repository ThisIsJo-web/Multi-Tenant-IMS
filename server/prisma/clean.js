import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning all records from database...');
  await prisma.enterpriseJoinRequest.deleteMany();
  await prisma.managerApplication.deleteMany();
  await prisma.enterpriseMember.deleteMany();
  await prisma.enterprise.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database is now completely clean (0 users, 0 enterprises).');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
