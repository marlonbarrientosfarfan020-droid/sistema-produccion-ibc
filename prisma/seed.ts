import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  EstadoMaquina,
  PrismaClient,
  TipoLinea,
  TipoMateriaPrima,
  TipoProducto,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "La variable DATABASE_URL no está configurada en el archivo .env.",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // =========================================================
  // EMPRESA
  // =========================================================

  const empresa = await prisma.empresa.upsert({
    where: {
      ruc: "00000000000",
    },
    update: {
      razonSocial: "Empresa Industrial IBC",
      nombreComercial: "Producción IBC",
      direccion: "Dirección pendiente de configurar",
      activo: true,
    },
    create: {
      razonSocial: "Empresa Industrial IBC",
      nombreComercial: "Producción IBC",
      ruc: "00000000000",
      direccion: "Dirección pendiente de configurar",
      telefono: null,
      correo: null,
      activo: true,
    },
  });

  // =========================================================
  // PLANTA
  // =========================================================

  const planta = await prisma.planta.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "PLANTA-01",
      },
    },
    update: {
      nombre: "Planta Principal",
      descripcion: "Planta principal de producción IBC",
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      codigo: "PLANTA-01",
      nombre: "Planta Principal",
      descripcion: "Planta principal de producción IBC",
      activo: true,
    },
  });

  // =========================================================
  // LÍNEAS DE PRODUCCIÓN
  // =========================================================

  const linea1 = await prisma.lineaProduccion.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "1",
      },
    },
    update: {
      plantaId: planta.id,
      nombre: "Línea 1",
      tipo: TipoLinea.SOPLADO,
      descripcion:
        "Línea de extrusión por soplado con máquina HY1000L-IBM",
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      plantaId: planta.id,
      codigo: "1",
      nombre: "Línea 1",
      tipo: TipoLinea.SOPLADO,
      descripcion:
        "Línea de extrusión por soplado con máquina HY1000L-IBM",
      activo: true,
    },
  });

  const linea2 = await prisma.lineaProduccion.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "2",
      },
    },
    update: {
      plantaId: planta.id,
      nombre: "Línea 2",
      tipo: TipoLinea.SOPLADO,
      descripcion:
        "Línea de extrusión por soplado con máquina HY1000L-IBM-SOLD",
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      plantaId: planta.id,
      codigo: "2",
      nombre: "Línea 2",
      tipo: TipoLinea.SOPLADO,
      descripcion:
        "Línea de extrusión por soplado con máquina HY1000L-IBM-SOLD",
      activo: true,
    },
  });

  // =========================================================
  // MÁQUINAS
  // =========================================================

  const maquina1 = await prisma.maquina.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "MAQ-001",
      },
    },
    update: {
      plantaId: planta.id,
      lineaProduccionId: linea1.id,
      nombre: "HY1000L-IBM",
      descripcion:
        "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizado, pallet de acero, válvula DN50 tipo bola roscada y tapa DN150 ventilada.",
      marca: "HY",
      modelo: "1000L-IBM",
      capacidadNominal: 1000,
      unidadCapacidad: "Litros",
      estado: EstadoMaquina.OPERATIVA,
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      plantaId: planta.id,
      lineaProduccionId: linea1.id,
      codigo: "MAQ-001",
      nombre: "HY1000L-IBM",
      descripcion:
        "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizado, pallet de acero, válvula DN50 tipo bola roscada y tapa DN150 ventilada.",
      marca: "HY",
      modelo: "1000L-IBM",
      capacidadNominal: 1000,
      unidadCapacidad: "Litros",
      estado: EstadoMaquina.OPERATIVA,
      activo: true,
    },
  });

  const maquina2 = await prisma.maquina.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "MAQ-002",
      },
    },
    update: {
      plantaId: planta.id,
      lineaProduccionId: linea2.id,
      nombre: "HY1000L-IBM-SOLD",
      descripcion:
        "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizada, válvula DN50 tipo soldada y tapa DN150 ventilada.",
      marca: "HY",
      modelo: "1000L-IBM-SOLD",
      capacidadNominal: 1000,
      unidadCapacidad: "Litros",
      estado: EstadoMaquina.OPERATIVA,
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      plantaId: planta.id,
      lineaProduccionId: linea2.id,
      codigo: "MAQ-002",
      nombre: "HY1000L-IBM-SOLD",
      descripcion:
        "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizada, válvula DN50 tipo soldada y tapa DN150 ventilada.",
      marca: "HY",
      modelo: "1000L-IBM-SOLD",
      capacidadNominal: 1000,
      unidadCapacidad: "Litros",
      estado: EstadoMaquina.OPERATIVA,
      activo: true,
    },
  });

  // =========================================================
  // TURNOS
  // =========================================================

  await prisma.turno.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "1",
      },
    },
    update: {
      nombre: "Turno Día",
      horaInicio: "07:00",
      horaSalida: "19:00",
      cruzaMedianoche: false,
      color: "#F59E0B",
      orden: 1,
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      codigo: "1",
      nombre: "Turno Día",
      horaInicio: "07:00",
      horaSalida: "19:00",
      cruzaMedianoche: false,
      color: "#F59E0B",
      orden: 1,
      toleranciaIngresoMin: 0,
      toleranciaSalidaMin: 0,
      seleccionAutomatica: true,
      descripcion: "Turno de producción diurno",
      activo: true,
    },
  });

  await prisma.turno.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "2",
      },
    },
    update: {
      nombre: "Turno Noche",
      horaInicio: "19:00",
      horaSalida: "07:00",
      cruzaMedianoche: true,
      color: "#4F46E5",
      orden: 2,
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      codigo: "2",
      nombre: "Turno Noche",
      horaInicio: "19:00",
      horaSalida: "07:00",
      cruzaMedianoche: true,
      color: "#4F46E5",
      orden: 2,
      toleranciaIngresoMin: 0,
      toleranciaSalidaMin: 0,
      seleccionAutomatica: true,
      descripcion: "Turno de producción nocturno",
      activo: true,
    },
  });

  // =========================================================
  // UNIDADES DE MEDIDA
  // =========================================================

  const unidades = [
    {
      codigo: "UND",
      nombre: "Unidad",
      simbolo: "und",
      permiteDecimal: false,
    },
    {
      codigo: "KG",
      nombre: "Kilogramo",
      simbolo: "kg",
      permiteDecimal: true,
    },
    {
      codigo: "G",
      nombre: "Gramo",
      simbolo: "g",
      permiteDecimal: true,
    },
    {
      codigo: "L",
      nombre: "Litro",
      simbolo: "L",
      permiteDecimal: true,
    },
    {
      codigo: "M",
      nombre: "Metro",
      simbolo: "m",
      permiteDecimal: true,
    },
    {
      codigo: "MM",
      nombre: "Milímetro",
      simbolo: "mm",
      permiteDecimal: true,
    },
    {
      codigo: "BAR",
      nombre: "Bar",
      simbolo: "bar",
      permiteDecimal: true,
    },
    {
      codigo: "RPM",
      nombre: "Revoluciones por minuto",
      simbolo: "rpm",
      permiteDecimal: true,
    },
    {
      codigo: "SEG",
      nombre: "Segundo",
      simbolo: "s",
      permiteDecimal: true,
    },
    {
      codigo: "ROLLO",
      nombre: "Rollo",
      simbolo: "rollo",
      permiteDecimal: false,
    },
  ];

  for (const unidad of unidades) {
    await prisma.unidadMedida.upsert({
      where: {
        empresaId_codigo: {
          empresaId: empresa.id,
          codigo: unidad.codigo,
        },
      },
      update: {
        nombre: unidad.nombre,
        simbolo: unidad.simbolo,
        permiteDecimal: unidad.permiteDecimal,
        activo: true,
      },
      create: {
        empresaId: empresa.id,
        codigo: unidad.codigo,
        nombre: unidad.nombre,
        simbolo: unidad.simbolo,
        permiteDecimal: unidad.permiteDecimal,
        activo: true,
      },
    });
  }

  const unidadUND = await prisma.unidadMedida.findUnique({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "UND",
      },
    },
  });

  const unidadKG = await prisma.unidadMedida.findUnique({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "KG",
      },
    },
  });

  if (!unidadUND || !unidadKG) {
    throw new Error(
      "No se encontraron las unidades UND y KG.",
    );
  }

  // =========================================================
  // OPERADORES
  // =========================================================

  const operadores = [
    {
      codigo: "A",
      nombre: "Operador A",
      descripcion: "Operador de producción A",
    },
    {
      codigo: "B",
      nombre: "Operador B",
      descripcion: "Operador de producción B",
    },
    {
      codigo: "C",
      nombre: "Operador C",
      descripcion: "Operador de producción C",
    },
    {
      codigo: "OTROS",
      nombre: "Otros",
      descripcion: "Otro operador no incluido en el catálogo",
    },
  ];

  for (const operador of operadores) {
    await prisma.operador.upsert({
      where: {
        empresaId_codigo: {
          empresaId: empresa.id,
          codigo: operador.codigo,
        },
      },
      update: {
        nombre: operador.nombre,
        descripcion: operador.descripcion,
        activo: true,
      },
      create: {
        empresaId: empresa.id,
        codigo: operador.codigo,
        nombre: operador.nombre,
        descripcion: operador.descripcion,
        activo: true,
      },
    });
  }

  // =========================================================
  // COLORES DE PRODUCCIÓN
  // =========================================================

  const colores = [
    {
      codigo: "NATURAL",
      nombre: "Natural",
      codigoHex: "#E8DDC7",
      permiteOtro: false,
    },
    {
      codigo: "BLANCO",
      nombre: "Blanco",
      codigoHex: "#FFFFFF",
      permiteOtro: false,
    },
    {
      codigo: "OTRO",
      nombre: "Otro",
      codigoHex: null,
      permiteOtro: true,
    },
  ];

  for (const color of colores) {
    await prisma.colorProduccion.upsert({
      where: {
        empresaId_codigo: {
          empresaId: empresa.id,
          codigo: color.codigo,
        },
      },
      update: {
        nombre: color.nombre,
        codigoHex: color.codigoHex,
        permiteOtro: color.permiteOtro,
        activo: true,
      },
      create: {
        empresaId: empresa.id,
        codigo: color.codigo,
        nombre: color.nombre,
        codigoHex: color.codigoHex,
        permiteOtro: color.permiteOtro,
        activo: true,
      },
    });
  }

  // =========================================================
  // PRODUCTO EN PROCESO
  // =========================================================

  const productoProceso = await prisma.producto.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "PP-RES-TAN-IBC-001",
      },
    },
    update: {
      codigoSap: "PP-RES-TAN-IBC-001",
      nombre: "Tanque soplado",
      descripcion:
        "Tanque IBC fabricado mediante extrusión por soplado.",
      tipo: TipoProducto.PRODUCTO_PROCESO,
      tipoMateriaPrima: null,
      familia: "IBC",
      unidadMedidaId: unidadUND.id,
      controlaStock: false,
      permiteDecimal: false,
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      unidadMedidaId: unidadUND.id,
      codigo: "PP-RES-TAN-IBC-001",
      codigoSap: "PP-RES-TAN-IBC-001",
      nombre: "Tanque soplado",
      descripcion:
        "Tanque IBC fabricado mediante extrusión por soplado.",
      tipo: TipoProducto.PRODUCTO_PROCESO,
      tipoMateriaPrima: null,
      familia: "IBC",
      stockInicial: 0,
      stockActual: 0,
      stockMinimo: 0,
      controlaStock: false,
      permiteDecimal: false,
      activo: true,
    },
  });

  // =========================================================
  // PRODUCTOS TERMINADOS
  // =========================================================

  const productoTerminado1 =
    await prisma.producto.upsert({
      where: {
        empresaId_codigo: {
          empresaId: empresa.id,
          codigo: "PT-IBC-001",
        },
      },
      update: {
        codigoSap: "PT-IBC-001",
        nombre: "IBC POLARIS 1060 HDPE Virgen",
        descripcion:
          "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizada, pallet de acero, válvula DN50 tipo bola roscada y tapa DN150 ventilada.",
        tipo: TipoProducto.PRODUCTO_TERMINADO,
        tipoMateriaPrima: null,
        familia: "IBC",
        pesoUnitario: 13.5,
        capacidad: 1060,
        unidadCapacidad: "Litros",
        unidadMedidaId: unidadUND.id,
        controlaStock: true,
        permiteDecimal: false,
        activo: true,
      },
      create: {
        empresaId: empresa.id,
        unidadMedidaId: unidadUND.id,
        codigo: "PT-IBC-001",
        codigoSap: "PT-IBC-001",
        nombre: "IBC POLARIS 1060 HDPE Virgen",
        descripcion:
          "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizada, pallet de acero, válvula DN50 tipo bola roscada y tapa DN150 ventilada.",
        tipo: TipoProducto.PRODUCTO_TERMINADO,
        tipoMateriaPrima: null,
        familia: "IBC",
        pesoUnitario: 13.5,
        capacidad: 1060,
        unidadCapacidad: "Litros",
        stockInicial: 0,
        stockActual: 0,
        stockMinimo: 0,
        controlaStock: true,
        permiteDecimal: false,
        activo: true,
      },
    });

  const productoTerminado2 =
    await prisma.producto.upsert({
      where: {
        empresaId_codigo: {
          empresaId: empresa.id,
          codigo: "PT-IBC-002",
        },
      },
      update: {
        codigoSap: "PT-IBC-002",
        nombre: "IBC POLARIS 1060 HDPE Virgen Soldada",
        descripcion:
          "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizada, válvula DN50 tipo soldada y tapa DN150 ventilada.",
        tipo: TipoProducto.PRODUCTO_TERMINADO,
        tipoMateriaPrima: null,
        familia: "IBC",
        pesoUnitario: 13.5,
        capacidad: 1060,
        unidadCapacidad: "Litros",
        unidadMedidaId: unidadUND.id,
        controlaStock: true,
        permiteDecimal: false,
        activo: true,
      },
      create: {
        empresaId: empresa.id,
        unidadMedidaId: unidadUND.id,
        codigo: "PT-IBC-002",
        codigoSap: "PT-IBC-002",
        nombre: "IBC POLARIS 1060 HDPE Virgen Soldada",
        descripcion:
          "IBC POLARIS 1060 HDPE virgen, jaula de acero galvanizada, válvula DN50 tipo soldada y tapa DN150 ventilada.",
        tipo: TipoProducto.PRODUCTO_TERMINADO,
        tipoMateriaPrima: null,
        familia: "IBC",
        pesoUnitario: 13.5,
        capacidad: 1060,
        unidadCapacidad: "Litros",
        stockInicial: 0,
        stockActual: 0,
        stockMinimo: 0,
        controlaStock: true,
        permiteDecimal: false,
        activo: true,
      },
    });

  // =========================================================
  // MATERIA PRIMA
  // Los códigos SAP se podrán reemplazar cuando el cliente
  // entregue los códigos oficiales.
  // =========================================================

  const materialVirgen = await prisma.producto.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "MP-HDPE-VIRGEN-001",
      },
    },
    update: {
      codigoSap: "MP-HDPE-VIRGEN-001",
      nombre: "HDPE Virgen",
      descripcion:
        "Polietileno de alta densidad virgen utilizado en la fabricación de envases IBC.",
      tipo: TipoProducto.MATERIA_PRIMA,
      tipoMateriaPrima: TipoMateriaPrima.VIRGEN,
      familia: "HDPE",
      unidadMedidaId: unidadKG.id,
      controlaStock: true,
      permiteDecimal: true,
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      unidadMedidaId: unidadKG.id,
      codigo: "MP-HDPE-VIRGEN-001",
      codigoSap: "MP-HDPE-VIRGEN-001",
      nombre: "HDPE Virgen",
      descripcion:
        "Polietileno de alta densidad virgen utilizado en la fabricación de envases IBC.",
      tipo: TipoProducto.MATERIA_PRIMA,
      tipoMateriaPrima: TipoMateriaPrima.VIRGEN,
      familia: "HDPE",
      stockInicial: 0,
      stockActual: 0,
      stockMinimo: 0,
      controlaStock: true,
      permiteDecimal: true,
      activo: true,
    },
  });

  const materialMolido = await prisma.producto.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "MP-HDPE-MOLIDO-001",
      },
    },
    update: {
      codigoSap: "MP-HDPE-MOLIDO-001",
      nombre: "HDPE Molido",
      descripcion:
        "Material HDPE molido y recuperado para reutilización en el proceso productivo.",
      tipo: TipoProducto.MATERIA_PRIMA,
      tipoMateriaPrima: TipoMateriaPrima.MOLIDO,
      familia: "HDPE",
      unidadMedidaId: unidadKG.id,
      controlaStock: true,
      permiteDecimal: true,
      activo: true,
    },
    create: {
      empresaId: empresa.id,
      unidadMedidaId: unidadKG.id,
      codigo: "MP-HDPE-MOLIDO-001",
      codigoSap: "MP-HDPE-MOLIDO-001",
      nombre: "HDPE Molido",
      descripcion:
        "Material HDPE molido y recuperado para reutilización en el proceso productivo.",
      tipo: TipoProducto.MATERIA_PRIMA,
      tipoMateriaPrima: TipoMateriaPrima.MOLIDO,
      familia: "HDPE",
      stockInicial: 0,
      stockActual: 0,
      stockMinimo: 0,
      controlaStock: true,
      permiteDecimal: true,
      activo: true,
    },
  });

  // =========================================================
  // RESULTADO
  // =========================================================

  console.log("Datos iniciales creados correctamente.");
  console.log(`Empresa: ${empresa.nombreComercial}`);
  console.log(`Planta: ${planta.nombre}`);
  console.log(`Línea 1: ${linea1.nombre}`);
  console.log(`Máquina línea 1: ${maquina1.nombre}`);
  console.log(`Línea 2: ${linea2.nombre}`);
  console.log(`Máquina línea 2: ${maquina2.nombre}`);
  console.log("Turnos: Día y Noche");
  console.log(`Unidades creadas: ${unidades.length}`);
  console.log(`Operadores creados: ${operadores.length}`);
  console.log(`Colores creados: ${colores.length}`);
  console.log(
    `Producto proceso: ${productoProceso.codigoSap}`,
  );
  console.log(
    `Productos terminados: ${productoTerminado1.codigoSap} y ${productoTerminado2.codigoSap}`,
  );
  console.log(
    `Materias primas: ${materialVirgen.nombre} y ${materialMolido.nombre}`,
  );
}

main()
  .catch((error) => {
    console.error(
      "Error al crear los datos iniciales:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });