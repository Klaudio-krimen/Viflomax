-- Fase 2: enforce bodega_id NOT NULL + unique compuesto (producto_id, bodega_id)
ALTER TABLE "Inventario" ALTER COLUMN "bodega_id" SET NOT NULL;
DROP INDEX IF EXISTS "Inventario_producto_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Inventario_producto_id_bodega_id_key"
  ON "Inventario" ("producto_id", "bodega_id");
