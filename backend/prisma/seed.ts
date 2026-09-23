import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ADMIN inicial
  const adminEmail = 'admin@example.com';
  const adminPasswordPlain = 'Admin123!';

  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPasswordPlain, 10);

    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: hashed,
        role: Role.ADMIN,
        isActive: true,
      },
    });
  }

  // Custodio de ejemplo
  const custodian = await prisma.custodian.upsert({
    where: { identifier: 'CUST-001' },
    update: {},
    create: {
      fullName: 'Custodio Principal',
      identifier: 'CUST-001',
      unit: 'Oficina Central',
    },
  });

  // Configuración de marca por defecto
  await prisma.brandSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      appName: 'Parque Informático',
      primaryColor: '#4f46e5',
      secondaryColor: '#6366f1',
      accentColor: '#e0e7ff',
    },
  });

  // Activo de ejemplo
  const adminUser = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (adminUser) {
    await prisma.asset.upsert({
      where: { code: 'ACT-0001' },
      update: {},
      create: {
        code: 'ACT-0001',
        assetName: 'Computadora portátil',
        brand: 'Dell',
        model: 'XPS 13',
        serialNumber: 'SN-123456',
        location: 'Oficina Central',
        physicalLocation: 'Piso 1',
        note: 'Activo de ejemplo creado por seed',
        custodianId: custodian.id,
        createdByUserId: adminUser.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

