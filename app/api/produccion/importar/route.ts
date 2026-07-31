import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FilaProduccion = {
  numeroFila: number;
  fecha: Date;
  turno: string;
  linea: string;
  maquina: string;
  operador: string;
  ordenProduccion: string;
  lote: string;
  productoProceso: string;
  productoTerminado: string;
  materialVirgen: string;
  materialMolido: string | null;
  color: string;
  programado: number;
  producido: number;
  buenos: number;
  rechazados: number;
  horasProduccion: number;
};

type FilaMolienda = {
  lote: string;
  pesoRecuperable: number;
  pesoNoRecuperable: number;
  pesoBarrido: number;
};

type FilaConsumo = {
  lote: string;
  codigoMaterial: string;
  cantidadInicial: number;
  cantidadConsumida: number;
  consumoEstandarEnvase: number | null;
};

type FilaParada = {
  lote: string;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  motivo: string;
  observaciones: string | null;
};

type ErrorImportacion = {
  hoja: string;
  fila: number;
  mensaje: string;
};

const tiposParadaValidos = new Set([
  "MECANICA",
  "ELECTRICA",
  "CALIDAD",
  "FALTA_MATERIAL",
  "CAMBIO_MOLDE",
  "AJUSTE_PROCESO",
  "OTRA",
]);

function texto(valor: unknown) {
  if (valor === null || valor === undefined) {
    return "";
  }

  if (
    typeof valor === "object" &&
    "text" in valor &&
    typeof valor.text === "string"
  ) {
    return valor.text.trim();
  }

  return String(valor).trim();
}

function numero(
  valor: unknown,
  campo: string,
  hoja: string,
  fila: number,
  errores: ErrorImportacion[],
  obligatorio = true,
) {
  const limpio = texto(valor).replace(",", ".");

  if (!limpio) {
    if (obligatorio) {
      errores.push({
        hoja,
        fila,
        mensaje: `${campo} es obligatorio.`,
      });
    }

    return 0;
  }

  const convertido = Number(limpio);

  if (!Number.isFinite(convertido) || convertido < 0) {
    errores.push({
      hoja,
      fila,
      mensaje: `${campo} debe ser un número válido mayor o igual que cero.`,
    });

    return 0;
  }

  return convertido;
}

function entero(
  valor: unknown,
  campo: string,
  hoja: string,
  fila: number,
  errores: ErrorImportacion[],
) {
  const convertido = numero(
    valor,
    campo,
    hoja,
    fila,
    errores,
  );

  if (!Number.isInteger(convertido)) {
    errores.push({
      hoja,
      fila,
      mensaje: `${campo} debe ser un número entero.`,
    });
  }

  return Math.trunc(convertido);
}

function fechaExcel(
  valor: unknown,
  hoja: string,
  fila: number,
  errores: ErrorImportacion[],
) {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return new Date(
      Date.UTC(
        valor.getFullYear(),
        valor.getMonth(),
        valor.getDate(),
        12,
      ),
    );
  }

  const limpio = texto(valor);

  const coincidencia = limpio.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!coincidencia) {
    errores.push({
      hoja,
      fila,
      mensaje:
        "fecha debe tener el formato YYYY-MM-DD.",
    });

    return new Date(0);
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);

  const fecha = new Date(
    Date.UTC(anio, mes - 1, dia, 12),
  );

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    errores.push({
      hoja,
      fila,
      mensaje: "fecha no es válida.",
    });
  }

  return fecha;
}

function obtenerSemanaISO(fecha: Date) {
  const temporal = new Date(
    Date.UTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate(),
    ),
  );

  const dia = temporal.getUTCDay() || 7;
  temporal.setUTCDate(
    temporal.getUTCDate() + 4 - dia,
  );

  const inicio = new Date(
    Date.UTC(temporal.getUTCFullYear(), 0, 1),
  );

  return Math.ceil(
    ((temporal.getTime() - inicio.getTime()) /
      86_400_000 +
      1) /
      7,
  );
}

function minutosHora(hora: string) {
  const coincidencia = hora.match(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
  );

  if (!coincidencia) {
    return null;
  }

  return (
    Number(coincidencia[1]) * 60 +
    Number(coincidencia[2])
  );
}

function calcularMinutos(
  inicio: string,
  fin: string,
) {
  const inicioMinutos = minutosHora(inicio);
  const finMinutos = minutosHora(fin);

  if (
    inicioMinutos === null ||
    finMinutos === null
  ) {
    return null;
  }

  return finMinutos >= inicioMinutos
    ? finMinutos - inicioMinutos
    : 24 * 60 - inicioMinutos + finMinutos;
}

function obtenerFilasHoja(
  libro: XLSX.WorkBook,
  nombre: string,
  columnasRequeridas: string[],
  errores: ErrorImportacion[],
) {
  const hoja = libro.Sheets[nombre];

  if (!hoja) {
    errores.push({
      hoja: nombre,
      fila: 0,
      mensaje: `No existe la hoja ${nombre}.`,
    });

    return [] as Record<string, unknown>[];
  }

  const filas = XLSX.utils.sheet_to_json<
    Record<string, unknown>
  >(hoja, {
    range: 2,
    defval: "",
    raw: true,
  });

  const encabezadosEncontrados =
    filas.length > 0
      ? new Set(Object.keys(filas[0]))
      : new Set<string>();

  if (filas.length === 0) {
    const matriz = XLSX.utils.sheet_to_json<
      unknown[]
    >(hoja, {
      header: 1,
      range: 2,
      defval: "",
      raw: true,
    });

    const primeraFila = matriz[0] ?? [];

    for (const valor of primeraFila) {
      const nombreColumna = texto(valor);

      if (nombreColumna) {
        encabezadosEncontrados.add(nombreColumna);
      }
    }
  }

  for (const columna of columnasRequeridas) {
    if (!encabezadosEncontrados.has(columna)) {
      errores.push({
        hoja: nombre,
        fila: 3,
        mensaje: `Falta la columna ${columna}.`,
      });
    }
  }

  return filas;
}

async function analizarExcel(archivo: File) {
  const errores: ErrorImportacion[] = [];

  if (
    !archivo.name.toLowerCase().endsWith(".xlsx")
  ) {
    return {
      errores: [
        {
          hoja: "ARCHIVO",
          fila: 0,
          mensaje:
            "Seleccione un archivo Excel con extensión .xlsx.",
        },
      ],
      producciones: [] as FilaProduccion[],
      moliendas: [] as FilaMolienda[],
      consumos: [] as FilaConsumo[],
      paradas: [] as FilaParada[],
    };
  }

  const contenido = await archivo.arrayBuffer();

  const libro = XLSX.read(contenido, {
    type: "array",
    cellDates: true,
    dense: false,
  });

  const filasProduccion = obtenerFilasHoja(
    libro,
    "PRODUCCION",
    [
      "fecha",
      "turno",
      "linea",
      "maquina",
      "operador",
      "ordenProduccion",
      "lote",
      "productoProceso",
      "productoTerminado",
      "materialVirgen",
      "materialMolido",
      "color",
      "programado",
      "producido",
      "buenos",
      "rechazados",
      "horasProduccion",
    ],
    errores,
  );

  const filasMolienda = obtenerFilasHoja(
    libro,
    "MOLIENDA",
    [
      "lote",
      "pesoRecuperable",
      "pesoNoRecuperable",
      "pesoBarrido",
    ],
    errores,
  );

  const filasConsumo = obtenerFilasHoja(
    libro,
    "CONSUMO_MATERIA_PRIMA",
    [
      "lote",
      "codigoMaterial",
      "cantidadInicial",
      "cantidadConsumida",
      "consumoEstandarEnvase",
    ],
    errores,
  );

  const filasParadas = obtenerFilasHoja(
    libro,
    "PARADAS",
    [
      "lote",
      "horaInicio",
      "horaFin",
      "tipo",
      "motivo",
      "observaciones",
    ],
    errores,
  );

  const producciones: FilaProduccion[] = [];

  for (
    let indice = 0;
    indice < filasProduccion.length;
    indice += 1
  ) {
    const datos = filasProduccion[indice];
    const numeroFila = indice + 4;
    const lote = texto(datos.lote);

    if (!lote) {
      continue;
    }

    const programado = entero(
      datos.programado,
      "programado",
      "PRODUCCION",
      numeroFila,
      errores,
    );

    const producido = entero(
      datos.producido,
      "producido",
      "PRODUCCION",
      numeroFila,
      errores,
    );

    const buenos = entero(
      datos.buenos,
      "buenos",
      "PRODUCCION",
      numeroFila,
      errores,
    );

    const rechazados = entero(
      datos.rechazados,
      "rechazados",
      "PRODUCCION",
      numeroFila,
      errores,
    );

    if (buenos + rechazados !== producido) {
      errores.push({
        hoja: "PRODUCCION",
        fila: numeroFila,
        mensaje:
          "buenos + rechazados debe ser igual a producido.",
      });
    }

    producciones.push({
      numeroFila,
      fecha: fechaExcel(
        datos.fecha,
        "PRODUCCION",
        numeroFila,
        errores,
      ),
      turno: texto(datos.turno).toUpperCase(),
      linea: texto(datos.linea).toUpperCase(),
      maquina: texto(datos.maquina).toUpperCase(),
      operador: texto(datos.operador).toUpperCase(),
      ordenProduccion: texto(
        datos.ordenProduccion,
      ).toUpperCase(),
      lote,
      productoProceso: texto(
        datos.productoProceso,
      ).toUpperCase(),
      productoTerminado: texto(
        datos.productoTerminado,
      ).toUpperCase(),
      materialVirgen: texto(
        datos.materialVirgen,
      ).toUpperCase(),
      materialMolido:
        texto(datos.materialMolido).toUpperCase() ||
        null,
      color: texto(datos.color).toUpperCase(),
      programado,
      producido,
      buenos,
      rechazados,
      horasProduccion: numero(
        datos.horasProduccion,
        "horasProduccion",
        "PRODUCCION",
        numeroFila,
        errores,
      ),
    });
  }

  const moliendas: FilaMolienda[] = [];

  for (
    let indice = 0;
    indice < filasMolienda.length;
    indice += 1
  ) {
    const datos = filasMolienda[indice];
    const numeroFila = indice + 4;
    const lote = texto(datos.lote);

    if (!lote) {
      continue;
    }

    moliendas.push({
      lote,
      pesoRecuperable: numero(
        datos.pesoRecuperable,
        "pesoRecuperable",
        "MOLIENDA",
        numeroFila,
        errores,
      ),
      pesoNoRecuperable: numero(
        datos.pesoNoRecuperable,
        "pesoNoRecuperable",
        "MOLIENDA",
        numeroFila,
        errores,
      ),
      pesoBarrido: numero(
        datos.pesoBarrido,
        "pesoBarrido",
        "MOLIENDA",
        numeroFila,
        errores,
      ),
    });
  }

  const consumos: FilaConsumo[] = [];

  for (
    let indice = 0;
    indice < filasConsumo.length;
    indice += 1
  ) {
    const datos = filasConsumo[indice];
    const numeroFila = indice + 4;
    const lote = texto(datos.lote);

    if (!lote) {
      continue;
    }

    const inicial = numero(
      datos.cantidadInicial,
      "cantidadInicial",
      "CONSUMO_MATERIA_PRIMA",
      numeroFila,
      errores,
    );

    const consumida = numero(
      datos.cantidadConsumida,
      "cantidadConsumida",
      "CONSUMO_MATERIA_PRIMA",
      numeroFila,
      errores,
    );

    if (consumida > inicial) {
      errores.push({
        hoja: "CONSUMO_MATERIA_PRIMA",
        fila: numeroFila,
        mensaje:
          "cantidadConsumida no puede superar cantidadInicial.",
      });
    }

    const estandarTexto = texto(
      datos.consumoEstandarEnvase,
    );

    consumos.push({
      lote,
      codigoMaterial: texto(
        datos.codigoMaterial,
      ).toUpperCase(),
      cantidadInicial: inicial,
      cantidadConsumida: consumida,
      consumoEstandarEnvase: estandarTexto
        ? numero(
            estandarTexto,
            "consumoEstandarEnvase",
            "CONSUMO_MATERIA_PRIMA",
            numeroFila,
            errores,
          )
        : null,
    });
  }

  const paradas: FilaParada[] = [];

  for (
    let indice = 0;
    indice < filasParadas.length;
    indice += 1
  ) {
    const datos = filasParadas[indice];
    const numeroFila = indice + 4;
    const lote = texto(datos.lote);

    if (!lote) {
      continue;
    }

    const horaInicio = texto(datos.horaInicio);
    const horaFin = texto(datos.horaFin);
    const tipo = texto(datos.tipo).toUpperCase();

    const duracion = calcularMinutos(
      horaInicio,
      horaFin,
    );

    if (duracion === null || duracion <= 0) {
      errores.push({
        hoja: "PARADAS",
        fila: numeroFila,
        mensaje:
          "horaInicio y horaFin deben formar una duración válida.",
      });
    }

    if (!tiposParadaValidos.has(tipo)) {
      errores.push({
        hoja: "PARADAS",
        fila: numeroFila,
        mensaje: `tipo ${tipo} no es válido.`,
      });
    }

    paradas.push({
      lote,
      horaInicio,
      horaFin,
      tipo,
      motivo: texto(datos.motivo),
      observaciones:
        texto(datos.observaciones) || null,
    });
  }

  const lotes = new Set(
    producciones.map(
      (produccion) => produccion.lote,
    ),
  );

  for (const molienda of moliendas) {
    if (!lotes.has(molienda.lote)) {
      errores.push({
        hoja: "MOLIENDA",
        fila: 0,
        mensaje: `El lote ${molienda.lote} no existe en PRODUCCION.`,
      });
    }
  }

  for (const consumo of consumos) {
    if (!lotes.has(consumo.lote)) {
      errores.push({
        hoja: "CONSUMO_MATERIA_PRIMA",
        fila: 0,
        mensaje: `El lote ${consumo.lote} no existe en PRODUCCION.`,
      });
    }
  }

  for (const parada of paradas) {
    if (!lotes.has(parada.lote)) {
      errores.push({
        hoja: "PARADAS",
        fila: 0,
        mensaje: `El lote ${parada.lote} no existe en PRODUCCION.`,
      });
    }
  }

  return {
    errores,
    producciones,
    moliendas,
    consumos,
    paradas,
  };
}

function mapaPorCodigo<
  T extends {
    codigo: string;
    codigoSap?: string | null;
  },
>(elementos: T[]) {
  const mapa = new Map<string, T>();

  for (const elemento of elementos) {
    mapa.set(
      elemento.codigo.trim().toUpperCase(),
      elemento,
    );

    if (elemento.codigoSap) {
      mapa.set(
        elemento.codigoSap.trim().toUpperCase(),
        elemento,
      );
    }
  }

  return mapa;
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const modo = url.searchParams.get("modo") ?? "validar";

    const formulario = await request.formData();
    const archivo = formulario.get("archivo");

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Seleccione un archivo Excel.",
        },
        {
          status: 400,
        },
      );
    }

    const analisis = await analizarExcel(archivo);

    const empresa = await prisma.empresa.findFirst({
      where: {
        activo: true,
      },
      orderBy: {
        creadoEn: "asc",
      },
      include: {
        plantas: {
          where: {
            activo: true,
          },
          orderBy: {
            creadoEn: "asc",
          },
        },
      },
    });

    if (!empresa || empresa.plantas.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Debe existir una empresa y una planta activa.",
        },
        {
          status: 400,
        },
      );
    }

    const [
      turnos,
      lineas,
      maquinas,
      operadores,
      productos,
      colores,
    ] = await Promise.all([
      prisma.turno.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
      }),
      prisma.lineaProduccion.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
      }),
      prisma.maquina.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
      }),
      prisma.operador.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
      }),
      prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
      }),
      prisma.colorProduccion.findMany({
        where: {
          empresaId: empresa.id,
          activo: true,
        },
      }),
    ]);

    const mapaTurnos = new Map<string, (typeof turnos)[number]>();

    for (const turno of turnos) {
      mapaTurnos.set(
        turno.codigo.toUpperCase(),
        turno,
      );
      mapaTurnos.set(
        turno.nombre.toUpperCase(),
        turno,
      );

      if (
        turno.nombre.toUpperCase().includes("DÍA") ||
        turno.nombre.toUpperCase().includes("DIA")
      ) {
        mapaTurnos.set("DIA", turno);
      }

      if (
        turno.nombre.toUpperCase().includes("NOCHE")
      ) {
        mapaTurnos.set("NOCHE", turno);
      }
    }

    const mapaLineas = mapaPorCodigo(lineas);
    const mapaMaquinas = mapaPorCodigo(maquinas);
    const mapaOperadores = mapaPorCodigo(operadores);
    const mapaProductos = mapaPorCodigo(productos);
    const mapaColores = new Map<
      string,
      (typeof colores)[number]
    >();

    for (const color of colores) {
      mapaColores.set(
        color.codigo.toUpperCase(),
        color,
      );
      mapaColores.set(
        color.nombre.toUpperCase(),
        color,
      );
    }

    for (const produccion of analisis.producciones) {
      const fila = produccion.numeroFila;

      if (!mapaTurnos.has(produccion.turno)) {
        analisis.errores.push({
          hoja: "PRODUCCION",
          fila,
          mensaje: `No existe el turno ${produccion.turno}.`,
        });
      }

      if (!mapaLineas.has(produccion.linea)) {
        analisis.errores.push({
          hoja: "PRODUCCION",
          fila,
          mensaje: `No existe la línea ${produccion.linea}.`,
        });
      }

      if (!mapaMaquinas.has(produccion.maquina)) {
        analisis.errores.push({
          hoja: "PRODUCCION",
          fila,
          mensaje: `No existe la máquina ${produccion.maquina}.`,
        });
      }

      if (!mapaOperadores.has(produccion.operador)) {
        analisis.errores.push({
          hoja: "PRODUCCION",
          fila,
          mensaje: `No existe el operador ${produccion.operador}.`,
        });
      }

      for (const codigo of [
        produccion.productoProceso,
        produccion.productoTerminado,
        produccion.materialVirgen,
      ]) {
        if (!mapaProductos.has(codigo)) {
          analisis.errores.push({
            hoja: "PRODUCCION",
            fila,
            mensaje: `No existe el producto o material ${codigo}.`,
          });
        }
      }

      if (
        produccion.materialMolido &&
        !mapaProductos.has(
          produccion.materialMolido,
        )
      ) {
        analisis.errores.push({
          hoja: "PRODUCCION",
          fila,
          mensaje: `No existe el material ${produccion.materialMolido}.`,
        });
      }

      if (!mapaColores.has(produccion.color)) {
        analisis.errores.push({
          hoja: "PRODUCCION",
          fila,
          mensaje: `No existe el color ${produccion.color}.`,
        });
      }
    }

    for (const consumo of analisis.consumos) {
      if (
        !mapaProductos.has(
          consumo.codigoMaterial,
        )
      ) {
        analisis.errores.push({
          hoja: "CONSUMO_MATERIA_PRIMA",
          fila: 0,
          mensaje: `No existe el material ${consumo.codigoMaterial}.`,
        });
      }
    }

    const lotesArchivo =
      analisis.producciones.map(
        (produccion) => produccion.lote,
      );

    const lotesDuplicadosArchivo =
      lotesArchivo.filter(
        (lote, indice) =>
          lotesArchivo.indexOf(lote) !== indice,
      );

    for (const lote of new Set(lotesDuplicadosArchivo)) {
      analisis.errores.push({
        hoja: "PRODUCCION",
        fila: 0,
        mensaje: `El lote ${lote} está duplicado en el archivo.`,
      });
    }

    const existentes =
      await prisma.registroProduccion.findMany({
        where: {
          empresaId: empresa.id,
          lote: {
            in: lotesArchivo,
          },
        },
        select: {
          lote: true,
        },
      });

    for (const existente of existentes) {
      analisis.errores.push({
        hoja: "PRODUCCION",
        fila: 0,
        mensaje: `El lote ${existente.lote} ya existe en el sistema.`,
      });
    }

    const resumen = {
      producciones:
        analisis.producciones.length,
      moliendas: analisis.moliendas.length,
      consumos: analisis.consumos.length,
      paradas: analisis.paradas.length,
      errores: analisis.errores.length,
    };

    if (
      modo === "validar" ||
      analisis.errores.length > 0
    ) {
      return NextResponse.json({
        ok: analisis.errores.length === 0,
        valido: analisis.errores.length === 0,
        mensaje:
          analisis.errores.length === 0
            ? "El archivo está listo para importar."
            : "El archivo contiene errores que deben corregirse.",
        archivo: archivo.name,
        resumen,
        errores: analisis.errores.slice(0, 150),
      });
    }

    if (modo !== "importar") {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Modo de operación no válido.",
        },
        {
          status: 400,
        },
      );
    }

    const planta = empresa.plantas[0];

    const moliendaPorLote = new Map(
      analisis.moliendas.map(
        (molienda) => [
          molienda.lote,
          molienda,
        ],
      ),
    );

    const consumosPorLote = new Map<
      string,
      FilaConsumo[]
    >();

    for (const consumo of analisis.consumos) {
      const lista =
        consumosPorLote.get(consumo.lote) ?? [];
      lista.push(consumo);
      consumosPorLote.set(consumo.lote, lista);
    }

    const paradasPorLote = new Map<
      string,
      FilaParada[]
    >();

    for (const parada of analisis.paradas) {
      const lista =
        paradasPorLote.get(parada.lote) ?? [];
      lista.push(parada);
      paradasPorLote.set(parada.lote, lista);
    }

    const TAMANO_LOTE = 25;
    let importados = 0;

    for (
      let inicio = 0;
      inicio < analisis.producciones.length;
      inicio += TAMANO_LOTE
    ) {
      const bloque =
        analisis.producciones.slice(
          inicio,
          inicio + TAMANO_LOTE,
        );

      await prisma.$transaction(
        async (tx) => {
          for (const produccion of bloque) {
            const turno =
              mapaTurnos.get(produccion.turno)!;
            const linea =
              mapaLineas.get(produccion.linea)!;
            const maquina =
              mapaMaquinas.get(
                produccion.maquina,
              )!;
            const operador =
              mapaOperadores.get(
                produccion.operador,
              )!;
            const productoProceso =
              mapaProductos.get(
                produccion.productoProceso,
              )!;
            const productoTerminado =
              mapaProductos.get(
                produccion.productoTerminado,
              )!;
            const materialVirgen =
              mapaProductos.get(
                produccion.materialVirgen,
              )!;
            const materialMolido =
              produccion.materialMolido
                ? mapaProductos.get(
                    produccion.materialMolido,
                  )!
                : null;
            const color =
              mapaColores.get(produccion.color)!;

            const registro =
              await tx.registroProduccion.create({
                data: {
                  empresaId: empresa.id,
                  plantaId: planta.id,
                  turnoId: turno.id,
                  lineaProduccionId:
                    linea.id,
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
                  colorProduccionId:
                    color.id,
                  fechaProduccion:
                    produccion.fecha,
                  semana:
                    obtenerSemanaISO(
                      produccion.fecha,
                    ),
                  mes:
                    produccion.fecha.getUTCMonth() +
                    1,
                  anio:
                    produccion.fecha.getUTCFullYear(),
                  lote: produccion.lote,
                  ordenProduccion:
                    produccion.ordenProduccion,
                  estado: "FINALIZADO",
                  esSimulacion: true,
                  archivoImportado:
                    archivo.name,
                  importadoEn: new Date(),
                },
              });

            const eficiencia =
              produccion.programado > 0
                ? (produccion.buenos /
                    produccion.programado) *
                  100
                : 0;

            const porcentajeRechazo =
              produccion.producido > 0
                ? (produccion.rechazados /
                    produccion.producido) *
                  100
                : 0;

            const cumplimiento =
              produccion.programado > 0
                ? (produccion.producido /
                    produccion.programado) *
                  100
                : 0;

            await tx.controlProduccion.create({
              data: {
                registroProduccionId:
                  registro.id,
                programado:
                  produccion.programado,
                producido:
                  produccion.producido,
                buenos: produccion.buenos,
                rechazados:
                  produccion.rechazados,
                horasProduccion:
                  produccion.horasProduccion,
                produccionPorHora:
                  produccion.horasProduccion > 0
                    ? produccion.buenos /
                      produccion.horasProduccion
                    : 0,
                eficiencia,
                porcentajeRechazo,
                cumplimientoPrograma:
                  cumplimiento,
              },
            });

            const molienda =
              moliendaPorLote.get(
                produccion.lote,
              );

            if (molienda) {
              await tx.controlMolienda.create({
                data: {
                  registroProduccionId:
                    registro.id,
                  pesoRecuperable:
                    molienda.pesoRecuperable,
                  pesoNoRecuperable:
                    molienda.pesoNoRecuperable,
                  pesoBarrido:
                    molienda.pesoBarrido,
                  pesoTotal:
                    molienda.pesoRecuperable +
                    molienda.pesoNoRecuperable +
                    molienda.pesoBarrido,
                },
              });
            }

            const consumos =
              consumosPorLote.get(
                produccion.lote,
              ) ?? [];

            if (consumos.length > 0) {
              await tx.consumoMateriaPrima.createMany({
                data: consumos.map((consumo) => {
                  const producto =
                    mapaProductos.get(
                      consumo.codigoMaterial,
                    )!;

                  const cantidadFinal =
                    consumo.cantidadInicial -
                    consumo.cantidadConsumida;

                  const consumoReal =
                    produccion.buenos > 0
                      ? consumo.cantidadConsumida /
                        produccion.buenos
                      : 0;

                  const diferencia =
                    consumo.consumoEstandarEnvase !==
                    null
                      ? consumoReal -
                        consumo.consumoEstandarEnvase
                      : 0;

                  const pesoUnitario = Number(
                    producto.pesoUnitario ?? 0,
                  );

                  const rendimiento =
                    consumo.cantidadConsumida > 0
                      ? ((produccion.buenos *
                          pesoUnitario) /
                          consumo.cantidadConsumida) *
                        100
                      : 0;

                  return {
                    registroProduccionId:
                      registro.id,
                    productoId: producto.id,
                    cantidadInicial:
                      consumo.cantidadInicial,
                    cantidadConsumida:
                      consumo.cantidadConsumida,
                    cantidadFinal,
                    consumoEstandarEnvase:
                      consumo.consumoEstandarEnvase,
                    consumoRealEnvase:
                      consumoReal,
                    diferenciaConsumo:
                      diferencia,
                    rendimiento,
                  };
                }),
              });
            }

            const paradas =
              paradasPorLote.get(
                produccion.lote,
              ) ?? [];

            if (paradas.length > 0) {
              await tx.paradaMaquina.createMany({
                data: paradas.map((parada) => ({
                  registroProduccionId:
                    registro.id,
                  horaInicio:
                    parada.horaInicio,
                  horaFin: parada.horaFin,
                  minutos:
                    calcularMinutos(
                      parada.horaInicio,
                      parada.horaFin,
                    ) ?? 0,
                  tipo: parada.tipo as
                    | "MECANICA"
                    | "ELECTRICA"
                    | "CALIDAD"
                    | "FALTA_MATERIAL"
                    | "CAMBIO_MOLDE"
                    | "AJUSTE_PROCESO"
                    | "OTRA",
                  motivo: parada.motivo,
                  observaciones:
                    parada.observaciones,
                })),
              });
            }

            importados += 1;
          }
        },
        {
          maxWait: 20_000,
          timeout: 60_000,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      valido: true,
      mensaje: `${importados} registros simulados fueron importados correctamente.`,
      archivo: archivo.name,
      resumen: {
        ...resumen,
        importados,
      },
      errores: [],
    });
  } catch (error) {
    console.error(
      "Error al importar producción:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo procesar el archivo Excel.",
      },
      {
        status: 500,
      },
    );
  }
}