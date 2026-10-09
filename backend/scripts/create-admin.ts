/**
 * Creates the first ADMIN user from env vars. The seed never creates users.
 *
 * Usage (from backend/):
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_NAME=...] bun run create:admin
 *
 * Remote databases require BOTH `--allow-remote` and CONFIRM_REMOTE_IMPORT=yes.
 * An existing user with the same email is left untouched.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { evaluateApplyGuard } from '../src/survey-import/safety';
import { parseInitialAdminInput } from '../src/users/initial-admin';

// Matches UsersService so the account behaves like one created from the app.
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  const parsed = parseInitialAdminInput({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_NAME: process.env.ADMIN_NAME,
  });
  if (!parsed.isValid) {
    for (const error of parsed.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const guard = evaluateApplyGuard({
    databaseUrl: process.env.DATABASE_URL,
    shouldApply: true,
    isRemoteAllowed: process.argv.includes('--allow-remote'),
    confirmRemoteEnv: process.env.CONFIRM_REMOTE_IMPORT,
  });
  console.log(`Base de datos: ${guard.host}`);
  if (!guard.isAllowed) {
    console.error(`Abortado: ${guard.reason}`);
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  try {
    const { admin } = parsed;
    const existing = await prisma.user.findUnique({
      where: { email: admin.email },
    });
    if (existing) {
      console.log(`Ya existe un usuario con ${admin.email}. Sin cambios.`);
      return;
    }

    await prisma.user.create({
      data: {
        name: admin.name,
        email: admin.email,
        password: await bcrypt.hash(admin.password, BCRYPT_ROUNDS),
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`Administrador creado: ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
