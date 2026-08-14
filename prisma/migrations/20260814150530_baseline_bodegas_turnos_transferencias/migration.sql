-- DropIndex
DROP INDEX "Inventario_producto_id_key";

-- AlterTable
ALTER TABLE "Inventario" ADD COLUMN     "bodega_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "bodega_id" TEXT,
ADD COLUMN     "cliente_nombre" TEXT,
ADD COLUMN     "stock_descontado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "turno_id" TEXT;

-- CreateTable
CREATE TABLE "Bodega" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'central',
    "patente" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "chofer_id" TEXT NOT NULL,
    "bodega_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "efectivo_rendido" DECIMAL(10,2),
    "notas_cierre" TEXT,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaStock" (
    "id" TEXT NOT NULL,
    "bodega_origen_id" TEXT,
    "bodega_destino_id" TEXT,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "turno_id" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferenciaStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_producto_id_bodega_id_key" ON "Inventario"("producto_id", "bodega_id");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "Turno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "Bodega"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "Chofer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaStock" ADD CONSTRAINT "TransferenciaStock_bodega_origen_id_fkey" FOREIGN KEY ("bodega_origen_id") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaStock" ADD CONSTRAINT "TransferenciaStock_bodega_destino_id_fkey" FOREIGN KEY ("bodega_destino_id") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaStock" ADD CONSTRAINT "TransferenciaStock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaStock" ADD CONSTRAINT "TransferenciaStock_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "Turno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

