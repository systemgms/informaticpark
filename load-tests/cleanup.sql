-- Removes exactly the rows seed.sql inserted (everything prefixed 'LT'),
-- returning the local database to its prior state (1 asset, 1 custodian,
-- 0 locations, 1 user). Assets are deleted before custodians because
-- Asset.custodianId -> Custodian is ON DELETE SET NULL, not a blocker, but
-- deleting in this order keeps the intent explicit.
--
-- Run from anywhere:
--   psql "$DATABASE_URL" -f load-tests/cleanup.sql

BEGIN;

DELETE FROM "Asset" WHERE code LIKE 'LT-%';
DELETE FROM "Custodian" WHERE identifier LIKE 'LT-%';

COMMIT;
