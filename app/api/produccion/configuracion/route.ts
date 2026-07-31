import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const empresa = await prisma.empresa.findFirst({
      where: {
        activo: true,
      },
      orderBy: {
        creadoEn: "asc",
      },
      select: {
        id: true,
        nombreComercial: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "No existe una empresa activa configurada.",
          empresa: null,
          plantas: [],
          turnos: [],
          lineas: [],
          maquinas: [],
          operadores: [],
          colores: [],
          productosProceso: [],
          productosTerminados: [],
          materialesVirgenes: [],
          materialesMolidos: [],
        },
        {
          status: 404,
        },
      );
    }

    const [
      plantas,
      turnos,
      lineas,
      maquinas,
      operadores,
      colores,
      productosProceso,
      productosTerminados,
      materialesVirgenes,
      materialesMolidos,
    ] = await Promise.all([
      prisma.planta.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
        orderBy: {
          nombre: "asc",
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          direccion: true,
          descripcion: true,
        },
      }),

      prisma.turno.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
        orderBy: [
          {
            orden: "asc",
          },
          {
            nombre: "asc",
          },
        ],
        select: {
          id: true,
          codigo: true,
          nombre: true,
          horaInicio: true,
          horaSalida: true,
          cruzaMedianoche: true,
          color: true,
          orden: true,
        },
      }),

      prisma.lineaProduccion.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
        orderBy: {
          codigo: "asc",
        },
        select: {
          id: true,
          plantaId: true,
          codigo: true,
          nombre: true,
          tipo: true,
          descripcion: true,
        },
      }),

      prisma.maquina.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
        orderBy: {
          nombre: "asc",
        },
        select: {
          id: true,
          plantaId: true,
          lineaProduccionId: true,
          codigo: true,
          nombre: true,
          descripcion: true,
          marca: true,
          modelo: true,
          capacidadNominal: true,
          unidadCapacidad: true,
          estado: true,
        },
      }),

      prisma.operador.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
        orderBy: {
          codigo: "asc",
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          descripcion: true,
        },
      }),

      prisma.colorProduccion.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
        orderBy: {
          nombre: "asc",
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          codigoHex: true,
          permiteOtro: true,
        },
      }),

      prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          tipo: "PRODUCTO_PROCESO",
          activo: true,
        },
        orderBy: {
          codigoSap: "asc",
        },
        select: {
          id: true,
          codigo: true,
          codigoSap: true,
          nombre: true,
          descripcion: true,
          familia: true,
          pesoUnitario: true,
          capacidad: true,
          unidadCapacidad: true,
        },
      }),

      prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          tipo: "PRODUCTO_TERMINADO",
          activo: true,
        },
        orderBy: {
          codigoSap: "asc",
        },
        select: {
          id: true,
          codigo: true,
          codigoSap: true,
          nombre: true,
          descripcion: true,
          familia: true,
          pesoUnitario: true,
          capacidad: true,
          unidadCapacidad: true,
        },
      }),

      prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          tipo: "MATERIA_PRIMA",
          tipoMateriaPrima: "VIRGEN",
          activo: true,
        },
        orderBy: {
          codigoSap: "asc",
        },
        select: {
          id: true,
          codigo: true,
          codigoSap: true,
          nombre: true,
          descripcion: true,
          familia: true,
          stockActual: true,
          unidadMedida: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              simbolo: true,
            },
          },
        },
      }),

      prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          tipo: "MATERIA_PRIMA",
          tipoMateriaPrima: "MOLIDO",
          activo: true,
        },
        orderBy: {
          codigoSap: "asc",
        },
        select: {
          id: true,
          codigo: true,
          codigoSap: true,
          nombre: true,
          descripcion: true,
          familia: true,
          stockActual: true,
          unidadMedida: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              simbolo: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      empresa,
      plantas,
      turnos,
      lineas,
      maquinas: maquinas.map((maquina) => ({
        ...maquina,
        capacidadNominal:
          maquina.capacidadNominal?.toString() ?? null,
      })),
      operadores,
      colores,
      productosProceso: productosProceso.map((producto) => ({
        ...producto,
        pesoUnitario:
          producto.pesoUnitario?.toString() ?? null,
        capacidad: producto.capacidad?.toString() ?? null,
      })),
      productosTerminados: productosTerminados.map(
        (producto) => ({
          ...producto,
          pesoUnitario:
            producto.pesoUnitario?.toString() ?? null,
          capacidad:
            producto.capacidad?.toString() ?? null,
        }),
      ),
      materialesVirgenes: materialesVirgenes.map(
        (material) => ({
          ...material,
          stockActual: material.stockActual.toString(),
        }),
      ),
      materialesMolidos: materialesMolidos.map(
        (material) => ({
          ...material,
          stockActual: material.stockActual.toString(),
        }),
      ),
    });
  } catch (error) {
    console.error(
      "Error al cargar la configuración de producción:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No se pudo cargar la configuración de producción.",
        empresa: null,
        plantas: [],
        turnos: [],
        lineas: [],
        maquinas: [],
        operadores: [],
        colores: [],
        productosProceso: [],
        productosTerminados: [],
        materialesVirgenes: [],
        materialesMolidos: [],
      },
      {
        status: 500,
      },
    );
  }
}