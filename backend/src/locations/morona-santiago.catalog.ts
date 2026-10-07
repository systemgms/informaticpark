/**
 * Canonical canton -> parroquias catalog for Morona Santiago.
 *
 * Source: es.wikipedia.org canton pages, fetched 2026-10-07.
 *
 * The frontend keeps a copy of this catalog in
 * `frontend/src/app/admin/assets/asset-form.tsx` (MORONA_SANTIAGO). Both
 * copies MUST stay in sync.
 */
import { normalizeKey, titleCase } from './location-text';

export const MORONA_SANTIAGO_CATALOG: Record<string, string[]> = {
  Morona: [
    'Macas',
    'Alshi',
    'Cuchaentza',
    'General Proaño',
    'Río Blanco',
    'San Isidro',
    'Sevilla Don Bosco',
    'Sinaí',
    'Zuñac',
  ],
  Gualaquiza: [
    'Gualaquiza',
    'Mercedes Molina',
    'Amazonas',
    'Bermejos',
    'Bomboiza',
    'Chigüinda',
    'El Ideal',
    'El Rosario',
    'Nueva Tarqui',
    'San Miguel de Cuyes',
  ],
  Huamboya: ['Huamboya', 'Chiguaza'],
  'Limón Indanza': [
    'General Leonidas Plaza Gutiérrez',
    'Indanza',
    'San Antonio',
    'San Miguel de Conchay',
    'Santa Susana de Chiviaza',
    'Yunganza',
  ],
  Logroño: ['Logroño', 'Nambija', 'Shimpis'],
  'Pablo Sexto': ['Pablo Sexto'],
  Palora: ['Palora', '16 de Agosto', 'Arapicos', 'Cumandá', 'Sangay'],
  'San Juan Bosco': [
    'San Juan Bosco',
    'Pan de Azúcar',
    'San Carlos de Limón',
    'San Jacinto de Wakambeis',
    'Santiago de Pananza',
  ],
  Santiago: [
    'Méndez',
    'Copal',
    'Chupianza',
    'Patuca',
    'San Francisco de Chinimbimi',
    'San Luis del Acho',
    'Tayuza',
  ],
  Sucúa: ['Sucúa', 'Asunción', 'Huambi', 'Santa Marianita de Jesús'],
  Taisha: ['Taisha', 'Huasaga', 'Macuma', 'Pumpuentsa', 'Tuutinentza'],
  Tiwintza: ['San José de Morona', 'Santiago'],
};

/** Survey spellings (normalized) mapped to canonical canton keys. */
const CANTON_ALIASES: Record<string, string> = {
  'SANTIAGO DE MENDEZ': 'Santiago',
};

interface ParroquiaAlias {
  canton: string;
  parroquia: string;
}

/** Survey spellings (normalized) mapped to a canonical canton and parroquia. */
const PARROQUIA_ALIASES: Record<string, ParroquiaAlias> = {
  '9 DE OCTUBRE': { canton: 'Morona', parroquia: 'Alshi' },
  SUNAC: { canton: 'Morona', parroquia: 'Zuñac' },
  'EL ROSARIO AGUACATE': { canton: 'Gualaquiza', parroquia: 'El Rosario' },
  'YUNGANZA - EL ROSARIO': { canton: 'Limón Indanza', parroquia: 'Yunganza' },
  SANJUAN: { canton: 'San Juan Bosco', parroquia: 'San Juan Bosco' },
  'SANJUAN BOSCO': { canton: 'San Juan Bosco', parroquia: 'San Juan Bosco' },
  'SAN LUIS DE ACHO': { canton: 'Santiago', parroquia: 'San Luis del Acho' },
};

export interface CanonicalLocation {
  canton: string | null;
  parroquia: string | null;
  /** True when every provided part matched the catalog or an alias. */
  isKnown: boolean;
}

function findByKey(candidates: string[], key: string): string | undefined {
  return candidates.find((candidate) => normalizeKey(candidate) === key);
}

function findCanton(key: string): string | undefined {
  return (
    findByKey(Object.keys(MORONA_SANTIAGO_CATALOG), key) ?? CANTON_ALIASES[key]
  );
}

function clean(value: string | null): string | null {
  const trimmed = value?.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed : null;
}

export function canonicalizeLocation(
  canton: string | null,
  parroquia: string | null,
): CanonicalLocation {
  const rawCanton = clean(canton);
  const rawParroquia = clean(parroquia);
  let resolvedCanton = rawCanton
    ? findCanton(normalizeKey(rawCanton))
    : undefined;
  let resolvedParroquia: string | undefined;

  if (rawParroquia) {
    const key = normalizeKey(rawParroquia);
    const alias = PARROQUIA_ALIASES[key];
    if (resolvedCanton) {
      resolvedParroquia =
        findByKey(MORONA_SANTIAGO_CATALOG[resolvedCanton], key) ??
        (alias?.canton === resolvedCanton ? alias.parroquia : undefined);
    } else if (alias) {
      // The parroquia alias fixes the canton when the canton is unusable.
      resolvedCanton = alias.canton;
      resolvedParroquia = alias.parroquia;
    }
  }

  const isCantonKnown = rawCanton === null || resolvedCanton !== undefined;
  const isParroquiaKnown =
    rawParroquia === null || resolvedParroquia !== undefined;

  return {
    canton: resolvedCanton ?? (rawCanton ? titleCase(rawCanton) : null),
    parroquia:
      resolvedParroquia ?? (rawParroquia ? titleCase(rawParroquia) : null),
    isKnown:
      (rawCanton !== null || rawParroquia !== null) &&
      isCantonKnown &&
      isParroquiaKnown,
  };
}
