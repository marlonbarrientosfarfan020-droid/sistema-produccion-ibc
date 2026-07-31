import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function limpiarTexto(valor: string | null) {
  return String(valor ?? "").trim();
}

function convertirFechaInicio(valor: string | null) {
  const texto = limpiarTexto(valor);

  if (!texto) {
    return null;
  }

  const fecha = new Date(`${texto}T00:00:00.000Z`);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function convertirFechaFin(valor: string | null) {
  const texto = limpiarTexto(valor);

  if (!texto) {
    return null;
  }

  const fecha = new Date(`${texto}T23:59:59.999Z`);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function fechaIso(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

function fechaHaceDias(dias: number) {
  const fecha = new Date();
  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCDate(fecha.getUTCDate() - dias);

  return fecha;
}

function numero(valor: unknown) {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function recortar(texto: string, maximo: number) {
  return texto.length > maximo
    ? `${texto.slice(0, maximo - 1)}…`
    : texto;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const alcance =
      limpiarTexto(url.searchParams.get("alcance")) || "filtros";

    const exportarTodo = alcance === "todo";

    const fechaDesde = exportarTodo
      ? null
      : convertirFechaInicio(
          url.searchParams.get("fechaDesde"),
        ) ?? fechaHaceDias(29);

    const fechaHasta = exportarTodo
      ? null
      : convertirFechaFin(
          url.searchParams.get("fechaHasta"),
        ) ?? new Date();

    const turnoId = limpiarTexto(
      url.searchParams.get("turnoId"),
    );

    const lineaProduccionId = limpiarTexto(
      url.searchParams.get("lineaId"),
    );

    const maquinaId = limpiarTexto(
      url.searchParams.get("maquinaId"),
    );

    const operadorId = limpiarTexto(
      url.searchParams.get("operadorId"),
    );

    const productoTerminadoId = limpiarTexto(
      url.searchParams.get("productoId"),
    );

    const tipoDatos = limpiarTexto(
      url.searchParams.get("tipoDatos"),
    ).toLowerCase() || "todos";

    const filtroSimulacion =
      tipoDatos === "reales"
        ? { esSimulacion: false }
        : tipoDatos === "simulados"
          ? { esSimulacion: true }
          : {};

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

    const empresaActiva = empresa;

    const registros =
      await prisma.registroProduccion.findMany({
        where: {
          empresaId: empresaActiva.id,
          estado: {
            not: "ANULADO",
          },
          ...filtroSimulacion,
          ...(!exportarTodo && fechaDesde && fechaHasta
            ? {
                fechaProduccion: {
                  gte: fechaDesde,
                  lte: fechaHasta,
                },
              }
            : {}),
          ...(!exportarTodo && turnoId
            ? {
                turnoId,
              }
            : {}),
          ...(!exportarTodo && lineaProduccionId
            ? {
                lineaProduccionId,
              }
            : {}),
          ...(!exportarTodo && maquinaId
            ? {
                maquinaId,
              }
            : {}),
          ...(!exportarTodo && operadorId
            ? {
                operadorId,
              }
            : {}),
          ...(!exportarTodo && productoTerminadoId
            ? {
                productoTerminadoId,
              }
            : {}),
        },
        orderBy: [
          {
            fechaProduccion: "asc",
          },
          {
            creadoEn: "asc",
          },
        ],
        include: {
          turno: true,
          lineaProduccion: true,
          maquina: true,
          operador: true,
          productoTerminado: true,
          controlProduccion: true,
          controlMolienda: true,
          paradasMaquina: true,
          consumosMateriaPrima: true,
        },
      });

    const programado = registros.reduce(
      (total, registro) =>
        total +
        (registro.controlProduccion?.programado ?? 0),
      0,
    );

    const producido = registros.reduce(
      (total, registro) =>
        total +
        (registro.controlProduccion?.producido ?? 0),
      0,
    );

    const buenos = registros.reduce(
      (total, registro) =>
        total +
        (registro.controlProduccion?.buenos ?? 0),
      0,
    );

    const rechazados = registros.reduce(
      (total, registro) =>
        total +
        (registro.controlProduccion?.rechazados ?? 0),
      0,
    );

    const minutosParada = registros.reduce(
      (total, registro) =>
        total +
        registro.paradasMaquina.reduce(
          (subtotal, parada) =>
            subtotal + parada.minutos,
          0,
        ),
      0,
    );

    const consumoTotal = registros.reduce(
      (total, registro) =>
        total +
        registro.consumosMateriaPrima.reduce(
          (subtotal, consumo) =>
            subtotal +
            numero(consumo.cantidadConsumida),
          0,
        ),
      0,
    );

    const moliendaTotal = registros.reduce(
      (total, registro) =>
        total +
        numero(registro.controlMolienda?.pesoTotal),
      0,
    );

    const eficiencia =
      programado > 0
        ? (buenos / programado) * 100
        : 0;

    const cumplimiento =
      programado > 0
        ? (producido / programado) * 100
        : 0;

    const pdf = await PDFDocument.create();
    const fuente = await pdf.embedFont(
      StandardFonts.Helvetica,
    );
    const fuenteNegrita = await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );

    const anchoPagina = 842;
    const altoPagina = 595;
    const margen = 38;

    function nuevaPagina() {
      const pagina = pdf.addPage([
        anchoPagina,
        altoPagina,
      ]);

      pagina.drawRectangle({
        x: 0,
        y: altoPagina - 72,
        width: anchoPagina,
        height: 72,
        color: rgb(0.06, 0.12, 0.24),
      });

      pagina.drawText("REPORTE DE PRODUCCIÓN IBC", {
        x: margen,
        y: altoPagina - 37,
        size: 20,
        font: fuenteNegrita,
        color: rgb(1, 1, 1),
      });

      pagina.drawText(empresaActiva.nombreComercial, {
        x: margen,
        y: altoPagina - 57,
        size: 10,
        font: fuente,
        color: rgb(0.78, 0.86, 1),
      });

      return pagina;
    }

    let pagina = nuevaPagina();
    let y = altoPagina - 100;

    pagina.drawText(
      exportarTodo
        ? "Alcance: toda la información histórica"
        : `Periodo: ${fechaIso(fechaDesde!)} al ${fechaIso(fechaHasta!)}`,
      {
        x: margen,
        y,
        size: 11,
        font: fuenteNegrita,
        color: rgb(0.1, 0.15, 0.25),
      },
    );

    pagina.drawText(
      `Tipo de datos: ${tipoDatos.toUpperCase()}`,
      {
        x: 540,
        y,
        size: 10,
        font: fuente,
        color: rgb(0.25, 0.3, 0.38),
      },
    );

    y -= 30;

    const indicadores = [
      ["Registros", registros.length.toString()],
      ["Programado", programado.toString()],
      ["Producido", producido.toString()],
      ["Buenos", buenos.toString()],
      ["Rechazados", rechazados.toString()],
      ["Eficiencia", `${eficiencia.toFixed(2)} %`],
      ["Cumplimiento", `${cumplimiento.toFixed(2)} %`],
      ["Minutos detenidos", minutosParada.toString()],
      ["Consumo MP", `${consumoTotal.toFixed(3)} kg`],
      ["Molienda", `${moliendaTotal.toFixed(3)} kg`],
    ];

    indicadores.forEach((indicador, indice) => {
      const columna = indice % 5;
      const fila = Math.floor(indice / 5);
      const x = margen + columna * 151;
      const cuadroY = y - fila * 58;

      pagina.drawRectangle({
        x,
        y: cuadroY - 35,
        width: 137,
        height: 46,
        color: rgb(0.95, 0.97, 1),
        borderColor: rgb(0.82, 0.86, 0.92),
        borderWidth: 1,
      });

      pagina.drawText(indicador[0], {
        x: x + 8,
        y: cuadroY - 6,
        size: 8,
        font: fuente,
        color: rgb(0.35, 0.4, 0.48),
      });

      pagina.drawText(indicador[1], {
        x: x + 8,
        y: cuadroY - 24,
        size: 13,
        font: fuenteNegrita,
        color: rgb(0.05, 0.1, 0.2),
      });
    });

    y -= 130;

    const columnas = [
      { titulo: "Fecha", ancho: 66 },
      { titulo: "Lote", ancho: 120 },
      { titulo: "Turno", ancho: 72 },
      { titulo: "Línea", ancho: 82 },
      { titulo: "Máquina", ancho: 104 },
      { titulo: "Operador", ancho: 86 },
      { titulo: "Prod.", ancho: 48 },
      { titulo: "Buenos", ancho: 48 },
      { titulo: "Rech.", ancho: 44 },
      { titulo: "Efic. %", ancho: 54 },
    ];

    function dibujarEncabezadoTabla() {
      let x = margen;

      pagina.drawRectangle({
        x: margen,
        y: y - 18,
        width: anchoPagina - margen * 2,
        height: 22,
        color: rgb(0.12, 0.29, 0.62),
      });

      for (const columna of columnas) {
        pagina.drawText(columna.titulo, {
          x: x + 3,
          y: y - 11,
          size: 7.5,
          font: fuenteNegrita,
          color: rgb(1, 1, 1),
        });

        x += columna.ancho;
      }

      y -= 22;
    }

    dibujarEncabezadoTabla();

    for (const registro of registros) {
      if (y < 55) {
        pagina = nuevaPagina();
        y = altoPagina - 100;
        dibujarEncabezadoTabla();
      }

      const control = registro.controlProduccion;
      const eficienciaFila = numero(
        control?.eficiencia,
      );

      const valores = [
        fechaIso(registro.fechaProduccion),
        recortar(registro.lote, 22),
        recortar(registro.turno.nombre, 12),
        recortar(
          registro.lineaProduccion.nombre,
          14,
        ),
        recortar(registro.maquina.nombre, 18),
        recortar(registro.operador.nombre, 14),
        String(control?.producido ?? 0),
        String(control?.buenos ?? 0),
        String(control?.rechazados ?? 0),
        eficienciaFila.toFixed(2),
      ];

      let x = margen;

      pagina.drawRectangle({
        x: margen,
        y: y - 15,
        width: anchoPagina - margen * 2,
        height: 18,
        color:
          Math.floor((altoPagina - y) / 18) % 2 === 0
            ? rgb(0.98, 0.99, 1)
            : rgb(0.94, 0.96, 0.99),
      });

      valores.forEach((valor, indice) => {
        pagina.drawText(valor, {
          x: x + 3,
          y: y - 9,
          size: 7,
          font: fuente,
          color: rgb(0.12, 0.16, 0.23),
        });

        x += columnas[indice].ancho;
      });

      y -= 18;
    }

    const bytes = await pdf.save();

    const contenidoPdf = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

    const nombreArchivo = exportarTodo
      ? `reporte-produccion-completo-${fechaIso(new Date())}.pdf`
      : `reporte-produccion-${fechaIso(fechaDesde!)}-${fechaIso(fechaHasta!)}.pdf`;

    return new NextResponse(contenidoPdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store",
        "Content-Length":
          String(contenidoPdf.byteLength),
      },
    });
  } catch (error) {
    console.error(
      "Error al exportar PDF:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo generar el PDF.",
      },
      {
        status: 500,
      },
    );
  }
}