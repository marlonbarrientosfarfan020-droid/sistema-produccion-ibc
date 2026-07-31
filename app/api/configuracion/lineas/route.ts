import { NextResponse } from "next/server";

import { obtenerSesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const tiposValidos = [
  "SOPLADO",
  "INYECCION",
  "ENSAMBLAJE",
  "MOLIENDA",
  "OTRO",
] as const;

type TipoLineaValido = (typeof tiposValidos)[number];

type CuerpoLinea = {
  id?: unknown;
  plantaId?: unknown;
  codigo?: unknown;
  nombre?: unknown;
  tipo?: unknown;
  descripcion?: unknown;
  activo?: unknown;
};

function limpiarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function respuestaError(
  mensaje: string,
  status = 400,
) {
  return NextResponse.json(
    { ok: false, mensaje },
    { status },
  );
}

async function exigirAdministrador() {
  const sesion = await obtenerSesionActual();

  if (!sesion) {
    return {
      sesion: null,
      error: respuestaError(
        "Debe iniciar sesión.",
        401,
      ),
    };
  }

  if (
    ![
      "SUPERADMIN",
      "ADMINISTRADOR",
      "JEFE_PLANTA",
    ].includes(sesion.rol)
  ) {
    return {
      sesion: null,
      error: respuestaError(
        "No tiene permisos para administrar líneas.",
        403,
      ),
    };
  }

  return { sesion, error: null };
}

export async function GET() {
  try {
    const acceso = await exigirAdministrador();

    if (!acceso.sesion || acceso.error) {
      return acceso.error;
    }

    const [lineas, plantas] = await Promise.all([
      prisma.lineaProduccion.findMany({
        where: {
          empresaId: acceso.sesion.empresaId,
        },
        orderBy: [
          { activo: "desc" },
          { nombre: "asc" },
        ],
        include: {
          planta: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          _count: {
            select: {
              maquinas: true,
            },
          },
        },
      }),
      prisma.planta.findMany({
        where: {
          empresaId: acceso.sesion.empresaId,
          activo: true,
        },
        orderBy: {
          nombre: "asc",
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      lineas,
      plantas,
      tipos: tiposValidos,
    });
  } catch (error) {
    console.error(
      "Error al listar líneas:",
      error,
    );

    return respuestaError(
      "No se pudieron cargar las líneas.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const acceso = await exigirAdministrador();

    if (!acceso.sesion || acceso.error) {
      return acceso.error;
    }

    const body =
      (await request.json()) as CuerpoLinea;

    const plantaId = limpiarTexto(body.plantaId);
    const codigo = limpiarTexto(body.codigo).toUpperCase();
    const nombre = limpiarTexto(body.nombre);
    const tipo = limpiarTexto(body.tipo) as TipoLineaValido;
    const descripcion =
      limpiarTexto(body.descripcion) || null;

    if (!plantaId || !codigo || !nombre) {
      return respuestaError(
        "Planta, código y nombre son obligatorios.",
      );
    }

    if (!tiposValidos.includes(tipo)) {
      return respuestaError(
        "Seleccione un tipo de línea válido.",
      );
    }

    const planta = await prisma.planta.findFirst({
      where: {
        id: plantaId,
        empresaId: acceso.sesion.empresaId,
        activo: true,
      },
      select: {
        id: true,
      },
    });

    if (!planta) {
      return respuestaError(
        "La planta seleccionada no es válida.",
      );
    }

    const duplicada =
      await prisma.lineaProduccion.findFirst({
        where: {
          empresaId: acceso.sesion.empresaId,
          codigo: {
            equals: codigo,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicada) {
      return respuestaError(
        "Ya existe una línea con ese código.",
      );
    }

    const linea =
      await prisma.lineaProduccion.create({
        data: {
          empresaId: acceso.sesion.empresaId,
          plantaId,
          codigo,
          nombre,
          tipo,
          descripcion,
          activo: true,
        },
        include: {
          planta: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          _count: {
            select: {
              maquinas: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        ok: true,
        mensaje:
          "Línea creada correctamente.",
        linea,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Error al crear línea:",
      error,
    );

    return respuestaError(
      "No se pudo crear la línea.",
      500,
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const acceso = await exigirAdministrador();

    if (!acceso.sesion || acceso.error) {
      return acceso.error;
    }

    const body =
      (await request.json()) as CuerpoLinea;

    const id = limpiarTexto(body.id);
    const plantaId = limpiarTexto(body.plantaId);
    const codigo = limpiarTexto(body.codigo).toUpperCase();
    const nombre = limpiarTexto(body.nombre);
    const tipo = limpiarTexto(body.tipo) as TipoLineaValido;
    const descripcion =
      limpiarTexto(body.descripcion) || null;
    const activo = Boolean(body.activo);

    if (!id || !plantaId || !codigo || !nombre) {
      return respuestaError(
        "Id, planta, código y nombre son obligatorios.",
      );
    }

    if (!tiposValidos.includes(tipo)) {
      return respuestaError(
        "Seleccione un tipo de línea válido.",
      );
    }

    const actual =
      await prisma.lineaProduccion.findFirst({
        where: {
          id,
          empresaId: acceso.sesion.empresaId,
        },
        select: {
          id: true,
        },
      });

    if (!actual) {
      return respuestaError(
        "La línea no existe.",
        404,
      );
    }

    const duplicada =
      await prisma.lineaProduccion.findFirst({
        where: {
          empresaId: acceso.sesion.empresaId,
          codigo: {
            equals: codigo,
            mode: "insensitive",
          },
          id: {
            not: id,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicada) {
      return respuestaError(
        "Otra línea ya usa ese código.",
      );
    }

    const linea =
      await prisma.lineaProduccion.update({
        where: { id },
        data: {
          plantaId,
          codigo,
          nombre,
          tipo,
          descripcion,
          activo,
        },
        include: {
          planta: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          _count: {
            select: {
              maquinas: true,
            },
          },
        },
      });

    return NextResponse.json({
      ok: true,
      mensaje:
        "Línea actualizada correctamente.",
      linea,
    });
  } catch (error) {
    console.error(
      "Error al actualizar línea:",
      error,
    );

    return respuestaError(
      "No se pudo actualizar la línea.",
      500,
    );
  }
}
