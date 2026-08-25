export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
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

export interface Location {
  id: number;
  canton?: string | null;
  parroquia?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type MovementStatus = "PENDIENTE" | "COMPLETADO" | "RECHAZADO";

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
  createdAt: string;
  updatedAt: string;
}
