import { NextResponse } from "next/server";

import { obtenerSesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function opcional(valor: unknown) {
  const resultado = texto(valor);
  return resultado || null;
}

function numero(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    texto(valor) === ""
  ) {
    return null;
  }

  const resultado = Number(
    texto(valor).replace(",", "."),
  );

  if (!Number.isFinite(resultado) || resultado < 0) {
    throw new Error(
      "Los valores numéricos deben ser mayores o iguales que cero.",
    );
  }

  return resultado;
}

function entero(valor: unknown) {
  const resultado = numero(valor) ?? 0;

  if (!Number.isInteger(resultado)) {
    throw new Error(
      "Las cantidades de producción deben ser números enteros.",
    );
  }

  return resultado;
}

function fechaUtc(valor: unknown) {
  const fechaTexto = texto(valor);
  const partes = fechaTexto.split("-").map(Number);

  if (partes.length !== 3) {
    return null;
  }

  const [anio, mes, dia] = partes;
  const fecha = new Date(
    Date.UTC(anio, mes - 1, dia, 12),
  );

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return fecha;
}

function semanaIso(fecha: Date) {
  const copia = new Date(
    Date.UTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate(),
    ),
  );

  const dia = copia.getUTCDay() || 7;
  copia.setUTCDate(copia.getUTCDate() + 4 - dia);

  const inicio = new Date(
    Date.UTC(copia.getUTCFullYear(), 0, 1),
  );

  return Math.ceil(
    ((copia.getTime() - inicio.getTime()) /
      86_400_000 +
      1) /
      7,
  );
}

function lote(
  fecha: Date,
  codigoLinea: string,
  codigoTurno: string,
) {
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const anio = String(fecha.getUTCFullYear()).slice(-2);

  return `${dia}${mes}${anio}-${codigoLinea}-${codigoTurno}`;
}

function serializar(modelo: Record<string, unknown> | null) {
  if (!modelo) return null;

  return Object.fromEntries(
    Object.entries(modelo).map(([clave, valor]) => [
      clave,
      valor !== null &&
      typeof valor === "object" &&
      "toString" in valor
        ? String(valor)
        : valor,
    ]),
  );
}

const camposProceso = [
  "extrusoraAZona1",
  "extrusoraAZona2",
  "extrusoraAZona3",
  "extrusoraAZona4",
  "extrusoraAZona5",
  "extrusoraBZona1",
  "extrusoraBZona2",
  "extrusoraBZona3",
  "extrusoraBZona4",
  "extrusoraBZona5",
  "acumuladorZona1",
  "acumuladorZona2",
  "acumuladorZona3",
  "acumuladorZona4",
  "acumuladorZona5",
  "acumuladorZona6",
  "presionAirePrincipal",
  "presionSoplo",
  "presionPresoplo",
  "temperaturaAgua",
  "temperaturaChiller",
  "temperaturaMolde",
  "presionHidraulica",
  "velocidadTornilloA",
  "velocidadTornilloB",
  "espesorParison",
  "pesoEnvase",
  "tiempoCicloSegundos",
] as const;

async function obtenerRegistro(
  id: string,
  empresaId: string,
) {
  return prisma.registroProduccion.findFirst({
    where: {
      id,
      empresaId,
    },
    include: {
      planta: true,
      turno: true,
      lineaProduccion: true,
      maquina: true,
      operador: true,
      productoProceso: true,
      productoTerminado: true,
      materialVirgen: true,
      materialMolido: true,
      colorProduccion: true,
      controlProceso: true,
      controlProduccion: true,
      controlMolienda: true,
      consumosMateriaPrima: {
        include: {
          producto: {
            include: {
              unidadMedida: true,
            },
          },
        },
        orderBy: {
          creadoEn: "asc",
        },
      },
      paradasMaquina: {
        orderBy: {
          creadoEn: "asc",
        },
      },
    },
  });
}

export async function GET(
  _request: Request,
  contexto: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const sesion = await obtenerSesionActual();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "No autenticado.",
        },
        { status: 401 },
      );
    }

    const { id } = await contexto.params;
    const registro = await obtenerRegistro(
      id,
      sesion.empresaId,
    );

    if (!registro) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Registro no encontrado.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      registro: {
        ...registro,
        fechaProduccion:
          registro.fechaProduccion
            .toISOString()
            .slice(0, 10),
        controlProceso: serializar(
          registro.controlProceso as unknown as Record<
            string,
            unknown
          >,
        ),
        controlProduccion: serializar(
          registro.controlProduccion as unknown as Record<
            string,
            unknown
          >,
        ),
        controlMolienda: serializar(
          registro.controlMolienda as unknown as Record<
            string,
            unknown
          >,
        ),
        consumosMateriaPrima:
          registro.consumosMateriaPrima.map(
            (consumo) => ({
              ...serializar(
                consumo as unknown as Record<
                  string,
                  unknown
                >,
              ),
              producto: consumo.producto,
            }),
          ),
      },
    });
  } catch (error) {
    console.error("Error al obtener borrador:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el borrador.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  contexto: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const sesion = await obtenerSesionActual();

    if (!sesion) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "No autenticado.",
        },
        { status: 401 },
      );
    }

    const { id } = await contexto.params;
    const body = await request.json();

    const existente = await prisma.registroProduccion.findFirst({
      where: {
        id,
        empresaId: sesion.empresaId,
      },
      select: {
        id: true,
        estado: true,
      },
    });

    if (!existente) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Registro no encontrado.",
        },
        { status: 404 },
      );
    }

    if (existente.estado !== "BORRADOR") {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Solo se pueden editar registros en estado borrador.",
        },
        { status: 409 },
      );
    }

    const fechaProduccion = fechaUtc(
      body.fechaProduccion,
    );

    if (!fechaProduccion) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "La fecha no es válida.",
        },
        { status: 400 },
      );
    }

    const [
      planta,
      turno,
      linea,
      maquina,
      operador,
      productoProceso,
      productoTerminado,
      materialVirgen,
      materialMolido,
      color,
    ] = await Promise.all([
      prisma.planta.findFirst({
        where: {
          id: texto(body.plantaId),
          empresaId: sesion.empresaId,
          activo: true,
        },
      }),
      prisma.turno.findFirst({
        where: {
          id: texto(body.turnoId),
          empresaId: sesion.empresaId,
          activo: true,
        },
      }),
      prisma.lineaProduccion.findFirst({
        where: {
          id: texto(body.lineaProduccionId),
          empresaId: sesion.empresaId,
          activo: true,
        },
      }),
      prisma.maquina.findFirst({
        where: {
          id: texto(body.maquinaId),
          empresaId: sesion.empresaId,
          activo: true,
        },
      }),
      prisma.operador.findFirst({
        where: {
          id: texto(body.operadorId),
          empresaId: sesion.empresaId,
          activo: true,
        },
      }),
      prisma.producto.findFirst({
        where: {
          id: texto(body.productoProcesoId),
          empresaId: sesion.empresaId,
          tipo: "PRODUCTO_PROCESO",
          activo: true,
        },
      }),
      prisma.producto.findFirst({
        where: {
          id: texto(body.productoTerminadoId),
          empresaId: sesion.empresaId,
          tipo: "PRODUCTO_TERMINADO",
          activo: true,
        },
      }),
      prisma.producto.findFirst({
        where: {
          id: texto(body.materialVirgenId),
          empresaId: sesion.empresaId,
          tipo: "MATERIA_PRIMA",
          activo: true,
        },
      }),
      texto(body.materialMolidoId)
        ? prisma.producto.findFirst({
            where: {
              id: texto(body.materialMolidoId),
              empresaId: sesion.empresaId,
              tipo: "MATERIA_PRIMA",
              activo: true,
            },
          })
        : Promise.resolve(null),
      prisma.colorProduccion.findFirst({
        where: {
          id: texto(body.colorProduccionId),
          empresaId: sesion.empresaId,
          activo: true,
        },
      }),
    ]);

    if (
      !planta ||
      !turno ||
      !linea ||
      !maquina ||
      !operador ||
      !productoProceso ||
      !productoTerminado ||
      !materialVirgen ||
      !color
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Uno o más datos generales seleccionados no son válidos.",
        },
        { status: 400 },
      );
    }

    if (
      maquina.lineaProduccionId !== linea.id ||
      linea.plantaId !== planta.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La planta, línea y máquina seleccionadas no coinciden.",
        },
        { status: 400 },
      );
    }

    const ordenProduccion = texto(
      body.ordenProduccion,
    ).toUpperCase();

    if (!ordenProduccion) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La orden de producción es obligatoria.",
        },
        { status: 400 },
      );
    }

    const controlProcesoEntrada =
      body.controlProceso &&
      typeof body.controlProceso === "object"
        ? body.controlProceso
        : {};

    const controlProceso: Record<string, unknown> = {
      observaciones: opcional(
        controlProcesoEntrada.observaciones,
      ),
    };

    for (const campo of camposProceso) {
      controlProceso[campo] = numero(
        controlProcesoEntrada[campo],
      );
    }

    const controlProduccionEntrada =
      body.controlProduccion &&
      typeof body.controlProduccion === "object"
        ? body.controlProduccion
        : {};

    const programado = entero(
      controlProduccionEntrada.programado,
    );
    const producido = entero(
      controlProduccionEntrada.producido,
    );
    const buenos = entero(
      controlProduccionEntrada.buenos,
    );

    if (buenos > producido) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Los productos buenos no pueden superar la producción.",
        },
        { status: 400 },
      );
    }

    const rechazados = producido - buenos;
    const horasProduccion =
      numero(
        controlProduccionEntrada.horasProduccion,
      ) ?? 0;

    const controlProduccion = {
      programado,
      producido,
      buenos,
      rechazados,
      horasProduccion,
      produccionPorHora:
        horasProduccion > 0
          ? buenos / horasProduccion
          : 0,
      eficiencia:
        programado > 0
          ? (buenos / programado) * 100
          : 0,
      porcentajeRechazo:
        producido > 0
          ? (rechazados / producido) * 100
          : 0,
      cumplimientoPrograma:
        programado > 0
          ? (producido / programado) * 100
          : 0,
      observaciones: opcional(
        controlProduccionEntrada.observaciones,
      ),
    };

    const moliendaEntrada =
      body.controlMolienda &&
      typeof body.controlMolienda === "object"
        ? body.controlMolienda
        : {};

    const pesoRecuperable =
      numero(moliendaEntrada.pesoRecuperable) ?? 0;
    const pesoNoRecuperable =
      numero(moliendaEntrada.pesoNoRecuperable) ?? 0;
    const pesoBarrido =
      numero(moliendaEntrada.pesoBarrido) ?? 0;

    const controlMolienda = {
      pesoRecuperable,
      pesoNoRecuperable,
      pesoBarrido,
      pesoTotal:
        pesoRecuperable +
        pesoNoRecuperable +
        pesoBarrido,
      observaciones: opcional(
        moliendaEntrada.observaciones,
      ),
    };

    const consumos = Array.isArray(
      body.consumosMateriaPrima,
    )
      ? body.consumosMateriaPrima
      : [];

    const paradas = Array.isArray(
      body.paradasMaquina,
    )
      ? body.paradasMaquina
      : [];

    const semana = semanaIso(fechaProduccion);
    const loteGenerado = lote(
      fechaProduccion,
      linea.codigo,
      turno.codigo,
    );

    await prisma.$transaction(async (tx) => {
      await tx.registroProduccion.update({
        where: { id },
        data: {
          plantaId: planta.id,
          turnoId: turno.id,
          lineaProduccionId: linea.id,
          maquinaId: maquina.id,
          operadorId: operador.id,
          productoProcesoId: productoProceso.id,
          productoTerminadoId:
            productoTerminado.id,
          materialVirgenId: materialVirgen.id,
          materialMolidoId:
            materialMolido?.id ?? null,
          colorProduccionId: color.id,
          fechaProduccion,
          semana,
          mes: fechaProduccion.getUTCMonth() + 1,
          anio: fechaProduccion.getUTCFullYear(),
          lote: loteGenerado,
          ordenProduccion,
          colorOtro: color.permiteOtro
            ? opcional(body.colorOtro)
            : null,
          observaciones: opcional(
            body.observaciones,
          ),
        },
      });

      await tx.controlProceso.upsert({
        where: {
          registroProduccionId: id,
        },
        create: {
          registroProduccionId: id,
          ...controlProceso,
        },
        update: controlProceso,
      });

      await tx.controlProduccion.upsert({
        where: {
          registroProduccionId: id,
        },
        create: {
          registroProduccionId: id,
          ...controlProduccion,
        },
        update: controlProduccion,
      });

      await tx.controlMolienda.upsert({
        where: {
          registroProduccionId: id,
        },
        create: {
          registroProduccionId: id,
          ...controlMolienda,
        },
        update: controlMolienda,
      });

      await tx.consumoMateriaPrima.deleteMany({
        where: {
          registroProduccionId: id,
        },
      });

      if (consumos.length > 0) {
        const filas = consumos
          .filter(
            (fila: Record<string, unknown>) =>
              texto(fila.productoId),
          )
          .map(
            (fila: Record<string, unknown>) => {
              const inicial =
                numero(fila.cantidadInicial) ?? 0;
              const consumida =
                numero(
                  fila.cantidadConsumida,
                ) ?? 0;
              const estandar = numero(
                fila.consumoEstandarEnvase,
              );
              const real =
                buenos > 0
                  ? consumida / buenos
                  : 0;

              return {
                registroProduccionId: id,
                productoId: texto(
                  fila.productoId,
                ),
                cantidadInicial: inicial,
                cantidadConsumida: consumida,
                cantidadFinal: Math.max(
                  0,
                  inicial - consumida,
                ),
                consumoEstandarEnvase:
                  estandar,
                consumoRealEnvase: real,
                diferenciaConsumo:
                  estandar !== null
                    ? real - estandar
                    : 0,
                rendimiento:
                  consumida > 0
                    ? ((buenos *
                        (numero(
                          controlProcesoEntrada.pesoEnvase,
                        ) ?? 0)) /
                        consumida) *
                      100
                    : 0,
                observaciones: opcional(
                  fila.observaciones,
                ),
              };
            },
          );

        if (filas.length > 0) {
          await tx.consumoMateriaPrima.createMany({
            data: filas,
          });
        }
      }

      await tx.paradaMaquina.deleteMany({
        where: {
          registroProduccionId: id,
        },
      });

      const filasParadas = paradas
        .filter(
          (fila: Record<string, unknown>) =>
            texto(fila.horaInicio) &&
            texto(fila.horaFin) &&
            texto(fila.tipo) &&
            texto(fila.motivo),
        )
        .map(
          (fila: Record<string, unknown>) => ({
            registroProduccionId: id,
            horaInicio: texto(fila.horaInicio),
            horaFin: texto(fila.horaFin),
            minutos: entero(fila.minutos),
            tipo: texto(fila.tipo) as
              | "MECANICA"
              | "ELECTRICA"
              | "CALIDAD"
              | "FALTA_MATERIAL"
              | "CAMBIO_MOLDE"
              | "AJUSTE_PROCESO"
              | "OTRA",
            motivo: texto(fila.motivo),
            observaciones: opcional(
              fila.observaciones,
            ),
          }),
        );

      if (filasParadas.length > 0) {
        await tx.paradaMaquina.createMany({
          data: filasParadas,
        });
      }
    });

    const actualizado = await obtenerRegistro(
      id,
      sesion.empresaId,
    );

    return NextResponse.json({
      ok: true,
      mensaje:
        "Los datos del borrador fueron actualizados correctamente.",
      registro: actualizado,
    });
  } catch (error) {
    console.error("Error al editar borrador:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el borrador.",
      },
      { status: 500 },
    );
  }
}
