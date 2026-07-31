import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function limpiarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function horaValida(hora: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
}

export async function GET() {
  try {
    const empresa = await prisma.empresa.findFirst({
      orderBy: {
        creadoEn: "asc",
      },
    });

    if (!empresa) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Primero debe registrar la empresa.",
          turnos: [],
        },
        { status: 404 },
      );
    }

    const turnos = await prisma.turno.findMany({
      where: {
        empresaId: empresa.id,
      },
      orderBy: [
        {
          orden: "asc",
        },
        {
          nombre: "asc",
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      turnos,
    });
  } catch (error) {
    console.error("Error al consultar turnos:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No se pudieron consultar los turnos.",
        turnos: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = limpiarTexto(body.id);
    const codigo = limpiarTexto(body.codigo);
    const nombre = limpiarTexto(body.nombre);
    const horaInicio = limpiarTexto(body.horaInicio);
    const horaSalida = limpiarTexto(body.horaSalida);
    const color = limpiarTexto(body.color) || "#2563EB";
    const descripcion = limpiarTexto(body.descripcion);

    const orden = Number(body.orden ?? 1);
    const toleranciaIngresoMin = Number(
      body.toleranciaIngresoMin ?? 0,
    );
    const toleranciaSalidaMin = Number(
      body.toleranciaSalidaMin ?? 0,
    );

    if (!codigo || !nombre || !horaInicio || !horaSalida) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Código, nombre, hora de inicio y hora de salida son obligatorios.",
        },
        { status: 400 },
      );
    }

    if (!horaValida(horaInicio) || !horaValida(horaSalida)) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Las horas deben tener el formato HH:mm.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(orden) ||
      orden < 1 ||
      !Number.isInteger(toleranciaIngresoMin) ||
      toleranciaIngresoMin < 0 ||
      !Number.isInteger(toleranciaSalidaMin) ||
      toleranciaSalidaMin < 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "El orden y las tolerancias deben ser números enteros válidos.",
        },
        { status: 400 },
      );
    }

    const empresa = await prisma.empresa.findFirst({
      orderBy: {
        creadoEn: "asc",
      },
    });

    if (!empresa) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Primero debe registrar la empresa.",
        },
        { status: 404 },
      );
    }

    const datos = {
      codigo,
      nombre,
      horaInicio,
      horaSalida,
      cruzaMedianoche: body.cruzaMedianoche === true,
      color,
      orden,
      toleranciaIngresoMin,
      toleranciaSalidaMin,
      seleccionAutomatica:
        body.seleccionAutomatica !== false,
      descripcion: descripcion || null,
      activo: body.activo !== false,
    };

    const duplicado = await prisma.turno.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [
          {
            codigo,
          },
          {
            nombre,
          },
        ],
        ...(id
          ? {
              NOT: {
                id,
              },
            }
          : {}),
      },
    });

    if (duplicado) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Ya existe otro turno con el mismo código o nombre.",
        },
        { status: 409 },
      );
    }

    const turno = id
      ? await prisma.turno.update({
          where: {
            id,
          },
          data: datos,
        })
      : await prisma.turno.create({
          data: {
            empresaId: empresa.id,
            ...datos,
          },
        });

    return NextResponse.json({
      ok: true,
      mensaje: id
        ? "Turno actualizado correctamente."
        : "Turno registrado correctamente.",
      turno,
    });
  } catch (error) {
    console.error("Error al guardar turno:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No se pudo guardar el turno.",
      },
      { status: 500 },
    );
  }
}