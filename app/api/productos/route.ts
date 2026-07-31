import { NextResponse } from "next/server";

import { obtenerSesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLES_ESCRITURA = [
  "SUPERADMIN",
  "ADMINISTRADOR",
  "JEFE_PLANTA",
  "SUPERVISOR",
  "ALMACEN",
] as const;

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function numero(valor: unknown) {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

export async function GET(request: Request) {
  try {
    const sesion = await obtenerSesionActual();

    if (!sesion) {
      return NextResponse.json(
        { ok: false, mensaje: "No autenticado." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const busqueda = texto(url.searchParams.get("busqueda"));
    const estado = texto(url.searchParams.get("estado"));

    const productos = await prisma.producto.findMany({
      where: {
        empresaId: sesion.empresaId,
        tipo: "PRODUCTO_TERMINADO",
        ...(estado === "activos"
          ? { activo: true }
          : estado === "inactivos"
            ? { activo: false }
            : {}),
        ...(busqueda
          ? {
              OR: [
                { codigo: { contains: busqueda, mode: "insensitive" } },
                { codigoSap: { contains: busqueda, mode: "insensitive" } },
                { nombre: { contains: busqueda, mode: "insensitive" } },
                { descripcion: { contains: busqueda, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [
        { activo: "desc" },
        { nombre: "asc" },
      ],
      include: {
        unidadMedida: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            simbolo: true,
          },
        },
        registrosComoTerminado: {
          where: {
            estado: {
              not: "ANULADO",
            },
          },
          orderBy: {
            fechaProduccion: "desc",
          },
          take: 1,
          select: {
            fechaProduccion: true,
          },
        },
      },
    });

    const unidades = await prisma.unidadMedida.findMany({
      where: {
        empresaId: sesion.empresaId,
        activo: true,
      },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        simbolo: true,
      },
    });

    return NextResponse.json({
      ok: true,
      productos: productos.map((producto) => {
        const stockActual = numero(producto.stockActual);
        const stockMinimo = numero(producto.stockMinimo);

        const estadoStock =
          !producto.controlaStock
            ? "SIN_CONTROL"
            : stockActual <= 0
              ? "AGOTADO"
              : stockMinimo > 0 &&
                  stockActual <= stockMinimo
                ? "BAJO"
                : "DISPONIBLE";

        return {
          ...producto,
          pesoUnitario: numero(producto.pesoUnitario),
          capacidad: numero(producto.capacidad),
          stockInicial: numero(producto.stockInicial),
          stockActual,
          stockMinimo,
          estadoStock,
          ultimaProduccion:
            producto.registrosComoTerminado[0]
              ?.fechaProduccion ?? null,
          registrosComoTerminado: undefined,
        };
      }),
      unidades,
      permisos: {
        puedeEditar: ROLES_ESCRITURA.includes(
          sesion.rol as (typeof ROLES_ESCRITURA)[number],
        ),
      },
    });
  } catch (error) {
    console.error("Error al listar productos terminados:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los productos.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await obtenerSesionActual();

    if (!sesion) {
      return NextResponse.json(
        { ok: false, mensaje: "No autenticado." },
        { status: 401 },
      );
    }

    if (
      !ROLES_ESCRITURA.includes(
        sesion.rol as (typeof ROLES_ESCRITURA)[number],
      )
    ) {
      return NextResponse.json(
        { ok: false, mensaje: "No tiene permisos para crear productos." },
        { status: 403 },
      );
    }

    const cuerpo = await request.json();

    const codigo = texto(cuerpo.codigo).toUpperCase();
    const codigoSap = texto(cuerpo.codigoSap).toUpperCase() || null;
    const nombre = texto(cuerpo.nombre);

    if (!codigo || !nombre) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Código y nombre son obligatorios.",
        },
        { status: 400 },
      );
    }

    const duplicado = await prisma.producto.findFirst({
      where: {
        empresaId: sesion.empresaId,
        OR: [
          { codigo },
          ...(codigoSap ? [{ codigoSap }] : []),
        ],
      },
      select: { id: true },
    });

    if (duplicado) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Ya existe un producto con ese código o código SAP.",
        },
        { status: 409 },
      );
    }

    const stockInicial = numero(cuerpo.stockInicial);
    const stockActual =
      cuerpo.stockActual === undefined
        ? stockInicial
        : numero(cuerpo.stockActual);

    const producto = await prisma.producto.create({
      data: {
        empresaId: sesion.empresaId,
        unidadMedidaId: texto(cuerpo.unidadMedidaId) || null,
        codigo,
        codigoSap,
        nombre,
        descripcion: texto(cuerpo.descripcion) || null,
        tipo: "PRODUCTO_TERMINADO",
        familia: texto(cuerpo.familia) || null,
        marca: texto(cuerpo.marca) || null,
        pesoUnitario: numero(cuerpo.pesoUnitario),
        capacidad: numero(cuerpo.capacidad),
        unidadCapacidad: texto(cuerpo.unidadCapacidad) || null,
        stockInicial,
        stockActual,
        stockMinimo: numero(cuerpo.stockMinimo),
        controlaStock: Boolean(cuerpo.controlaStock ?? true),
        permiteDecimal: Boolean(cuerpo.permiteDecimal ?? false),
        observaciones: texto(cuerpo.observaciones) || null,
        activo: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Producto creado correctamente.",
        producto,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al crear producto terminado:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo crear el producto.",
      },
      { status: 500 },
    );
  }
}