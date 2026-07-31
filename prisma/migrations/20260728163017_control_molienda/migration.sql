-- CreateTable
CREATE TABLE "ControlMolienda" (
    "id" TEXT NOT NULL,
    "registroProduccionId" TEXT NOT NULL,
    "pesoRecuperable" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "pesoNoRecuperable" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "pesoBarrido" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "pesoTotal" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlMolienda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ControlMolienda_registroProduccionId_key" ON "ControlMolienda"("registroProduccionId");

-- CreateIndex
CREATE INDEX "ControlMolienda_registroProduccionId_idx" ON "ControlMolienda"("registroProduccionId");

-- AddForeignKey
ALTER TABLE "ControlMolienda" ADD CONSTRAINT "ControlMolienda_registroProduccionId_fkey" FOREIGN KEY ("registroProduccionId") REFERENCES "RegistroProduccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
