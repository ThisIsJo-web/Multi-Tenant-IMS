import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, organization } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

try {
  process.loadEnvFile?.();
} catch {
  // Ignore if .env is missing or already loaded via CLI flag
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'TRUSTED_ORIGINS',
] as const;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missingEnvVars.join(', ')}. Please check your .env file.`,
  );
}

const betterAuthSecret = process.env.BETTER_AUTH_SECRET!;
const betterAuthUrl = process.env.BETTER_AUTH_URL!;
const rawTrustedOrigins = process.env.TRUSTED_ORIGINS!;

const parsedTrustedOrigins = rawTrustedOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const prisma = new PrismaClient();

export const auth = betterAuth({
  rateLimit: {
    enabled: false,
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: betterAuthSecret,
  baseURL: betterAuthUrl,
  trustedOrigins: parsedTrustedOrigins,
  user: {
    modelName: 'user',
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        required: false,
      },
      banned: {
        type: 'boolean',
        defaultValue: false,
        required: false,
      },
      banReason: {
        type: 'string',
        required: false,
      },
      banExpires: {
        type: 'date',
        required: false,
      },
      canCreateEnterprise: {
        type: 'boolean',
        defaultValue: false,
        required: false,
      },
    },
  },
  session: {
    modelName: 'session',
    additionalFields: {
      activeEnterpriseId: {
        type: 'string',
        required: false,
      },
    },
  },
  plugins: [
    admin({
      adminRole: 'superadmin',
      defaultRole: 'user',
    }),
    organization({
      schema: {
        session: {
          fields: {
            activeOrganizationId: 'activeEnterpriseId',
          },
        },
        organization: {
          modelName: 'enterprise',
          additionalFields: {
            enterpriseKey: {
              type: 'string',
              required: true,
            },
          },
        },
        member: {
          modelName: 'enterpriseMember',
          fields: {
            organizationId: 'enterpriseId',
          },
          additionalFields: {
            permissions: {
              type: 'string[]',
              required: false,
              defaultValue: ['stock:view'],
            },
          },
        },
        invitation: {
          modelName: 'enterpriseInvitation',
          fields: {
            organizationId: 'enterpriseId',
          },
          additionalFields: {
            permissions: {
              type: 'string[]',
              required: false,
              defaultValue: ['stock:view'],
            },
          },
        },
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
});

export type Auth = typeof auth;

/**
 * Gracefully close the database connection during application shutdown.
 */
export async function closeAuthPool(): Promise<void> {
  await prisma.$disconnect();
}
