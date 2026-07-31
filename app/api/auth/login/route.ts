import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {
  guardarCookieSesion,
  type RolUsuarioSesion,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CuerpoLogin = {
  correo?: unknown;
  password?: unknown;
};

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function correoValido(correo: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    correo,
  );
}

export async function POST(request: Request) {
  try {
    const cuerpo =
      (await request.json()) as CuerpoLogin;

    const correo = texto(
      cuerpo.correo,
    ).toLowerCase();

    const password = texto(cuerpo.password);

    if (!correo || !password) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Ingrese su correo y contraseña.",
        },
        {
          status: 400,
        },
      );
    }

    if (!correoValido(correo)) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "El correo ingresado no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        correo: {
          equals: correo,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        empresaId: true,
        plantaId: true,
        nombres: true,
        apellidos: true,
        correo: true,
        passwordHash: true,
        rol: true,
        estado: true,
        empresa: {
          select: {
            activo: true,
          },
        },
        planta: {
          select: {
            activo: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Correo o contraseña incorrectos.",
        },
        {
          status: 401,
        },
      );
    }

    if (usuario.estado === "INACTIVO") {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Su cuenta se encuentra inactiva.",
        },
        {
          status: 403,
        },
      );
    }

    if (usuario.estado === "BLOQUEADO") {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Su cuenta se encuentra bloqueada.",
        },
        {
          status: 403,
        },
      );
    }

    if (!usuario.empresa.activo) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La empresa asociada está inactiva.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      usuario.plantaId &&
      usuario.planta &&
      !usuario.planta.activo
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La planta asociada está inactiva.",
        },
        {
          status: 403,
        },
      );
    }

    const passwordCorrecto =
      await bcrypt.compare(
        password,
        usuario.passwordHash,
      );

    if (!passwordCorrecto) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Correo o contraseña incorrectos.",
        },
        {
          status: 401,
        },
      );
    }

    await guardarCookieSesion({
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      plantaId: usuario.plantaId,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol as RolUsuarioSesion,
    });

    await prisma.usuario.update({
      where: {
        id: usuario.id,
      },
      data: {
        ultimoAccesoEn: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      mensaje: "Inicio de sesión correcto.",
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(
      "Error al iniciar sesión:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar sesión.",
      },
      {
        status: 500,
      },
    );
  }
}