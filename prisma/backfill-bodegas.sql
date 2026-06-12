-- Backfill de bodegas — migración a inventario multi-bodega
-- Idempotente: se puede correr varias veces sin duplicar.

-- 1) Crear Bodega Central si no existe
INSERT INTO "Bodega" (id, nombre, tipo, activo, created_at)
SELECT gen_random_uuid(), 'Bodega Central', 'central', true, now()
WHERE NOT EXISTS (SELECT 1 FROM "Bodega" WHERE tipo = 'central');

-- 2) Asignar todo el inventario existente a la Bodega Central
UPDATE "Inventario"
SET bodega_id = (SELECT id FROM "Bodega" WHERE tipo = 'central' ORDER BY created_at LIMIT 1)
WHERE bodega_id IS NULL;

-- 3) Crear 3 camionetas (bodegas móviles) si aún no hay ninguna móvil
INSERT INTO "Bodega" (id, nombre, tipo, activo, created_at)
SELECT gen_random_uuid(), 'Camioneta 1', 'movil', true, now()
WHERE NOT EXISTS (SELECT 1 FROM "Bodega" WHERE tipo = 'movil');

INSERT INTO "Bodega" (id, nombre, tipo, activo, created_at)
SELECT gen_random_uuid(), 'Camioneta 2', 'movil', true, now()
WHERE (SELECT count(*) FROM "Bodega" WHERE tipo = 'movil') < 2;

INSERT INTO "Bodega" (id, nombre, tipo, activo, created_at)
SELECT gen_random_uuid(), 'Camioneta 3', 'movil', true, now()
WHERE (SELECT count(*) FROM "Bodega" WHERE tipo = 'movil') < 3;
