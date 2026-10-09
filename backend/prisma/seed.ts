import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
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
