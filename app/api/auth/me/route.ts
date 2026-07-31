import { NextResponse } from "next/server";

import { obtenerSesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sesion = await obtenerSesionActual();

  if (!sesion) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "No existe una sesión activa.",
      },
      {
        status: 401,
      },
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: {
      id: sesion.usuarioId,
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      correo: true,
      rol: true,
      estado: true,
      planta: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      },
      empresa: {
        select: {
          id: true,
          nombreComercial: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!usuario || usuario.estado !== "ACTIVO") {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "El usuario no está disponible.",
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    usuario,
  });
}
