/*
  Warnings:

  - You are about to drop the column `horaFin` on the `Turno` table. All the data in the column will be lost.
  - Added the required column `horaSalida` to the `Turno` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Turno" DROP COLUMN "horaFin",
ADD COLUMN     "color" TEXT DEFAULT '#2563EB',
ADD COLUMN     "horaSalida" TEXT NOT NULL,
ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "seleccionAutomatica" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "toleranciaIngresoMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "toleranciaSalidaMin" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "codigo" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "Turno_activo_idx" ON "Turno"("activo");

-- CreateIndex
CREATE INDEX "Turno_orden_idx" ON "Turno"("orden");
