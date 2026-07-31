-- CreateEnum
CREATE TYPE "TipoMateriaPrima" AS ENUM ('VIRGEN', 'MOLIDO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoRegistroProduccion" AS ENUM ('BORRADOR', 'FINALIZADO', 'ANULADO');

-- AlterEnum
ALTER TYPE "TipoProducto" ADD VALUE 'PRODUCTO_PROCESO';

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "tipoMateriaPrima" "TipoMateriaPrima";

-- CreateTable
CREATE TABLE "Operador" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorProduccion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoHex" TEXT,
    "permiteOtro" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorProduccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroProduccion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "turnoId" TEXT NOT NULL,
    "lineaProduccionId" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "productoProcesoId" TEXT NOT NULL,
    "productoTerminadoId" TEXT NOT NULL,
    "materialVirgenId" TEXT,
    "materialMolidoId" TEXT,
    "colorProduccionId" TEXT,
    "fechaProduccion" DATE NOT NULL,
    "semana" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "lote" TEXT NOT NULL,
    "ordenProduccion" TEXT NOT NULL,
    "colorOtro" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoRegistroProduccion" NOT NULL DEFAULT 'BORRADOR',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroProduccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Operador_empresaId_idx" ON "Operador"("empresaId");

-- CreateIndex
CREATE INDEX "Operador_activo_idx" ON "Operador"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_empresaId_codigo_key" ON "Operador"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_empresaId_nombre_key" ON "Operador"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "ColorProduccion_empresaId_idx" ON "ColorProduccion"("empresaId");

-- CreateIndex
CREATE INDEX "ColorProduccion_activo_idx" ON "ColorProduccion"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "ColorProduccion_empresaId_codigo_key" ON "ColorProduccion"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ColorProduccion_empresaId_nombre_key" ON "ColorProduccion"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "RegistroProduccion_empresaId_idx" ON "RegistroProduccion"("empresaId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_plantaId_idx" ON "RegistroProduccion"("plantaId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_turnoId_idx" ON "RegistroProduccion"("turnoId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_lineaProduccionId_idx" ON "RegistroProduccion"("lineaProduccionId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_maquinaId_idx" ON "RegistroProduccion"("maquinaId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_operadorId_idx" ON "RegistroProduccion"("operadorId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_productoProcesoId_idx" ON "RegistroProduccion"("productoProcesoId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_productoTerminadoId_idx" ON "RegistroProduccion"("productoTerminadoId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_materialVirgenId_idx" ON "RegistroProduccion"("materialVirgenId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_materialMolidoId_idx" ON "RegistroProduccion"("materialMolidoId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_colorProduccionId_idx" ON "RegistroProduccion"("colorProduccionId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_fechaProduccion_idx" ON "RegistroProduccion"("fechaProduccion");

-- CreateIndex
CREATE INDEX "RegistroProduccion_semana_idx" ON "RegistroProduccion"("semana");

-- CreateIndex
CREATE INDEX "RegistroProduccion_mes_idx" ON "RegistroProduccion"("mes");

-- CreateIndex
CREATE INDEX "RegistroProduccion_anio_idx" ON "RegistroProduccion"("anio");

-- CreateIndex
CREATE INDEX "RegistroProduccion_lote_idx" ON "RegistroProduccion"("lote");

-- CreateIndex
CREATE INDEX "RegistroProduccion_ordenProduccion_idx" ON "RegistroProduccion"("ordenProduccion");

-- CreateIndex
CREATE INDEX "RegistroProduccion_estado_idx" ON "RegistroProduccion"("estado");

-- CreateIndex
CREATE INDEX "Empresa_activo_idx" ON "Empresa"("activo");

-- CreateIndex
CREATE INDEX "LineaProduccion_activo_idx" ON "LineaProduccion"("activo");

-- CreateIndex
CREATE INDEX "Maquina_activo_idx" ON "Maquina"("activo");

-- CreateIndex
CREATE INDEX "Planta_activo_idx" ON "Planta"("activo");

-- CreateIndex
CREATE INDEX "Producto_tipoMateriaPrima_idx" ON "Producto"("tipoMateriaPrima");

-- CreateIndex
CREATE INDEX "UnidadMedida_activo_idx" ON "UnidadMedida"("activo");

-- AddForeignKey
ALTER TABLE "Operador" ADD CONSTRAINT "Operador_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorProduccion" ADD CONSTRAINT "ColorProduccion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_lineaProduccionId_fkey" FOREIGN KEY ("lineaProduccionId") REFERENCES "LineaProduccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Operador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_productoProcesoId_fkey" FOREIGN KEY ("productoProcesoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_materialVirgenId_fkey" FOREIGN KEY ("materialVirgenId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_materialMolidoId_fkey" FOREIGN KEY ("materialMolidoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_colorProduccionId_fkey" FOREIGN KEY ("colorProduccionId") REFERENCES "ColorProduccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
