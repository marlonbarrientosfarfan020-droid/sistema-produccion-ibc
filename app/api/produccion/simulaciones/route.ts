import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CuerpoEliminar = {
  confirmacion?: string;
};

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
          mensaje: "No existe una empresa activa.",
        },
        {
          status: 404,
        },
      );
    }

    const cantidad =
      await prisma.registroProduccion.count({
        where: {
          empresaId: empresa.id,
          esSimulacion: true,
        },
      });

    return NextResponse.json({
      ok: true,
      empresa: empresa.nombreComercial,
      cantidad,
      mensaje:
        cantidad > 0
          ? `Existen ${cantidad} registros simulados.`
          : "No existen registros simulados.",
    });
  } catch (error) {
    console.error(
      "Error al consultar datos simulados:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudieron consultar los datos simulados.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cuerpo =
      (await request.json()) as CuerpoEliminar;

    if (
      cuerpo.confirmacion !==
      "ELIMINAR DATOS SIMULADOS"
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            'La confirmación debe ser exactamente: ELIMINAR DATOS SIMULADOS',
        },
        {
          status: 400,
        },
      );
    }

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
          mensaje: "No existe una empresa activa.",
        },
        {
          status: 404,
        },
      );
    }

    const cantidad =
      await prisma.registroProduccion.count({
        where: {
          empresaId: empresa.id,
          esSimulacion: true,
        },
      });

    if (cantidad === 0) {
      return NextResponse.json({
        ok: true,
        eliminados: 0,
        mensaje:
          "No existen datos simulados para eliminar.",
      });
    }

    const resultado =
      await prisma.registroProduccion.deleteMany({
        where: {
          empresaId: empresa.id,
          esSimulacion: true,
        },
      });

    return NextResponse.json({
      ok: true,
      eliminados: resultado.count,
      mensaje: `${resultado.count} registros simulados fueron eliminados correctamente.`,
    });
  } catch (error) {
    console.error(
      "Error al eliminar datos simulados:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudieron eliminar los datos simulados.",
      },
      {
        status: 500,
      },
    );
  }
}