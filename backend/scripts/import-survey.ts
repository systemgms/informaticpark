/**
 * Imports the field-survey xlsx into Asset / Custodian / Location.
 *
 * Usage (from backend/):
 *   bun run scripts/import-survey.ts <file.xlsx>            dry run (no writes)
 *   bun run scripts/import-survey.ts <file.xlsx> --apply    write, local DB only
 *
 * Remote databases require BOTH `--allow-remote` and CONFIRM_REMOTE_IMPORT=yes.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { CellValue, Workbook } from 'exceljs';
import {
  Anomaly,
  extractDataRows,
  ImportPlan,
  parseSurvey,
  planImport,
  SurveyParseResult,
} from '../src/survey-import/parse';
import { evaluateApplyGuard } from '../src/survey-import/safety';

const LAST_COLUMN = 28;

function cellToString(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((r) => r.text).join('');
    if ('text' in value) return String(value.text);
    if ('result' in value) return String(value.result ?? '');
    return '';
  }
  return String(value);
}

async function readGrid(path: string): Promise<string[][]> {
  const workbook = new Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.worksheets[0];
  const grid: string[][] = [];
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const values: string[] = [];
    for (let col = 1; col <= LAST_COLUMN; col++) {
      values.push(cellToString(row.getCell(col).value));
    }
    grid.push(values);
  }
  return grid;
}

function printSummary(parsed: SurveyParseResult, plan: ImportPlan): void {
  console.log('\nResumen');
  console.log(`  Activos en el archivo:   ${parsed.assets.length}`);
  console.log(`    nuevos:                ${plan.newAssets.length}`);
  console.log(`    ya existentes:         ${plan.skippedAssets}`);
  console.log(`  Ubicaciones en archivo:  ${parsed.locations.length}`);
  console.log(`    nuevas:                ${plan.newLocations.length}`);
  console.log(
    `    ya existentes:         ${parsed.locations.length - plan.newLocations.length}`,
  );
  console.log(`  Custodios en archivo:    ${parsed.custodians.length}`);
  console.log(`    nuevos:                ${plan.newCustodians.length}`);
  console.log(`    ya existentes:         ${plan.existingCustodianCount}`);
}

function printAnomalies(anomalies: Anomaly[]): void {
  const byKind = new Map<string, Anomaly[]>();
  for (const anomaly of anomalies) {
    byKind.set(anomaly.kind, [...(byKind.get(anomaly.kind) ?? []), anomaly]);
  }
  console.log(`\nAnomalias: ${anomalies.length}`);
  for (const [kind, items] of byKind) {
    console.log(`  ${kind}: ${items.length}`);
    for (const item of items) {
      console.log(`    fila ${item.sheetRow}: ${item.message}`);
    }
  }
}

async function applyPlan(
  prisma: PrismaClient,
  parsed: SurveyParseResult,
  plan: ImportPlan,
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const locationIds = new Map(plan.existingLocationIds);
      for (const location of plan.newLocations) {
        const created = await tx.location.create({
          data: { canton: location.canton, parroquia: location.parroquia },
        });
        locationIds.set(location.key, created.id);
      }

      const custodianIds = new Map<string, number>();
      for (const custodian of parsed.custodians) {
        const row = await tx.custodian.upsert({
          where: { identifier: custodian.identifier },
          update: {},
          create: {
            fullName: custodian.fullName,
            identifier: custodian.identifier,
            unit: custodian.unit,
            locationId: custodian.locationKey
              ? (locationIds.get(custodian.locationKey) ?? null)
              : null,
          },
        });
        custodianIds.set(custodian.key, row.id);
      }

      await tx.asset.createMany({
        data: plan.newAssets.map((asset) => ({
          previousCode: asset.previousCode,
          assetName: asset.assetName,
          brand: asset.brand,
          model: asset.model,
          serialNumber: asset.serialNumber,
          condition: asset.condition,
          note: asset.note,
          entryDate: asset.entryDate,
          location: asset.location,
          locationId: asset.locationKey
            ? (locationIds.get(asset.locationKey) ?? null)
            : null,
          custodianId: asset.custodianKey
            ? (custodianIds.get(asset.custodianKey) ?? null)
            : null,
        })),
      });
    },
    { timeout: 120_000, maxWait: 10_000 },
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith('--'));
  const shouldApply = args.includes('--apply');
  const isRemoteAllowed = args.includes('--allow-remote');

  if (!filePath) {
    console.error(
      'Uso: bun run scripts/import-survey.ts <archivo.xlsx> [--apply]',
    );
    process.exit(1);
  }

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

  const parsed = parseSurvey(extractDataRows(await readGrid(filePath)));

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const [assets, locations, custodians] = await Promise.all([
      prisma.asset.findMany({
        where: {
          previousCode: { in: parsed.assets.map((a) => a.previousCode) },
        },
        select: { previousCode: true },
      }),
      prisma.location.findMany({
        where: { isDeleted: false },
        select: { id: true, canton: true, parroquia: true },
      }),
      prisma.custodian.findMany({
        where: {
          identifier: { in: parsed.custodians.map((c) => c.identifier) },
        },
        select: { identifier: true },
      }),
    ]);

    const plan = planImport(parsed, {
      previousCodes: new Set(
        assets
          .map((a) => a.previousCode)
          .filter((c): c is string => c !== null),
      ),
      locations,
      custodianIdentifiers: new Set(custodians.map((c) => c.identifier)),
    });

    printSummary(parsed, plan);
    printAnomalies(parsed.anomalies);

    if (!shouldApply) {
      console.log('\nDry-run: no se escribio nada. Use --apply para importar.');
      return;
    }
    await applyPlan(prisma, parsed, plan);
    console.log('\nImportacion aplicada en una sola transaccion.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
