import { NextResponse } from "next/server";

import {
  nombreCompletoUsuario,
  obtenerSesionActual,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const sesion = await obtenerSesionActual();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          autenticado: false,
          mensaje: "No existe una sesión activa.",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      autenticado: true,
      usuario: {
        id: sesion.usuarioId,
        empresaId: sesion.empresaId,
        plantaId: sesion.plantaId,
        nombres: sesion.nombres,
        apellidos: sesion.apellidos,
        nombreCompleto:
          nombreCompletoUsuario(sesion),
        correo: sesion.correo,
        rol: sesion.rol,
      },
    });
  } catch (error) {
    console.error(
      "Error al consultar la sesión:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        autenticado: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo consultar la sesión.",
      },
      {
        status: 500,
      },
    );
  }
}