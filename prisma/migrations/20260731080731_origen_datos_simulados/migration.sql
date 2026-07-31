-- AlterTable
ALTER TABLE "RegistroProduccion" ADD COLUMN     "archivoImportado" TEXT,
ADD COLUMN     "esSimulacion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "importadoEn" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RegistroProduccion_esSimulacion_idx" ON "RegistroProduccion"("esSimulacion");
