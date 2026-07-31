import { NextResponse } from "next/server";

import { obtenerSesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const estadosValidos = [
  "OPERATIVA",
  "DETENIDA",
  "MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
] as const;

type EstadoMaquinaValido =
  (typeof estadosValidos)[number];

type CuerpoMaquina = {
  id?: unknown;
  plantaId?: unknown;
  lineaProduccionId?: unknown;
  codigo?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  marca?: unknown;
  modelo?: unknown;
  numeroSerie?: unknown;
  anioFabricacion?: unknown;
  capacidadNominal?: unknown;
  unidadCapacidad?: unknown;
  estado?: unknown;
  observaciones?: unknown;
  activo?: unknown;
};

function limpiarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: unknown) {
  const texto = limpiarTexto(valor);

  if (!texto) {
    return null;
  }

  const convertido = Number(
    texto.replace(",", "."),
  );

  return Number.isFinite(convertido)
    ? convertido
    : null;
}

function enteroOpcional(valor: unknown) {
  const numero = numeroOpcional(valor);

  if (numero === null) {
    return null;
  }

  return Number.isInteger(numero)
    ? numero
    : null;
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
      "MANTENIMIENTO",
    ].includes(sesion.rol)
  ) {
    return {
      sesion: null,
      error: respuestaError(
        "No tiene permisos para administrar máquinas.",
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

    const [maquinas, plantas, lineas] =
      await Promise.all([
        prisma.maquina.findMany({
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
            lineaProduccion: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
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
        prisma.lineaProduccion.findMany({
          where: {
            empresaId: acceso.sesion.empresaId,
            activo: true,
          },
          orderBy: {
            nombre: "asc",
          },
          select: {
            id: true,
            plantaId: true,
            codigo: true,
            nombre: true,
          },
        }),
      ]);

    return NextResponse.json({
      ok: true,
      maquinas,
      plantas,
      lineas,
      estados: estadosValidos,
    });
  } catch (error) {
    console.error(
      "Error al listar máquinas:",
      error,
    );

    return respuestaError(
      "No se pudieron cargar las máquinas.",
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
      (await request.json()) as CuerpoMaquina;

    const plantaId = limpiarTexto(body.plantaId);
    const lineaProduccionId =
      limpiarTexto(body.lineaProduccionId) || null;
    const codigo = limpiarTexto(body.codigo).toUpperCase();
    const nombre = limpiarTexto(body.nombre);
    const descripcion =
      limpiarTexto(body.descripcion) || null;
    const marca =
      limpiarTexto(body.marca) || null;
    const modelo =
      limpiarTexto(body.modelo) || null;
    const numeroSerie =
      limpiarTexto(body.numeroSerie) || null;
    const anioFabricacion =
      enteroOpcional(body.anioFabricacion);
    const capacidadNominal =
      numeroOpcional(body.capacidadNominal);
    const unidadCapacidad =
      limpiarTexto(body.unidadCapacidad) || null;
    const estado =
      limpiarTexto(body.estado) as EstadoMaquinaValido;
    const observaciones =
      limpiarTexto(body.observaciones) || null;

    if (!plantaId || !codigo || !nombre) {
      return respuestaError(
        "Planta, código y nombre son obligatorios.",
      );
    }

    if (!estadosValidos.includes(estado)) {
      return respuestaError(
        "Seleccione un estado válido.",
      );
    }

    const duplicada =
      await prisma.maquina.findFirst({
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
        "Ya existe una máquina con ese código.",
      );
    }

    if (numeroSerie) {
      const serieDuplicada =
        await prisma.maquina.findFirst({
          where: {
            empresaId: acceso.sesion.empresaId,
            numeroSerie: {
              equals: numeroSerie,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

      if (serieDuplicada) {
        return respuestaError(
          "Ya existe una máquina con ese número de serie.",
        );
      }
    }

    if (lineaProduccionId) {
      const linea =
        await prisma.lineaProduccion.findFirst({
          where: {
            id: lineaProduccionId,
            empresaId: acceso.sesion.empresaId,
            plantaId,
            activo: true,
          },
          select: {
            id: true,
          },
        });

      if (!linea) {
        return respuestaError(
          "La línea seleccionada no pertenece a la planta.",
        );
      }
    }

    const maquina = await prisma.maquina.create({
      data: {
        empresaId: acceso.sesion.empresaId,
        plantaId,
        lineaProduccionId,
        codigo,
        nombre,
        descripcion,
        marca,
        modelo,
        numeroSerie,
        anioFabricacion,
        capacidadNominal,
        unidadCapacidad,
        estado,
        observaciones,
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
        lineaProduccion: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        mensaje:
          "Máquina creada correctamente.",
        maquina,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Error al crear máquina:",
      error,
    );

    return respuestaError(
      "No se pudo crear la máquina.",
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
      (await request.json()) as CuerpoMaquina;

    const id = limpiarTexto(body.id);
    const plantaId = limpiarTexto(body.plantaId);
    const lineaProduccionId =
      limpiarTexto(body.lineaProduccionId) || null;
    const codigo = limpiarTexto(body.codigo).toUpperCase();
    const nombre = limpiarTexto(body.nombre);
    const descripcion =
      limpiarTexto(body.descripcion) || null;
    const marca =
      limpiarTexto(body.marca) || null;
    const modelo =
      limpiarTexto(body.modelo) || null;
    const numeroSerie =
      limpiarTexto(body.numeroSerie) || null;
    const anioFabricacion =
      enteroOpcional(body.anioFabricacion);
    const capacidadNominal =
      numeroOpcional(body.capacidadNominal);
    const unidadCapacidad =
      limpiarTexto(body.unidadCapacidad) || null;
    const estado =
      limpiarTexto(body.estado) as EstadoMaquinaValido;
    const observaciones =
      limpiarTexto(body.observaciones) || null;
    const activo = Boolean(body.activo);

    if (!id || !plantaId || !codigo || !nombre) {
      return respuestaError(
        "Id, planta, código y nombre son obligatorios.",
      );
    }

    if (!estadosValidos.includes(estado)) {
      return respuestaError(
        "Seleccione un estado válido.",
      );
    }

    const actual = await prisma.maquina.findFirst({
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
        "La máquina no existe.",
        404,
      );
    }

    const duplicada =
      await prisma.maquina.findFirst({
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
        "Otra máquina ya usa ese código.",
      );
    }

    if (lineaProduccionId) {
      const linea =
        await prisma.lineaProduccion.findFirst({
          where: {
            id: lineaProduccionId,
            empresaId: acceso.sesion.empresaId,
            plantaId,
            activo: true,
          },
          select: {
            id: true,
          },
        });

      if (!linea) {
        return respuestaError(
          "La línea seleccionada no pertenece a la planta.",
        );
      }
    }

    const maquina = await prisma.maquina.update({
      where: { id },
      data: {
        plantaId,
        lineaProduccionId,
        codigo,
        nombre,
        descripcion,
        marca,
        modelo,
        numeroSerie,
        anioFabricacion,
        capacidadNominal,
        unidadCapacidad,
        estado,
        observaciones,
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
        lineaProduccion: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mensaje:
        "Máquina actualizada correctamente.",
      maquina,
    });
  } catch (error) {
    console.error(
      "Error al actualizar máquina:",
      error,
    );

    return respuestaError(
      "No se pudo actualizar la máquina.",
      500,
    );
  }
}
