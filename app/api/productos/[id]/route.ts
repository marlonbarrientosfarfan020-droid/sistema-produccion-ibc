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

export async function PUT(
  request: Request,
  contexto: { params: Promise<{ id: string }> },
) {
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
        { ok: false, mensaje: "No tiene permisos para editar productos." },
        { status: 403 },
      );
    }

    const { id } = await contexto.params;
    const cuerpo = await request.json();

    const existente = await prisma.producto.findFirst({
      where: {
        id,
        empresaId: sesion.empresaId,
        tipo: "PRODUCTO_TERMINADO",
      },
    });

    if (!existente) {
      return NextResponse.json(
        { ok: false, mensaje: "Producto no encontrado." },
        { status: 404 },
      );
    }

    const codigo = texto(cuerpo.codigo).toUpperCase();
    const codigoSap = texto(cuerpo.codigoSap).toUpperCase() || null;
    const nombre = texto(cuerpo.nombre);

    if (!codigo || !nombre) {
      return NextResponse.json(
        { ok: false, mensaje: "Código y nombre son obligatorios." },
        { status: 400 },
      );
    }

    const duplicado = await prisma.producto.findFirst({
      where: {
        empresaId: sesion.empresaId,
        id: { not: id },
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
          mensaje: "Ya existe otro producto con ese código o código SAP.",
        },
        { status: 409 },
      );
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        unidadMedidaId: texto(cuerpo.unidadMedidaId) || null,
        codigo,
        codigoSap,
        nombre,
        descripcion: texto(cuerpo.descripcion) || null,
        familia: texto(cuerpo.familia) || null,
        marca: texto(cuerpo.marca) || null,
        pesoUnitario: numero(cuerpo.pesoUnitario),
        capacidad: numero(cuerpo.capacidad),
        unidadCapacidad: texto(cuerpo.unidadCapacidad) || null,
        stockInicial: numero(cuerpo.stockInicial),
        stockActual: numero(cuerpo.stockActual),
        stockMinimo: numero(cuerpo.stockMinimo),
        controlaStock: Boolean(cuerpo.controlaStock),
        permiteDecimal: Boolean(cuerpo.permiteDecimal),
        observaciones: texto(cuerpo.observaciones) || null,
      },
    });

    return NextResponse.json({
      ok: true,
      mensaje: "Producto actualizado correctamente.",
      producto,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el producto.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  contexto: { params: Promise<{ id: string }> },
) {
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
        { ok: false, mensaje: "No tiene permisos para cambiar el estado." },
        { status: 403 },
      );
    }

    const { id } = await contexto.params;
    const cuerpo = await request.json();

    const existente = await prisma.producto.findFirst({
      where: {
        id,
        empresaId: sesion.empresaId,
        tipo: "PRODUCTO_TERMINADO",
      },
      select: { id: true, activo: true },
    });

    if (!existente) {
      return NextResponse.json(
        { ok: false, mensaje: "Producto no encontrado." },
        { status: 404 },
      );
    }

    const activo =
      typeof cuerpo.activo === "boolean"
        ? cuerpo.activo
        : !existente.activo;

    await prisma.producto.update({
      where: { id },
      data: { activo },
    });

    return NextResponse.json({
      ok: true,
      mensaje: activo
        ? "Producto activado correctamente."
        : "Producto desactivado correctamente.",
      activo,
    });
  } catch (error) {
    console.error("Error al cambiar estado del producto:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar el estado.",
      },
      { status: 500 },
    );
  }
}