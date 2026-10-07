/**
 * Pure planning logic to bring existing Location rows to the canonical
 * Morona Santiago names. No I/O: backend/scripts/normalize-locations.ts reads
 * and writes the database.
 */
import { normalizeKey } from './location-text';
import { canonicalizeLocation } from './morona-santiago.catalog';

export interface LocationRow {
  id: number;
  canton: string | null;
  parroquia: string | null;
}

export interface LocationName {
  canton: string | null;
  parroquia: string | null;
}

export interface LocationRename {
  id: number;
  from: LocationName;
  to: LocationName;
}

export interface LocationMerge {
  survivorId: number;
  duplicateId: number;
}

export interface LocationNormalizationPlan {
  renames: LocationRename[];
  merges: LocationMerge[];
  unknown: LocationRow[];
  unchangedCount: number;
}

export interface AssetLocationRow {
  id: number;
  locationId: number | null;
  location: string | null;
}

export interface AssetTextUpdate {
  assetId: number;
  location: string;
}

function canonicalKey(name: LocationName): string {
  return `${normalizeKey(name.canton ?? '')}|${normalizeKey(name.parroquia ?? '')}`;
}

function isSameName(a: LocationName, b: LocationName): boolean {
  return a.canton === b.canton && a.parroquia === b.parroquia;
}

export function planLocationNormalization(
  locations: LocationRow[],
): LocationNormalizationPlan {
  const unknown: LocationRow[] = [];
  const groups = new Map<
    string,
    { row: LocationRow; canonical: LocationName }[]
  >();

  for (const row of [...locations].sort((a, b) => a.id - b.id)) {
    const { canton, parroquia, isKnown } = canonicalizeLocation(
      row.canton,
      row.parroquia,
    );
    if (!isKnown) {
      unknown.push(row);
      continue;
    }
    const canonical = { canton, parroquia };
    const key = canonicalKey(canonical);
    groups.set(key, [...(groups.get(key) ?? []), { row, canonical }]);
  }

  const renames: LocationRename[] = [];
  const merges: LocationMerge[] = [];
  let unchangedCount = 0;

  for (const [survivor, ...duplicates] of groups.values()) {
    const from = {
      canton: survivor.row.canton,
      parroquia: survivor.row.parroquia,
    };
    if (isSameName(from, survivor.canonical)) {
      unchangedCount += 1;
    } else {
      renames.push({ id: survivor.row.id, from, to: survivor.canonical });
    }
    for (const duplicate of duplicates) {
      merges.push({
        survivorId: survivor.row.id,
        duplicateId: duplicate.row.id,
      });
    }
  }

  renames.sort((a, b) => a.id - b.id);
  merges.sort((a, b) => a.duplicateId - b.duplicateId);
  return { renames, merges, unknown, unchangedCount };
}

/**
 * Asset free text is rewritten only when it equals the old parroquia of its
 * location (compared by normalized key) and is not already canonical.
 */
export function planAssetTextUpdates(
  locations: LocationRow[],
  assets: AssetLocationRow[],
): AssetTextUpdate[] {
  const locationsById = new Map(locations.map((row) => [row.id, row]));
  const updates: AssetTextUpdate[] = [];

  for (const asset of assets) {
    if (asset.locationId === null || asset.location === null) continue;
    const row = locationsById.get(asset.locationId);
    if (!row || row.parroquia === null) continue;
    const { parroquia, isKnown } = canonicalizeLocation(
      row.canton,
      row.parroquia,
    );
    if (!isKnown || parroquia === null) continue;
    if (
      normalizeKey(asset.location) === normalizeKey(row.parroquia) &&
      asset.location !== parroquia
    ) {
      updates.push({ assetId: asset.id, location: parroquia });
    }
  }
  return updates;
}
