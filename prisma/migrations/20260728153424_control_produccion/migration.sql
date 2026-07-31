-- CreateTable
CREATE TABLE "ControlProceso" (
    "id" TEXT NOT NULL,
    "registroProduccionId" TEXT NOT NULL,
    "extrusoraAZona1" DECIMAL(8,2),
    "extrusoraAZona2" DECIMAL(8,2),
    "extrusoraAZona3" DECIMAL(8,2),
    "extrusoraAZona4" DECIMAL(8,2),
    "extrusoraAZona5" DECIMAL(8,2),
    "extrusoraBZona1" DECIMAL(8,2),
    "extrusoraBZona2" DECIMAL(8,2),
    "extrusoraBZona3" DECIMAL(8,2),
    "extrusoraBZona4" DECIMAL(8,2),
    "extrusoraBZona5" DECIMAL(8,2),
    "acumuladorZona1" DECIMAL(8,2),
    "acumuladorZona2" DECIMAL(8,2),
    "acumuladorZona3" DECIMAL(8,2),
    "acumuladorZona4" DECIMAL(8,2),
    "acumuladorZona5" DECIMAL(8,2),
    "acumuladorZona6" DECIMAL(8,2),
    "presionAirePrincipal" DECIMAL(10,3),
    "presionSoplo" DECIMAL(10,3),
    "presionPresoplo" DECIMAL(10,3),
    "temperaturaAgua" DECIMAL(8,2),
    "temperaturaChiller" DECIMAL(8,2),
    "temperaturaMolde" DECIMAL(8,2),
    "presionHidraulica" DECIMAL(10,3),
    "velocidadTornilloA" DECIMAL(10,3),
    "velocidadTornilloB" DECIMAL(10,3),
    "espesorParison" DECIMAL(10,3),
    "pesoEnvase" DECIMAL(12,3),
    "tiempoCicloSegundos" DECIMAL(10,3),
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlProceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlProduccion" (
    "id" TEXT NOT NULL,
    "registroProduccionId" TEXT NOT NULL,
    "programado" INTEGER NOT NULL DEFAULT 0,
    "producido" INTEGER NOT NULL DEFAULT 0,
    "buenos" INTEGER NOT NULL DEFAULT 0,
    "rechazados" INTEGER NOT NULL DEFAULT 0,
    "horasProduccion" DECIMAL(10,3),
    "produccionPorHora" DECIMAL(12,3),
    "eficiencia" DECIMAL(7,3),
    "porcentajeRechazo" DECIMAL(7,3),
    "cumplimientoPrograma" DECIMAL(7,3),
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlProduccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ControlProceso_registroProduccionId_key" ON "ControlProceso"("registroProduccionId");

-- CreateIndex
CREATE INDEX "ControlProceso_registroProduccionId_idx" ON "ControlProceso"("registroProduccionId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlProduccion_registroProduccionId_key" ON "ControlProduccion"("registroProduccionId");

-- CreateIndex
CREATE INDEX "ControlProduccion_registroProduccionId_idx" ON "ControlProduccion"("registroProduccionId");

-- CreateIndex
CREATE INDEX "ControlProduccion_programado_idx" ON "ControlProduccion"("programado");

-- CreateIndex
CREATE INDEX "ControlProduccion_producido_idx" ON "ControlProduccion"("producido");

-- CreateIndex
CREATE INDEX "ControlProduccion_buenos_idx" ON "ControlProduccion"("buenos");

-- AddForeignKey
ALTER TABLE "ControlProceso" ADD CONSTRAINT "ControlProceso_registroProduccionId_fkey" FOREIGN KEY ("registroProduccionId") REFERENCES "RegistroProduccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlProduccion" ADD CONSTRAINT "ControlProduccion_registroProduccionId_fkey" FOREIGN KEY ("registroProduccionId") REFERENCES "RegistroProduccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
