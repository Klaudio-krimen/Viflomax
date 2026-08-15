-- DropIndex
DROP INDEX "PrecioDetalle_producto_id_sector_cantidad_minima_key";

-- AlterTable
ALTER TABLE "PrecioDetalle" ADD COLUMN     "cliente_id" TEXT;

-- CreateIndex
CREATE INDEX "PrecioDetalle_cliente_id_idx" ON "PrecioDetalle"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "PrecioDetalle_producto_id_sector_cliente_id_cantidad_minima_key" ON "PrecioDetalle"("producto_id", "sector", "cliente_id", "cantidad_minima");

-- AddForeignKey
ALTER TABLE "PrecioDetalle" ADD CONSTRAINT "PrecioDetalle_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

