import { NextResponse } from "next/server";

import { eliminarCookieSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    await eliminarCookieSesion();

    return NextResponse.json({
      ok: true,
      mensaje: "Sesión cerrada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error al cerrar sesión:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo cerrar la sesión.",
      },
      {
        status: 500,
      },
    );
  }
}