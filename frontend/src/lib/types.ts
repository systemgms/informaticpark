export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  custodianId?: number | null;
  createdAt: string;
  updatedAt: string;
  assetsCreated?: Asset[];
}

export interface Custodian {
  id: number;
  fullName: string;
  identifier: string;
  unit?: string | null;
  createdAt: string;
  updatedAt: string;
  assets?: Asset[];
}

export interface CustodianOption {
  id: number;
  fullName: string;
}

export interface Location {
  id: number;
  canton?: string | null;
  parroquia?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type MovementStatus = 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO';

// Mirrors the Prisma `AssetCondition` enum (documented exception: member
// names keep the database's Spanish values instead of PascalCase).
export enum AssetCondition {
  BUENO = 'BUENO',
  MALO = 'MALO',
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Prisma-mirrored enum, keeps the DB value.
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
}

export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
  [AssetCondition.BUENO]: 'Bueno',
  [AssetCondition.MALO]: 'Malo',
  [AssetCondition.EN_MANTENIMIENTO]: 'En mantenimiento',
};

export interface AssetMovement {
  id: number;
  transferDate: string;
  note?: string | null;
  actaUrl?: string | null;
  status: MovementStatus;
  confirmedAt?: string | null;
  assetId: number;
  groupId?: string | null;
  fromCustodianId?: number | null;
  fromCustodian?: Custodian | null;
  toCustodianId?: number | null;
  toCustodian?: Custodian | null;
  fromLocationId?: number | null;
  fromLocation?: Location | null;
  toLocationId?: number | null;
  toLocation?: Location | null;
  registeredByUserId?: number | null;
  registeredBy?: { id: number; name: string; email: string } | null;
  confirmedByUserId?: number | null;
  confirmedBy?: { id: number; name: string; email: string } | null;
  asset?: { id: number; assetName: string; code?: string | null };
  createdAt: string;
}

export interface Asset {
  id: number;
  code?: string | null;
  previousCode?: string | null;
  assetName: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  physicalLocation?: string | null;
  entryDate?: string | null;
  activationDate?: string | null;
  accountCode?: string | null;
  initialValue?: number | null;
  currentValue?: number | null;
  note?: string | null;
  locationId?: number | null;
  geoLocation?: Location | null;
  custodianId?: number | null;
  custodian?: Custodian | null;
  createdByUserId?: number | null;
  createdByUser?: User | null;
  condition: AssetCondition;
  createdAt: string;
  updatedAt: string;
}

export interface PublicGeoLocation {
  canton?: string | null;
  parroquia?: string | null;
}

export interface PublicAsset {
  id: number;
  code?: string | null;
  assetName: string;
  brand?: string | null;
  model?: string | null;
  location?: string | null;
  geoLocation?: PublicGeoLocation | null;
}

export interface PublicCustodian {
  id: number;
  fullName: string;
  unit?: string | null;
}

export interface AssetStats {
  total: number;
  totalValue: number;
  withoutCustodian: number;
  withoutLocation: number;
  byCondition?: Record<AssetCondition, number>;
}

export interface BrandSettings {
  id: number;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BrandSettingsUpdate = Partial<Omit<BrandSettings, 'id' | 'createdAt' | 'updatedAt'>>;
