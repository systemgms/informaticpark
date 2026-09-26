-- Enforce at most one PENDIENTE movement per asset at the database level.
-- Prisma schema cannot express a partial unique index, so this migration is
-- hand-written. See MovementsService.create/createBulk for the matching
-- application-level check and the P2002 race fallback.
CREATE UNIQUE INDEX "AssetMovement_one_pending_per_asset" ON "AssetMovement" ("assetId") WHERE status = 'PENDIENTE';
