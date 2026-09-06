import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const prisma = new PrismaClient();

try {
  process.loadEnvFile?.('.env');
} catch {
  // Ignore if .env is missing or already loaded
}

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'funsies-ims-super-secret-key-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  emailAndPassword: {
    enabled: true,
  },
});

async function main() {
  console.log('🌱 Seeding SuperAdmin account...');

  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@ims.local';
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin123!';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`Creating credentials for ${email}...`);
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });
    user = await prisma.user.findUnique({ where: { email } });
  }

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'superadmin',
        canCreateEnterprise: true,
        emailVerified: true,
      },
    });

    console.log('\n=============================================');
    console.log('✅ SuperAdmin successfully seeded:');
    console.log(`   Name:     ${user.name}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     ${user.role}`);
    console.log('=============================================\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
