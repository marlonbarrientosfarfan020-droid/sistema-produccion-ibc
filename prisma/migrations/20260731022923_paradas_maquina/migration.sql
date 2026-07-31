-- CreateEnum
CREATE TYPE "TipoParadaMaquina" AS ENUM ('MECANICA', 'ELECTRICA', 'CALIDAD', 'FALTA_MATERIAL', 'CAMBIO_MOLDE', 'AJUSTE_PROCESO', 'OTRA');

-- CreateTable
CREATE TABLE "ParadaMaquina" (
    "id" TEXT NOT NULL,
    "registroProduccionId" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "minutos" INTEGER NOT NULL,
    "tipo" "TipoParadaMaquina" NOT NULL,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParadaMaquina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParadaMaquina_registroProduccionId_idx" ON "ParadaMaquina"("registroProduccionId");

-- CreateIndex
CREATE INDEX "ParadaMaquina_tipo_idx" ON "ParadaMaquina"("tipo");

-- CreateIndex
CREATE INDEX "ParadaMaquina_minutos_idx" ON "ParadaMaquina"("minutos");

-- AddForeignKey
ALTER TABLE "ParadaMaquina" ADD CONSTRAINT "ParadaMaquina_registroProduccionId_fkey" FOREIGN KEY ("registroProduccionId") REFERENCES "RegistroProduccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
