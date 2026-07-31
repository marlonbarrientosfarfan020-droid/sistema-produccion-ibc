-- CreateTable
CREATE TABLE "ConsumoMateriaPrima" (
    "id" TEXT NOT NULL,
    "registroProduccionId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidadInicial" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "cantidadConsumida" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "cantidadFinal" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "consumoEstandarEnvase" DECIMAL(12,4),
    "consumoRealEnvase" DECIMAL(12,4),
    "diferenciaConsumo" DECIMAL(12,4),
    "rendimiento" DECIMAL(7,3),
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumoMateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsumoMateriaPrima_registroProduccionId_idx" ON "ConsumoMateriaPrima"("registroProduccionId");

-- CreateIndex
CREATE INDEX "ConsumoMateriaPrima_productoId_idx" ON "ConsumoMateriaPrima"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsumoMateriaPrima_registroProduccionId_productoId_key" ON "ConsumoMateriaPrima"("registroProduccionId", "productoId");

-- AddForeignKey
ALTER TABLE "ConsumoMateriaPrima" ADD CONSTRAINT "ConsumoMateriaPrima_registroProduccionId_fkey" FOREIGN KEY ("registroProduccionId") REFERENCES "RegistroProduccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoMateriaPrima" ADD CONSTRAINT "ConsumoMateriaPrima_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
