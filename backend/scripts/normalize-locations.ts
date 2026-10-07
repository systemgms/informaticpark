/**
 * Renames existing Location rows to the canonical Morona Santiago names and
 * merges rows that collapse to the same canonical pair.
 *
 * Usage (from backend/):
 *   bun run scripts/normalize-locations.ts            dry run (no writes)
 *   bun run scripts/normalize-locations.ts --apply    write, local DB only
 *
 * Remote databases require BOTH `--allow-remote` and CONFIRM_REMOTE_IMPORT=yes.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  AssetTextUpdate,
  LocationNormalizationPlan,
  planAssetTextUpdates,
  planLocationNormalization,
} from '../src/locations/normalize-locations';
import { evaluateApplyGuard } from '../src/survey-import/safety';

const formatName = (name: {
  canton: string | null;
  parroquia: string | null;
}): string => `${name.canton ?? '-'} | ${name.parroquia ?? '-'}`;

function printSummary(
  total: number,
  plan: LocationNormalizationPlan,
  textUpdates: AssetTextUpdate[],
): void {
  console.log('\nResumen');
  console.log(`  Ubicaciones:                 ${total}`);
  console.log(`    sin cambios:               ${plan.unchangedCount}`);
  console.log(`    a renombrar:               ${plan.renames.length}`);
  console.log(`    duplicadas a fusionar:     ${plan.merges.length}`);
  console.log(`    desconocidas (omitidas):   ${plan.unknown.length}`);
  console.log(`  Activos con texto a corregir: ${textUpdates.length}`);

  if (plan.renames.length > 0) {
    console.log('\nRenombres');
    for (const rename of plan.renames) {
      console.log(
        `  #${rename.id}: ${formatName(rename.from)} -> ${formatName(rename.to)}`,
      );
    }
  }
  if (plan.merges.length > 0) {
    console.log('\nFusiones');
    for (const merge of plan.merges) {
      console.log(`  #${merge.duplicateId} -> #${merge.survivorId}`);
    }
  }
  if (plan.unknown.length > 0) {
    console.log('\nDesconocidas');
    for (const row of plan.unknown) {
      console.log(`  #${row.id}: ${formatName(row)}`);
    }
  }
}

async function applyPlan(
  prisma: PrismaClient,
  plan: LocationNormalizationPlan,
  textUpdates: AssetTextUpdate[],
): Promise<void> {
  const idsByText = new Map<string, number[]>();
  for (const update of textUpdates) {
    idsByText.set(update.location, [
      ...(idsByText.get(update.location) ?? []),
      update.assetId,
    ]);
  }

  await prisma.$transaction(
    async (tx) => {
      for (const [location, ids] of idsByText) {
        await tx.asset.updateMany({
          where: { id: { in: ids } },
          data: { location },
        });
      }
      for (const merge of plan.merges) {
        const { survivorId, duplicateId } = merge;
        await tx.asset.updateMany({
          where: { locationId: duplicateId },
          data: { locationId: survivorId },
        });
        await tx.custodian.updateMany({
          where: { locationId: duplicateId },
          data: { locationId: survivorId },
        });
        await tx.assetMovement.updateMany({
          where: { fromLocationId: duplicateId },
          data: { fromLocationId: survivorId },
        });
        await tx.assetMovement.updateMany({
          where: { toLocationId: duplicateId },
          data: { toLocationId: survivorId },
        });
        await tx.location.delete({ where: { id: duplicateId } });
      }
      for (const rename of plan.renames) {
        await tx.location.update({
          where: { id: rename.id },
          data: { canton: rename.to.canton, parroquia: rename.to.parroquia },
        });
      }
    },
    { timeout: 120_000, maxWait: 10_000 },
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldApply = args.includes('--apply');
  const isRemoteAllowed = args.includes('--allow-remote');

  const guard = evaluateApplyGuard({
    databaseUrl: process.env.DATABASE_URL,
    shouldApply,
    isRemoteAllowed,
    confirmRemoteEnv: process.env.CONFIRM_REMOTE_IMPORT,
  });
  console.log(`Base de datos: ${guard.host}`);
  console.log(
    shouldApply ? 'Modo: APPLY (escribe)' : 'Modo: DRY-RUN (sin escrituras)',
  );
  if (!guard.isAllowed) {
    console.error(`Abortado: ${guard.reason}`);
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const [locations, assets] = await Promise.all([
      prisma.location.findMany({
        where: { isDeleted: false },
        select: { id: true, canton: true, parroquia: true },
      }),
      prisma.asset.findMany({
        where: { locationId: { not: null }, location: { not: null } },
        select: { id: true, locationId: true, location: true },
      }),
    ]);

    const plan = planLocationNormalization(locations);
    const textUpdates = planAssetTextUpdates(locations, assets);
    printSummary(locations.length, plan, textUpdates);

    const changeCount =
      plan.renames.length + plan.merges.length + textUpdates.length;
    if (!shouldApply) {
      console.log(
        '\nDry-run: no se escribio nada. Use --apply para normalizar.',
      );
      return;
    }
    if (changeCount === 0) {
      console.log('\nSin cambios: 0 cambios aplicados.');
      return;
    }
    await applyPlan(prisma, plan, textUpdates);
    console.log('\nNormalizacion aplicada en una sola transaccion.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
