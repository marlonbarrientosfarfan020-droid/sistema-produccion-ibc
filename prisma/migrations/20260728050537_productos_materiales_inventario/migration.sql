-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('PRODUCTO_TERMINADO', 'MATERIA_PRIMA', 'MATERIAL_EMBALAJE');

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadMedidaId" TEXT,
    "codigo" TEXT NOT NULL,
    "codigoSap" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoProducto" NOT NULL,
    "familia" TEXT,
    "marca" TEXT,
    "pesoUnitario" DECIMAL(12,3),
    "capacidad" DECIMAL(12,3),
    "unidadCapacidad" TEXT,
    "stockInicial" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "stockActual" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "controlaStock" BOOLEAN NOT NULL DEFAULT true,
    "permiteDecimal" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Producto_empresaId_idx" ON "Producto"("empresaId");

-- CreateIndex
CREATE INDEX "Producto_unidadMedidaId_idx" ON "Producto"("unidadMedidaId");

-- CreateIndex
CREATE INDEX "Producto_tipo_idx" ON "Producto"("tipo");

-- CreateIndex
CREATE INDEX "Producto_familia_idx" ON "Producto"("familia");

-- CreateIndex
CREATE INDEX "Producto_activo_idx" ON "Producto"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_codigo_key" ON "Producto"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_codigoSap_key" ON "Producto"("empresaId", "codigoSap");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_unidadMedidaId_fkey" FOREIGN KEY ("unidadMedidaId") REFERENCES "UnidadMedida"("id") ON DELETE SET NULL ON UPDATE CASCADE;
