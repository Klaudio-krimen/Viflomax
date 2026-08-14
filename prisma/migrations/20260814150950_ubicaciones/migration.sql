-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "latitud" DECIMAL(10,7) NOT NULL,
    "longitud" DECIMAL(10,7) NOT NULL,
    "precision_m" DOUBLE PRECISION,
    "origen" TEXT NOT NULL DEFAULT 'app',
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ubicacion_turno_id_registrado_en_idx" ON "Ubicacion"("turno_id", "registrado_en");

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "Turno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

