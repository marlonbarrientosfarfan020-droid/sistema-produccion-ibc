-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'ADMINISTRADOR', 'JEFE_PLANTA', 'SUPERVISOR', 'OPERADOR', 'ALMACEN', 'CALIDAD', 'MANTENIMIENTO', 'CONSULTA');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "EstadoMaquina" AS ENUM ('OPERATIVA', 'DETENIDA', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "TipoLinea" AS ENUM ('SOPLADO', 'INYECCION', 'ENSAMBLAJE', 'MOLIENDA', 'OTRO');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "ruc" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "logoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "plantaId" TEXT,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "numeroDocumento" TEXT,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'OPERADOR',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "ultimoAccesoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "cruzaMedianoche" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaProduccion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoLinea" NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineaProduccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maquina" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "lineaProduccionId" TEXT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "anioFabricacion" INTEGER,
    "capacidadNominal" DECIMAL(12,3),
    "unidadCapacidad" TEXT,
    "estado" "EstadoMaquina" NOT NULL DEFAULT 'OPERATIVA',
    "fechaInstalacion" TIMESTAMP(3),
    "ultimaRevisionEn" TIMESTAMP(3),
    "proximaRevisionEn" TIMESTAMP(3),
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maquina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "permiteDecimal" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_ruc_key" ON "Empresa"("ruc");

-- CreateIndex
CREATE INDEX "Empresa_nombreComercial_idx" ON "Empresa"("nombreComercial");

-- CreateIndex
CREATE INDEX "Planta_empresaId_idx" ON "Planta"("empresaId");

-- CreateIndex
CREATE INDEX "Planta_nombre_idx" ON "Planta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Planta_empresaId_codigo_key" ON "Planta"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");

-- CreateIndex
CREATE INDEX "Usuario_plantaId_idx" ON "Usuario"("plantaId");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE INDEX "Usuario_estado_idx" ON "Usuario"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_empresaId_correo_key" ON "Usuario"("empresaId", "correo");

-- CreateIndex
CREATE INDEX "Turno_empresaId_idx" ON "Turno"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Turno_empresaId_codigo_key" ON "Turno"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Turno_empresaId_nombre_key" ON "Turno"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "LineaProduccion_empresaId_idx" ON "LineaProduccion"("empresaId");

-- CreateIndex
CREATE INDEX "LineaProduccion_plantaId_idx" ON "LineaProduccion"("plantaId");

-- CreateIndex
CREATE INDEX "LineaProduccion_tipo_idx" ON "LineaProduccion"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "LineaProduccion_empresaId_codigo_key" ON "LineaProduccion"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "Maquina_empresaId_idx" ON "Maquina"("empresaId");

-- CreateIndex
CREATE INDEX "Maquina_plantaId_idx" ON "Maquina"("plantaId");

-- CreateIndex
CREATE INDEX "Maquina_lineaProduccionId_idx" ON "Maquina"("lineaProduccionId");

-- CreateIndex
CREATE INDEX "Maquina_estado_idx" ON "Maquina"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Maquina_empresaId_codigo_key" ON "Maquina"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Maquina_empresaId_numeroSerie_key" ON "Maquina"("empresaId", "numeroSerie");

-- CreateIndex
CREATE INDEX "UnidadMedida_empresaId_idx" ON "UnidadMedida"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_empresaId_codigo_key" ON "UnidadMedida"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_empresaId_nombre_key" ON "UnidadMedida"("empresaId", "nombre");

-- AddForeignKey
ALTER TABLE "Planta" ADD CONSTRAINT "Planta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaProduccion" ADD CONSTRAINT "LineaProduccion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaProduccion" ADD CONSTRAINT "LineaProduccion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maquina" ADD CONSTRAINT "Maquina_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maquina" ADD CONSTRAINT "Maquina_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maquina" ADD CONSTRAINT "Maquina_lineaProduccionId_fkey" FOREIGN KEY ("lineaProduccionId") REFERENCES "LineaProduccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadMedida" ADD CONSTRAINT "UnidadMedida_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
