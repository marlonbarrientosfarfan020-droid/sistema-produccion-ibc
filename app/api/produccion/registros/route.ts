import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CuerpoRegistroProduccion = {
  plantaId?: unknown;
  turnoId?: unknown;
  lineaProduccionId?: unknown;
  maquinaId?: unknown;
  operadorId?: unknown;
  productoProcesoId?: unknown;
  productoTerminadoId?: unknown;
  materialVirgenId?: unknown;
  materialMolidoId?: unknown;
  colorProduccionId?: unknown;

  fechaProduccion?: unknown;
  lote?: unknown;
  ordenProduccion?: unknown;
  colorOtro?: unknown;
  observaciones?: unknown;

  controlProceso?: Record<string, unknown> | null;
  controlProduccion?: Record<string, unknown> | null;
  controlMolienda?: Record<string, unknown> | null;
  consumosMateriaPrima?: unknown;
  paradasMaquina?: unknown;
};

const camposDecimalesControlProceso = [
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

function limpiarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function textoOpcional(valor: unknown) {
  const texto = limpiarTexto(valor);

  return texto || null;
}

function convertirDecimalOpcional(
  valor: unknown,
  nombreCampo: string,
) {
  if (
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ""
  ) {
    return null;
  }

  const numero = Number(
    String(valor).trim().replace(",", "."),
  );

  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(
      `${nombreCampo} debe ser un número válido mayor o igual que cero.`,
    );
  }

  return numero;
}

function convertirEnteroNoNegativo(
  valor: unknown,
  nombreCampo: string,
) {
  if (
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ""
  ) {
    return 0;
  }

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    throw new Error(
      `${nombreCampo} debe ser un número entero mayor o igual que cero.`,
    );
  }

  return numero;
}

function crearFechaProduccion(fechaTexto: string) {
  const partes = fechaTexto.split("-").map(Number);

  if (partes.length !== 3) {
    return null;
  }

  const [anio, mes, dia] = partes;

  if (!anio || !mes || !dia) {
    return null;
  }

  const fecha = new Date(
    Date.UTC(anio, mes - 1, dia, 12, 0, 0),
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

function obtenerNumeroSemanaISO(fecha: Date) {
  const fechaUtc = new Date(
    Date.UTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate(),
    ),
  );

  const diaSemana = fechaUtc.getUTCDay() || 7;

  fechaUtc.setUTCDate(
    fechaUtc.getUTCDate() + 4 - diaSemana,
  );

  const inicioAnio = new Date(
    Date.UTC(fechaUtc.getUTCFullYear(), 0, 1),
  );

  return Math.ceil(
    ((fechaUtc.getTime() - inicioAnio.getTime()) /
      86_400_000 +
      1) /
      7,
  );
}

function generarLote(
  fecha: Date,
  codigoLinea: string,
  codigoTurno: string,
) {
  const dia = String(fecha.getUTCDate()).padStart(2, "0");

  const mes = String(
    fecha.getUTCMonth() + 1,
  ).padStart(2, "0");

  const anio = String(
    fecha.getUTCFullYear(),
  ).slice(-2);

  return `${dia}${mes}${anio}-${codigoLinea}-${codigoTurno}`;
}

function construirControlProceso(
  controlProceso:
    | Record<string, unknown>
    | null
    | undefined,
) {
  if (!controlProceso) {
    return null;
  }

  const datos: Record<
    string,
    number | string | null
  > = {};

  for (const campo of camposDecimalesControlProceso) {
    datos[campo] = convertirDecimalOpcional(
      controlProceso[campo],
      campo,
    );
  }

  datos.observaciones = textoOpcional(
    controlProceso.observaciones,
  );

  const tieneInformacion = Object.entries(datos).some(
    ([campo, valor]) => {
      if (campo === "observaciones") {
        return Boolean(valor);
      }

      return valor !== null;
    },
  );

  if (!tieneInformacion) {
    return null;
  }

  return {
    extrusoraAZona1:
      datos.extrusoraAZona1 as number | null,
    extrusoraAZona2:
      datos.extrusoraAZona2 as number | null,
    extrusoraAZona3:
      datos.extrusoraAZona3 as number | null,
    extrusoraAZona4:
      datos.extrusoraAZona4 as number | null,
    extrusoraAZona5:
      datos.extrusoraAZona5 as number | null,

    extrusoraBZona1:
      datos.extrusoraBZona1 as number | null,
    extrusoraBZona2:
      datos.extrusoraBZona2 as number | null,
    extrusoraBZona3:
      datos.extrusoraBZona3 as number | null,
    extrusoraBZona4:
      datos.extrusoraBZona4 as number | null,
    extrusoraBZona5:
      datos.extrusoraBZona5 as number | null,

    acumuladorZona1:
      datos.acumuladorZona1 as number | null,
    acumuladorZona2:
      datos.acumuladorZona2 as number | null,
    acumuladorZona3:
      datos.acumuladorZona3 as number | null,
    acumuladorZona4:
      datos.acumuladorZona4 as number | null,
    acumuladorZona5:
      datos.acumuladorZona5 as number | null,
    acumuladorZona6:
      datos.acumuladorZona6 as number | null,

    presionAirePrincipal:
      datos.presionAirePrincipal as number | null,
    presionSoplo:
      datos.presionSoplo as number | null,
    presionPresoplo:
      datos.presionPresoplo as number | null,

    temperaturaAgua:
      datos.temperaturaAgua as number | null,
    temperaturaChiller:
      datos.temperaturaChiller as number | null,
    temperaturaMolde:
      datos.temperaturaMolde as number | null,

    presionHidraulica:
      datos.presionHidraulica as number | null,
    velocidadTornilloA:
      datos.velocidadTornilloA as number | null,
    velocidadTornilloB:
      datos.velocidadTornilloB as number | null,
    espesorParison:
      datos.espesorParison as number | null,
    pesoEnvase:
      datos.pesoEnvase as number | null,
    tiempoCicloSegundos:
      datos.tiempoCicloSegundos as number | null,

    observaciones:
      datos.observaciones as string | null,
  };
}

function construirControlProduccion(
  controlProduccion:
    | Record<string, unknown>
    | null
    | undefined,
) {
  if (!controlProduccion) {
    return null;
  }

  const observaciones = textoOpcional(
    controlProduccion.observaciones,
  );

  const tieneInformacion =
    limpiarTexto(controlProduccion.programado) !== "" ||
    limpiarTexto(controlProduccion.producido) !== "" ||
    limpiarTexto(controlProduccion.buenos) !== "" ||
    limpiarTexto(controlProduccion.horasProduccion) !== "" ||
    Boolean(observaciones);

  if (!tieneInformacion) {
    return null;
  }

  const programado = convertirEnteroNoNegativo(
    controlProduccion.programado,
    "La producción programada",
  );

  const producido = convertirEnteroNoNegativo(
    controlProduccion.producido,
    "La producción realizada",
  );

  const buenos = convertirEnteroNoNegativo(
    controlProduccion.buenos,
    "La producción buena",
  );

  const horasProduccion = convertirDecimalOpcional(
    controlProduccion.horasProduccion,
    "Las horas de producción",
  );

  if (buenos > producido) {
    throw new Error(
      "La cantidad de productos buenos no puede superar la cantidad producida.",
    );
  }

  const rechazados = producido - buenos;

  const eficiencia =
    programado > 0
      ? (buenos / programado) * 100
      : 0;

  const porcentajeRechazo =
    producido > 0
      ? (rechazados / producido) * 100
      : 0;

  const cumplimientoPrograma =
    programado > 0
      ? (producido / programado) * 100
      : 0;

  const produccionPorHora =
    horasProduccion && horasProduccion > 0
      ? buenos / horasProduccion
      : 0;

  return {
    programado,
    producido,
    buenos,
    rechazados,
    horasProduccion,
    produccionPorHora,
    eficiencia,
    porcentajeRechazo,
    cumplimientoPrograma,
    observaciones,
  };
}


function construirControlMolienda(
  controlMolienda:
    | Record<string, unknown>
    | null
    | undefined,
) {
  if (!controlMolienda) {
    return null;
  }

  const observaciones = textoOpcional(
    controlMolienda.observaciones,
  );

  const tieneInformacion =
    limpiarTexto(controlMolienda.pesoRecuperable) !== "" ||
    limpiarTexto(controlMolienda.pesoNoRecuperable) !== "" ||
    limpiarTexto(controlMolienda.pesoBarrido) !== "" ||
    Boolean(observaciones);

  if (!tieneInformacion) {
    return null;
  }

  const pesoRecuperable =
    convertirDecimalOpcional(
      controlMolienda.pesoRecuperable,
      "El peso de molienda recuperable",
    ) ?? 0;

  const pesoNoRecuperable =
    convertirDecimalOpcional(
      controlMolienda.pesoNoRecuperable,
      "El peso de molienda no recuperable",
    ) ?? 0;

  const pesoBarrido =
    convertirDecimalOpcional(
      controlMolienda.pesoBarrido,
      "El peso de barrido",
    ) ?? 0;

  const pesoTotal =
    pesoRecuperable +
    pesoNoRecuperable +
    pesoBarrido;

  return {
    pesoRecuperable,
    pesoNoRecuperable,
    pesoBarrido,
    pesoTotal,
    observaciones,
  };
}


type ConsumoMateriaPrimaEntrada = {
  productoId: string;
  cantidadInicial: number;
  cantidadConsumida: number;
  cantidadFinal: number;
  consumoEstandarEnvase: number | null;
  consumoRealEnvase: number;
  diferenciaConsumo: number;
  rendimiento: number;
  observaciones: string | null;
};

function construirConsumosMateriaPrima(
  valor: unknown,
  productosBuenos: number,
  pesoEnvaseKg: number,
) {
  if (valor === undefined || valor === null) {
    return [] as ConsumoMateriaPrimaEntrada[];
  }

  if (!Array.isArray(valor)) {
    throw new Error(
      "El consumo de materia prima debe enviarse como una lista.",
    );
  }

  const idsUsados = new Set<string>();
  const consumos: ConsumoMateriaPrimaEntrada[] = [];

  for (const [indice, fila] of valor.entries()) {
    if (
      typeof fila !== "object" ||
      fila === null ||
      Array.isArray(fila)
    ) {
      throw new Error(
        `La fila ${indice + 1} del consumo de materia prima no es válida.`,
      );
    }

    const datos = fila as Record<string, unknown>;
    const productoId = limpiarTexto(datos.productoId);

    if (!productoId) {
      continue;
    }

    if (idsUsados.has(productoId)) {
      throw new Error(
        "No puede registrar el mismo material más de una vez.",
      );
    }

    idsUsados.add(productoId);

    const cantidadInicial =
      convertirDecimalOpcional(
        datos.cantidadInicial,
        `La cantidad inicial de la fila ${indice + 1}`,
      ) ?? 0;

    const cantidadConsumida =
      convertirDecimalOpcional(
        datos.cantidadConsumida,
        `La cantidad consumida de la fila ${indice + 1}`,
      ) ?? 0;

    const consumoEstandarEnvase =
      convertirDecimalOpcional(
        datos.consumoEstandarEnvase,
        `El consumo estándar de la fila ${indice + 1}`,
      );

    if (cantidadConsumida > cantidadInicial) {
      throw new Error(
        `La cantidad consumida de la fila ${indice + 1} no puede superar la cantidad inicial.`,
      );
    }

    const cantidadFinal =
      cantidadInicial - cantidadConsumida;

    const consumoRealEnvase =
      productosBuenos > 0
        ? cantidadConsumida / productosBuenos
        : 0;

    const diferenciaConsumo =
      consumoEstandarEnvase !== null
        ? consumoRealEnvase - consumoEstandarEnvase
        : 0;

    const pesoProduccionBuena =
      productosBuenos * pesoEnvaseKg;

    const rendimiento =
      cantidadConsumida > 0
        ? (pesoProduccionBuena /
            cantidadConsumida) *
          100
        : 0;

    consumos.push({
      productoId,
      cantidadInicial,
      cantidadConsumida,
      cantidadFinal,
      consumoEstandarEnvase,
      consumoRealEnvase,
      diferenciaConsumo,
      rendimiento,
      observaciones: textoOpcional(
        datos.observaciones,
      ),
    });
  }

  return consumos;
}


const tiposParadaValidos = [
  "MECANICA",
  "ELECTRICA",
  "CALIDAD",
  "FALTA_MATERIAL",
  "CAMBIO_MOLDE",
  "AJUSTE_PROCESO",
  "OTRA",
] as const;

type TipoParadaValido =
  (typeof tiposParadaValidos)[number];

type ParadaMaquinaEntrada = {
  horaInicio: string;
  horaFin: string;
  minutos: number;
  tipo: TipoParadaValido;
  motivo: string;
  observaciones: string | null;
};

function convertirHoraAMinutos(hora: string) {
  const partes = hora.split(":");

  if (partes.length !== 2) {
    return null;
  }

  const horas = Number(partes[0]);
  const minutos = Number(partes[1]);

  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return null;
  }

  return horas * 60 + minutos;
}

function calcularMinutosParada(
  horaInicio: string,
  horaFin: string,
) {
  const inicio = convertirHoraAMinutos(horaInicio);
  const fin = convertirHoraAMinutos(horaFin);

  if (inicio === null || fin === null) {
    throw new Error(
      "La hora de inicio o fin de una parada no es válida.",
    );
  }

  if (fin >= inicio) {
    return fin - inicio;
  }

  return 24 * 60 - inicio + fin;
}

function construirParadasMaquina(valor: unknown) {
  if (valor === undefined || valor === null) {
    return [] as ParadaMaquinaEntrada[];
  }

  if (!Array.isArray(valor)) {
    throw new Error(
      "Las paradas de máquina deben enviarse como una lista.",
    );
  }

  const paradas: ParadaMaquinaEntrada[] = [];

  for (const [indice, fila] of valor.entries()) {
    if (
      typeof fila !== "object" ||
      fila === null ||
      Array.isArray(fila)
    ) {
      throw new Error(
        `La parada ${indice + 1} no tiene un formato válido.`,
      );
    }

    const datos = fila as Record<string, unknown>;

    const horaInicio = limpiarTexto(
      datos.horaInicio,
    );
    const horaFin = limpiarTexto(datos.horaFin);
    const tipo = limpiarTexto(datos.tipo);
    const motivo = limpiarTexto(datos.motivo);
    const observaciones = textoOpcional(
      datos.observaciones,
    );

    const tieneInformacion =
      horaInicio ||
      horaFin ||
      tipo ||
      motivo ||
      observaciones;

    if (!tieneInformacion) {
      continue;
    }

    if (!horaInicio || !horaFin) {
      throw new Error(
        `Complete la hora de inicio y fin de la parada ${indice + 1}.`,
      );
    }

    if (
      !tiposParadaValidos.includes(
        tipo as TipoParadaValido,
      )
    ) {
      throw new Error(
        `Seleccione una clasificación válida para la parada ${indice + 1}.`,
      );
    }

    if (!motivo) {
      throw new Error(
        `Digite el motivo de la parada ${indice + 1}.`,
      );
    }

    const minutos = calcularMinutosParada(
      horaInicio,
      horaFin,
    );

    if (minutos <= 0) {
      throw new Error(
        `La parada ${indice + 1} debe tener una duración mayor que cero.`,
      );
    }

    if (minutos > 24 * 60) {
      throw new Error(
        `La duración de la parada ${indice + 1} no es válida.`,
      );
    }

    paradas.push({
      horaInicio,
      horaFin,
      minutos,
      tipo: tipo as TipoParadaValido,
      motivo,
      observaciones,
    });
  }

  return paradas;
}

function serializarDecimales(
  modelo: Record<string, unknown> | null,
) {
  if (!modelo) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(modelo).map(([clave, valor]) => {
      if (
        valor !== null &&
        typeof valor === "object" &&
        "toString" in valor &&
        typeof valor.toString === "function"
      ) {
        return [clave, valor.toString()];
      }

      return [clave, valor];
    }),
  );
}

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
      },
    });

    if (!empresa) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "No existe una empresa activa.",
          registros: [],
        },
        {
          status: 404,
        },
      );
    }

    const registros =
      await prisma.registroProduccion.findMany({
        where: {
          empresaId: empresa.id,
        },
        orderBy: [
          {
            fechaProduccion: "desc",
          },
          {
            creadoEn: "desc",
          },
        ],
        take: 50,
        include: {
          planta: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          turno: {
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
          maquina: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          operador: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          productoProceso: {
            select: {
              id: true,
              codigo: true,
              codigoSap: true,
              nombre: true,
            },
          },
          productoTerminado: {
            select: {
              id: true,
              codigo: true,
              codigoSap: true,
              nombre: true,
            },
          },
          materialVirgen: {
            select: {
              id: true,
              codigo: true,
              codigoSap: true,
              nombre: true,
            },
          },
          materialMolido: {
            select: {
              id: true,
              codigo: true,
              codigoSap: true,
              nombre: true,
            },
          },
          colorProduccion: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          controlProceso: true,
          controlProduccion: true,
          controlMolienda: true,
          consumosMateriaPrima: {
            include: {
              producto: {
                select: {
                  id: true,
                  codigo: true,
                  codigoSap: true,
                  nombre: true,
                  tipoMateriaPrima: true,
                  unidadMedida: {
                    select: {
                      codigo: true,
                      nombre: true,
                      simbolo: true,
                    },
                  },
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

    return NextResponse.json({
      ok: true,
      registros: registros.map((registro) => ({
        ...registro,

        fechaProduccion:
          registro.fechaProduccion
            .toISOString()
            .split("T")[0],

        controlProceso: serializarDecimales(
          registro.controlProceso as unknown as Record<
            string,
            unknown
          >,
        ),

        controlProduccion: serializarDecimales(
          registro.controlProduccion as unknown as Record<
            string,
            unknown
          >,
        ),

        controlMolienda: serializarDecimales(
          registro.controlMolienda as unknown as Record<
            string,
            unknown
          >,
        ),

        consumosMateriaPrima:
          registro.consumosMateriaPrima.map(
            (consumo) => ({
              ...serializarDecimales(
                consumo as unknown as Record<
                  string,
                  unknown
                >,
              ),
              producto: consumo.producto,
            }),
          ),

        paradasMaquina:
          registro.paradasMaquina,
      })),
    });
  } catch (error) {
    console.error(
      "Error al consultar registros de producción:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No se pudieron consultar los registros de producción.",
        registros: [],
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CuerpoRegistroProduccion;

    const plantaId = limpiarTexto(body.plantaId);
    const turnoId = limpiarTexto(body.turnoId);

    const lineaProduccionId = limpiarTexto(
      body.lineaProduccionId,
    );

    const maquinaId = limpiarTexto(body.maquinaId);
    const operadorId = limpiarTexto(body.operadorId);

    const productoProcesoId = limpiarTexto(
      body.productoProcesoId,
    );

    const productoTerminadoId = limpiarTexto(
      body.productoTerminadoId,
    );

    const materialVirgenId = limpiarTexto(
      body.materialVirgenId,
    );

    const materialMolidoId = limpiarTexto(
      body.materialMolidoId,
    );

    const colorProduccionId = limpiarTexto(
      body.colorProduccionId,
    );

    const fechaTexto = limpiarTexto(
      body.fechaProduccion,
    );

    const ordenProduccion = limpiarTexto(
      body.ordenProduccion,
    ).toUpperCase();

    const colorOtro = textoOpcional(body.colorOtro);

    const observaciones = textoOpcional(
      body.observaciones,
    );

    if (
      !plantaId ||
      !turnoId ||
      !lineaProduccionId ||
      !maquinaId ||
      !operadorId ||
      !productoProcesoId ||
      !productoTerminadoId ||
      !materialVirgenId ||
      !colorProduccionId ||
      !fechaTexto ||
      !ordenProduccion
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Complete todos los datos generales obligatorios.",
        },
        {
          status: 400,
        },
      );
    }

    const fechaProduccion =
      crearFechaProduccion(fechaTexto);

    if (!fechaProduccion) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La fecha de producción no tiene un formato válido.",
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
          id: plantaId,
          empresaId: empresa.id,
          activo: true,
        },
      }),

      prisma.turno.findFirst({
        where: {
          id: turnoId,
          empresaId: empresa.id,
          activo: true,
        },
      }),

      prisma.lineaProduccion.findFirst({
        where: {
          id: lineaProduccionId,
          empresaId: empresa.id,
          activo: true,
        },
      }),

      prisma.maquina.findFirst({
        where: {
          id: maquinaId,
          empresaId: empresa.id,
          activo: true,
        },
      }),

      prisma.operador.findFirst({
        where: {
          id: operadorId,
          empresaId: empresa.id,
          activo: true,
        },
      }),

      prisma.producto.findFirst({
        where: {
          id: productoProcesoId,
          empresaId: empresa.id,
          tipo: "PRODUCTO_PROCESO",
          activo: true,
        },
      }),

      prisma.producto.findFirst({
        where: {
          id: productoTerminadoId,
          empresaId: empresa.id,
          tipo: "PRODUCTO_TERMINADO",
          activo: true,
        },
      }),

      prisma.producto.findFirst({
        where: {
          id: materialVirgenId,
          empresaId: empresa.id,
          tipo: "MATERIA_PRIMA",
          tipoMateriaPrima: "VIRGEN",
          activo: true,
        },
      }),

      materialMolidoId
        ? prisma.producto.findFirst({
            where: {
              id: materialMolidoId,
              empresaId: empresa.id,
              tipo: "MATERIA_PRIMA",
              tipoMateriaPrima: "MOLIDO",
              activo: true,
            },
          })
        : Promise.resolve(null),

      prisma.colorProduccion.findFirst({
        where: {
          id: colorProduccionId,
          empresaId: empresa.id,
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
            "Uno o más datos seleccionados ya no existen o están inactivos.",
        },
        {
          status: 400,
        },
      );
    }

    if (linea.plantaId !== planta.id) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La línea no pertenece a la planta seleccionada.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      maquina.plantaId !== planta.id ||
      maquina.lineaProduccionId !== linea.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La máquina no pertenece a la planta y línea seleccionadas.",
        },
        {
          status: 400,
        },
      );
    }

    if (materialMolidoId && !materialMolido) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "El material molido seleccionado no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (color.permiteOtro && !colorOtro) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Debe especificar el nombre del otro color.",
        },
        {
          status: 400,
        },
      );
    }

    const semana =
      obtenerNumeroSemanaISO(fechaProduccion);

    const mes =
      fechaProduccion.getUTCMonth() + 1;

    const anio =
      fechaProduccion.getUTCFullYear();

    const loteGenerado = generarLote(
      fechaProduccion,
      linea.codigo,
      turno.codigo,
    );

    const loteRecibido = limpiarTexto(body.lote);

    if (
      loteRecibido &&
      loteRecibido !== loteGenerado
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "El lote recibido no coincide con la fecha, línea y turno.",
        },
        {
          status: 400,
        },
      );
    }

    const controlProceso = construirControlProceso(
      body.controlProceso,
    );

    const controlProduccion =
      construirControlProduccion(
        body.controlProduccion,
      );

    const controlMolienda =
      construirControlMolienda(
        body.controlMolienda,
      );

    const productosBuenos =
      controlProduccion?.buenos ?? 0;

    const pesoEnvaseKg =
      controlProceso?.pesoEnvase ?? 0;

    const consumosMateriaPrima =
      construirConsumosMateriaPrima(
        body.consumosMateriaPrima,
        productosBuenos,
        pesoEnvaseKg,
      );

    const paradasMaquina =
      construirParadasMaquina(
        body.paradasMaquina,
      );

    if (consumosMateriaPrima.length > 0) {
      const productosConsumo =
        await prisma.producto.findMany({
          where: {
            empresaId: empresa.id,
            id: {
              in: consumosMateriaPrima.map(
                (consumo) => consumo.productoId,
              ),
            },
            tipo: "MATERIA_PRIMA",
            activo: true,
          },
          select: {
            id: true,
          },
        });

      if (
        productosConsumo.length !==
        consumosMateriaPrima.length
      ) {
        return NextResponse.json(
          {
            ok: false,
            mensaje:
              "Uno o más materiales del consumo no existen, están inactivos o no son materia prima.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const registro = await prisma.$transaction(
      async (tx) => {
        const nuevoRegistro =
          await tx.registroProduccion.create({
            data: {
              empresaId: empresa.id,
              plantaId: planta.id,
              turnoId: turno.id,
              lineaProduccionId: linea.id,
              maquinaId: maquina.id,
              operadorId: operador.id,

              productoProcesoId:
                productoProceso.id,

              productoTerminadoId:
                productoTerminado.id,

              materialVirgenId:
                materialVirgen.id,

              materialMolidoId:
                materialMolido?.id ?? null,

              colorProduccionId: color.id,

              fechaProduccion,
              semana,
              mes,
              anio,

              lote: loteGenerado,
              ordenProduccion,

              colorOtro: color.permiteOtro
                ? colorOtro
                : null,

              observaciones,
              estado: "BORRADOR",
            },
          });

        if (controlProceso) {
          await tx.controlProceso.create({
            data: {
              registroProduccionId:
                nuevoRegistro.id,

              ...controlProceso,
            },
          });
        }

        if (controlProduccion) {
          await tx.controlProduccion.create({
            data: {
              registroProduccionId:
                nuevoRegistro.id,

              ...controlProduccion,
            },
          });
        }

        if (controlMolienda) {
          await tx.controlMolienda.create({
            data: {
              registroProduccionId:
                nuevoRegistro.id,

              ...controlMolienda,
            },
          });
        }

        if (consumosMateriaPrima.length > 0) {
          await tx.consumoMateriaPrima.createMany({
            data: consumosMateriaPrima.map(
              (consumo) => ({
                registroProduccionId:
                  nuevoRegistro.id,
                productoId: consumo.productoId,
                cantidadInicial:
                  consumo.cantidadInicial,
                cantidadConsumida:
                  consumo.cantidadConsumida,
                cantidadFinal:
                  consumo.cantidadFinal,
                consumoEstandarEnvase:
                  consumo.consumoEstandarEnvase,
                consumoRealEnvase:
                  consumo.consumoRealEnvase,
                diferenciaConsumo:
                  consumo.diferenciaConsumo,
                rendimiento:
                  consumo.rendimiento,
                observaciones:
                  consumo.observaciones,
              }),
            ),
          });
        }

        if (paradasMaquina.length > 0) {
          await tx.paradaMaquina.createMany({
            data: paradasMaquina.map(
              (parada) => ({
                registroProduccionId:
                  nuevoRegistro.id,
                horaInicio:
                  parada.horaInicio,
                horaFin:
                  parada.horaFin,
                minutos:
                  parada.minutos,
                tipo:
                  parada.tipo,
                motivo:
                  parada.motivo,
                observaciones:
                  parada.observaciones,
              }),
            ),
          });
        }

        return tx.registroProduccion.findUnique({
          where: {
            id: nuevoRegistro.id,
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
                producto: true,
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
      },
    );

    return NextResponse.json(
      {
        ok: true,
        mensaje:
          "Registro de producción guardado correctamente.",
        registro,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Error al guardar el registro de producción:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el registro de producción.",
      },
      {
        status: 500,
      },
    );
  }
}