/**
 * Pure parsing and planning logic for the field-survey xlsx import.
 * No I/O and no Prisma here: the CLI (backend/scripts/import-survey.ts)
 * reads the file and talks to the database.
 */

export type SurveyCondition = 'BUENO' | 'REGULAR' | 'MALO';

export type AnomalyKind =
  | 'unknown-type'
  | 'missing-name'
  | 'missing-condition'
  | 'unknown-condition'
  | 'missing-serial'
  | 'placeholder-serial'
  | 'dirty-serial'
  | 'weird-serial'
  | 'invalid-date'
  | 'missing-custodian'
  | 'missing-location';

export interface Anomaly {
  kind: AnomalyKind;
  sheetRow: number;
  message: string;
}

/** One data row: `values[0]` is column A. `sheetRow` is 1-based as in Excel. */
export interface RawRow {
  sheetRow: number;
  values: string[];
}

export interface ParsedAsset {
  previousCode: string;
  sheetRow: number;
  assetName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  condition: SurveyCondition;
  note: string | null;
  entryDate: Date | null;
  location: string | null;
  locationKey: string | null;
  custodianKey: string | null;
}

export interface ParsedLocation {
  key: string;
  canton: string | null;
  parroquia: string | null;
}

export interface ParsedCustodian {
  key: string;
  identifier: string;
  fullName: string;
  unit: string | null;
  locationKey: string | null;
}

export interface SurveyParseResult {
  assets: ParsedAsset[];
  locations: ParsedLocation[];
  custodians: ParsedCustodian[];
  anomalies: Anomaly[];
}

export interface ExistingState {
  previousCodes: Set<string>;
  locations: { id: number; canton: string | null; parroquia: string | null }[];
  custodianIdentifiers: Set<string>;
}

export interface ImportPlan {
  newAssets: ParsedAsset[];
  skippedAssets: number;
  newLocations: ParsedLocation[];
  existingLocationIds: Map<string, number>;
  newCustodians: ParsedCustodian[];
  existingCustodianCount: number;
}

const HEADER_ROW_COUNT = 2;
const GUAYAQUIL_UTC_OFFSET_HOURS = 5;
const IDENTIFIER_PREFIX = 'SIN-CEDULA-';
const DEFAULT_OTHER_NAME = 'Otro equipo';
const WEIRD_SERIAL_MAX_LENGTH = 40;

/** Column indexes (0-based, A = 0). */
const COL = {
  submissionId: 0,
  createdAt: 1,
  canton: 3,
  parroquia: 4,
  type: 5,
  custodianName: 26,
  custodianCargo: 27,
} as const;

interface TypeColumns {
  name: string | null;
  nameColumn?: number;
  condition: number;
  serial: number;
  partsPresent?: number;
  partsMissing?: number;
  observation: number;
}

const TYPE_COLUMNS: Record<string, TypeColumns> = {
  COMPUTADOR: {
    name: 'Computador',
    condition: 6,
    serial: 7,
    partsPresent: 8,
    partsMissing: 9,
    observation: 10,
  },
  LAPTOP: {
    name: 'Laptop',
    condition: 11,
    serial: 12,
    partsPresent: 13,
    partsMissing: 14,
    observation: 15,
  },
  IMPRESORA: {
    name: 'Impresora',
    condition: 16,
    serial: 17,
    partsPresent: 18,
    partsMissing: 19,
    observation: 20,
  },
  OTROS: {
    name: null,
    nameColumn: 21,
    condition: 23,
    serial: 22,
    observation: 24,
  },
};

const CONDITIONS: readonly SurveyCondition[] = ['BUENO', 'REGULAR', 'MALO'];

const LOWERCASE_PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

/** Uppercase, strip accents, collapse whitespace. Used for dedupe keys. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleCase(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) =>
      index > 0 && LOWERCASE_PARTICLES.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

export function slugify(value: string): string {
  return normalizeKey(value)
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function locationKey(
  canton: string | null,
  parroquia: string | null,
): string {
  return `${normalizeKey(canton ?? '')}|${normalizeKey(parroquia ?? '')}`;
}

/** Drops the two header rows and fully empty rows. `grid[0]` is sheet row 1. */
export function extractDataRows(grid: string[][]): RawRow[] {
  const rows: RawRow[] = [];
  grid.forEach((values, index) => {
    if (index < HEADER_ROW_COUNT) return;
    if (values.every((cell) => cell.trim() === '')) return;
    rows.push({ sheetRow: index + 1, values });
  });
  return rows;
}

/** Parses `DD-MM-YYYY hh:mm AM|PM` as America/Guayaquil (UTC-5, no DST). */
export function parseCreatedAt(value: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
    value.trim(),
  );
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour12 = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour12 < 1 || hour12 > 12 || minute > 59) return null;
  const isPm = match[6].toUpperCase() === 'PM';
  const hour24 = (hour12 % 12) + (isPm ? 12 : 0);
  return new Date(
    Date.UTC(year, month - 1, day, hour24 + GUAYAQUIL_UTC_OFFSET_HOURS, minute),
  );
}

export function mapCondition(raw: string): {
  condition: SurveyCondition;
  anomaly: 'missing-condition' | 'unknown-condition' | null;
} {
  const cleaned = normalizeKey(raw);
  if (cleaned === '') {
    return { condition: 'BUENO', anomaly: 'missing-condition' };
  }
  const match = CONDITIONS.find((condition) => condition === cleaned);
  if (match) return { condition: match, anomaly: null };
  return { condition: 'BUENO', anomaly: 'unknown-condition' };
}

export interface ParsedSerial {
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  anomaly:
    | 'missing-serial'
    | 'placeholder-serial'
    | 'dirty-serial'
    | 'weird-serial'
    | null;
  /** Raw text worth preserving in the note when it was not stored as-is. */
  original: string | null;
}

const TRIVIAL_PLACEHOLDER = /^(S\/?N|0+)$/i;
const PLACEHOLDER =
  /^(S\/?N|0+|SIN SERIE|NO DISPONEMOS|NO TIENE|N\/A|NA)$|ROBAD/i;

export function parseSerial(raw: string): ParsedSerial {
  const cleaned = raw.replace(/\s+/g, ' ').replace(/^\|+/, '').trim();
  const empty = {
    serialNumber: null,
    brand: null,
    model: null,
    original: null,
  };

  if (cleaned === '') {
    return { ...empty, anomaly: 'missing-serial' };
  }

  const brandMatch = /MARCA\s*:\s*(.*?)(?=\s*MODELO\s*:|$)/i.exec(cleaned);
  const modelMatch = /MODELO\s*:\s*(.*?)(?=\s*MARCA\s*:|$)/i.exec(cleaned);
  if (brandMatch || modelMatch) {
    return {
      serialNumber: null,
      brand: brandMatch?.[1].trim() || null,
      model: modelMatch?.[1].trim() || null,
      anomaly: 'dirty-serial',
      original: cleaned,
    };
  }

  if (PLACEHOLDER.test(cleaned)) {
    return {
      ...empty,
      anomaly: 'placeholder-serial',
      original: TRIVIAL_PLACEHOLDER.test(cleaned) ? null : cleaned,
    };
  }

  if (/\s/.test(cleaned) || cleaned.length > WEIRD_SERIAL_MAX_LENGTH) {
    return { ...empty, serialNumber: cleaned, anomaly: 'weird-serial' };
  }

  return { ...empty, serialNumber: cleaned, anomaly: null };
}

function cell(row: RawRow, index: number): string {
  return (row.values[index] ?? '').trim();
}

function composeNote(parts: {
  observation: string;
  present: string;
  missing: string;
  originalSerial: string | null;
}): string | null {
  const lines: string[] = [];
  if (parts.observation) lines.push(parts.observation);
  if (parts.present) lines.push(`Partes: ${parts.present}`);
  if (parts.missing) lines.push(`Faltantes: ${parts.missing}`);
  if (parts.originalSerial) {
    lines.push(`Serie original: ${parts.originalSerial}`);
  }
  return lines.length > 0 ? lines.join('\n') : null;
}

const SERIAL_ANOMALY_MESSAGES: Record<
  NonNullable<ParsedSerial['anomaly']>,
  string
> = {
  'missing-serial': 'Serie vacia',
  'placeholder-serial': 'Serie sin valor real (marcador)',
  'dirty-serial': 'Serie con texto libre, convertido a marca/modelo',
  'weird-serial': 'Serie con formato inusual',
};

export function parseSurvey(rows: RawRow[]): SurveyParseResult {
  const assets: ParsedAsset[] = [];
  const anomalies: Anomaly[] = [];
  const locations = new Map<string, ParsedLocation>();
  const custodians = new Map<string, ParsedCustodian>();

  for (const row of rows) {
    const flag = (kind: AnomalyKind, message: string) =>
      anomalies.push({ kind, sheetRow: row.sheetRow, message });

    const typeKey = normalizeKey(cell(row, COL.type));
    const columns = TYPE_COLUMNS[typeKey];
    if (!columns) {
      flag(
        'unknown-type',
        `Tipo de equipo desconocido: "${cell(row, COL.type)}"`,
      );
      continue;
    }

    let assetName = columns.name ?? '';
    if (columns.nameColumn !== undefined) {
      assetName = cell(row, columns.nameColumn).replace(/\s+/g, ' ');
      if (assetName === '') {
        assetName = DEFAULT_OTHER_NAME;
        flag('missing-name', 'Equipo "OTROS" sin nombre');
      }
    }

    const condition = mapCondition(cell(row, columns.condition));
    if (condition.anomaly) {
      flag(
        condition.anomaly,
        condition.anomaly === 'missing-condition'
          ? 'Condicion vacia, se asigno BUENO'
          : `Condicion desconocida "${cell(row, columns.condition)}", se asigno BUENO`,
      );
    }

    const serial = parseSerial(cell(row, columns.serial));
    if (serial.anomaly) {
      flag(
        serial.anomaly,
        `${SERIAL_ANOMALY_MESSAGES[serial.anomaly]}: "${cell(row, columns.serial)}"`,
      );
    }

    const entryDate = parseCreatedAt(cell(row, COL.createdAt));
    if (!entryDate) {
      flag('invalid-date', `Fecha invalida: "${cell(row, COL.createdAt)}"`);
    }

    const canton = cell(row, COL.canton).replace(/\s+/g, ' ') || null;
    const parroquia = cell(row, COL.parroquia).replace(/\s+/g, ' ') || null;
    let resolvedLocationKey: string | null = null;
    let locationText: string | null = null;
    if (canton === null && parroquia === null) {
      flag('missing-location', 'Fila sin canton ni parroquia');
    } else {
      resolvedLocationKey = locationKey(canton, parroquia);
      if (!locations.has(resolvedLocationKey)) {
        locations.set(resolvedLocationKey, {
          key: resolvedLocationKey,
          canton,
          parroquia,
        });
      }
      locationText = locations.get(resolvedLocationKey)!.parroquia;
    }

    const custodianName = cell(row, COL.custodianName);
    let custodianKey: string | null = null;
    if (custodianName === '') {
      flag('missing-custodian', 'Fila sin custodio');
    } else {
      custodianKey = normalizeKey(custodianName);
      const existing = custodians.get(custodianKey);
      if (!existing) {
        custodians.set(custodianKey, {
          key: custodianKey,
          identifier: IDENTIFIER_PREFIX + slugify(custodianName),
          fullName: titleCase(custodianName),
          unit: cell(row, COL.custodianCargo).replace(/\s+/g, ' ') || null,
          locationKey: resolvedLocationKey,
        });
      } else if (existing.locationKey === null && resolvedLocationKey) {
        existing.locationKey = resolvedLocationKey;
      }
    }

    assets.push({
      previousCode: `${cell(row, COL.submissionId)}#${row.sheetRow}`,
      sheetRow: row.sheetRow,
      assetName,
      brand: serial.brand,
      model: serial.model,
      serialNumber: serial.serialNumber,
      condition: condition.condition,
      note: composeNote({
        observation: cell(row, columns.observation),
        present:
          columns.partsPresent !== undefined
            ? cell(row, columns.partsPresent)
            : '',
        missing:
          columns.partsMissing !== undefined
            ? cell(row, columns.partsMissing)
            : '',
        originalSerial: serial.original,
      }),
      entryDate,
      location: locationText,
      locationKey: resolvedLocationKey,
      custodianKey,
    });
  }

  return {
    assets,
    locations: [...locations.values()],
    custodians: [...custodians.values()],
    anomalies,
  };
}

/** Compares parsed data with what already exists so re-runs create nothing new. */
export function planImport(
  parsed: SurveyParseResult,
  existing: ExistingState,
): ImportPlan {
  const existingLocationIds = new Map<string, number>();
  for (const location of existing.locations) {
    const key = locationKey(location.canton, location.parroquia);
    if (!existingLocationIds.has(key))
      existingLocationIds.set(key, location.id);
  }

  const newAssets = parsed.assets.filter(
    (asset) => !existing.previousCodes.has(asset.previousCode),
  );
  const newLocations = parsed.locations.filter(
    (location) => !existingLocationIds.has(location.key),
  );
  const newCustodians = parsed.custodians.filter(
    (custodian) => !existing.custodianIdentifiers.has(custodian.identifier),
  );

  return {
    newAssets,
    skippedAssets: parsed.assets.length - newAssets.length,
    newLocations,
    existingLocationIds: new Map(
      [...existingLocationIds].filter(([key]) =>
        parsed.locations.some((location) => location.key === key),
      ),
    ),
    newCustodians,
    existingCustodianCount: parsed.custodians.length - newCustodians.length,
  };
}
