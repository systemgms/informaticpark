-- Seeds ~152 assets across 14 custodians for the OE3 load tests, matching
-- the thesis figures (mm1 §3.14: 152 equipos, 14 tenencias). Everything is
-- prefixed 'LT' (identifier/code) so cleanup.sql can remove exactly these
-- rows and nothing else. Idempotent: safe to re-run (ON CONFLICT DO NOTHING
-- on the unique identifier/code columns).
--
-- Run from load-tests/ so the generated seed-data.json lands next to the k6
-- scripts that read it:
--   cd load-tests && psql "$DATABASE_URL" -f seed.sql
--
-- IMPORTANT: point DATABASE_URL at the LOCAL database (see README
-- "Prerrequisitos"), never at a shared/remote one.

BEGIN;

-- 14 "tenencias" (custodians), one per office, with plausible Spanish names.
INSERT INTO "Custodian" ("fullName", "identifier", "unit", "isDeleted", "createdAt", "updatedAt")
SELECT * FROM (VALUES
  ('LT María Fernanda Chávez',    'LT-CUST-001', 'Dirección Financiera',   false, now(), now()),
  ('LT Carlos Andrés Pilco',      'LT-CUST-002', 'Talento Humano',         false, now(), now()),
  ('LT Verónica Elizabeth Guamán','LT-CUST-003', 'Secretaría General',     false, now(), now()),
  ('LT Jorge Luis Tenelema',      'LT-CUST-004', 'Obras Públicas',         false, now(), now()),
  ('LT Diana Carolina Yupangui',  'LT-CUST-005', 'Planificación',          false, now(), now()),
  ('LT Luis Alberto Guaraca',     'LT-CUST-006', 'Sistemas',               false, now(), now()),
  ('LT Paola Alexandra Cepeda',   'LT-CUST-007', 'Comunicación Social',    false, now(), now()),
  ('LT Edwin Patricio Lema',      'LT-CUST-008', 'Compras Públicas',       false, now(), now()),
  ('LT Silvana Beatriz Toapanta', 'LT-CUST-009', 'Contabilidad',           false, now(), now()),
  ('LT Marco Vinicio Chimbo',     'LT-CUST-010', 'Bodega General',         false, now(), now()),
  ('LT Gabriela Estefanía Naranjo','LT-CUST-011','Atención Ciudadana',     false, now(), now()),
  ('LT Fabián Rodrigo Illicachi', 'LT-CUST-012', 'Avalúos y Catastros',    false, now(), now()),
  ('LT Katherine Nicole Sisa',    'LT-CUST-013', 'Turismo',                false, now(), now()),
  ('LT Iván Patricio Cando',      'LT-CUST-014', 'Alcaldía',               false, now(), now())
) AS v("fullName", "identifier", "unit", "isDeleted", "createdAt", "updatedAt")
ON CONFLICT ("identifier") DO NOTHING;

-- 152 assets (~11 per custodian), cycling through plausible equipment types,
-- brands and conditions so stats/list/search/detail all see realistic data.
INSERT INTO "Asset" (
  "code", "assetName", "brand", "model", "serialNumber",
  "location", "physicalLocation", "condition", "custodianId",
  "isDeleted", "createdAt", "updatedAt"
)
SELECT
  'LT-' || lpad(gs::text, 4, '0'),
  (ARRAY['Computadora de escritorio','Laptop','Monitor','Impresora','Escáner',
         'Proyector','UPS','Switch de red','Teléfono IP','Tablet'])[1 + (gs % 10)],
  (ARRAY['Dell','HP','Lenovo','Epson','Canon','Samsung','LG','TP-Link','Cisco'])[1 + (gs % 9)],
  'MOD-' || (1000 + gs),
  'SN-LT-' || lpad(gs::text, 6, '0'),
  'Riobamba',
  (ARRAY['Piso 1','Piso 2','Piso 3','Bodega','Oficina principal'])[1 + (gs % 5)],
  (ARRAY['BUENO','BUENO','BUENO','MALO','EN_MANTENIMIENTO']::"AssetCondition"[])[1 + (gs % 5)],
  (SELECT id FROM "Custodian" WHERE identifier = 'LT-CUST-' || lpad((1 + (gs % 14))::text, 3, '0')),
  false,
  now(),
  now()
FROM generate_series(1, 152) AS gs
ON CONFLICT ("code") DO NOTHING;

COMMIT;

-- Emit the seeded ids as JSON for the k6 scripts (load-tests/journey.js
-- reads load-tests/seed-data.json via open()).
\t
\a
\o seed-data.json
SELECT json_build_object(
  'assetIds', (SELECT COALESCE(json_agg(id ORDER BY id), '[]') FROM "Asset" WHERE code LIKE 'LT-%'),
  'custodianIds', (SELECT COALESCE(json_agg(id ORDER BY id), '[]') FROM "Custodian" WHERE identifier LIKE 'LT-%')
);
\o
\a
\t
