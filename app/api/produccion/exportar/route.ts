import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function limpiarTexto(valor: string | null) {
  return String(valor ?? "").trim();
}

function convertirFechaInicio(valor: string | null) {
  const texto = limpiarTexto(valor);
  if (!texto) return null;

  const fecha = new Date(`${texto}T00:00:00.000Z`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function convertirFechaFin(valor: string | null) {
  const texto = limpiarTexto(valor);
  if (!texto) return null;

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

function anchoAutomatico(
  hoja: XLSX.WorkSheet,
  filas: Record<string, unknown>[],
) {
  if (filas.length === 0) return;

  const columnas = Object.keys(filas[0]);

  hoja["!cols"] = columnas.map((columna) => {
    const maximo = Math.max(
      columna.length,
      ...filas.map((fila) =>
        String(fila[columna] ?? "").length,
      ),
    );

    return {
      wch: Math.min(Math.max(maximo + 2, 12), 45),
    };
  });
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

    const turnoId = limpiarTexto(url.searchParams.get("turnoId"));
    const lineaProduccionId = limpiarTexto(url.searchParams.get("lineaId"));
    const maquinaId = limpiarTexto(url.searchParams.get("maquinaId"));
    const operadorId = limpiarTexto(url.searchParams.get("operadorId"));
    const productoTerminadoId = limpiarTexto(url.searchParams.get("productoId"));
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
      where: { activo: true },
      orderBy: { creadoEn: "asc" },
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
        { status: 404 },
      );
    }

    const registros =
      await prisma.registroProduccion.findMany({
        where: {
          empresaId: empresa.id,
          estado: { not: "ANULADO" },
          ...filtroSimulacion,
          ...(!exportarTodo && fechaDesde && fechaHasta
            ? {
                fechaProduccion: {
                  gte: fechaDesde,
                  lte: fechaHasta,
                },
              }
            : {}),
          ...(!exportarTodo && turnoId ? { turnoId } : {}),
          ...(!exportarTodo && lineaProduccionId
            ? { lineaProduccionId }
            : {}),
          ...(!exportarTodo && maquinaId
            ? { maquinaId }
            : {}),
          ...(!exportarTodo && operadorId
            ? { operadorId }
            : {}),
          ...(!exportarTodo && productoTerminadoId
            ? { productoTerminadoId }
            : {}),
        },
        orderBy: [
          { fechaProduccion: "asc" },
          { creadoEn: "asc" },
        ],
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
          },
          paradasMaquina: true,
        },
      });

    const filasProduccion = registros.map((registro) => ({
      Fecha: fechaIso(registro.fechaProduccion),
      Semana: registro.semana,
      Mes: registro.mes,
      Año: registro.anio,
      Lote: registro.lote,
      Orden: registro.ordenProduccion,
      Planta: registro.planta.nombre,
      Turno: registro.turno.nombre,
      Línea: registro.lineaProduccion.nombre,
      Máquina: registro.maquina.nombre,
      Operador: registro.operador.nombre,
      "Producto proceso": registro.productoProceso.nombre,
      "Producto terminado": registro.productoTerminado.nombre,
      "Material virgen": registro.materialVirgen?.nombre ?? "",
      "Material molido": registro.materialMolido?.nombre ?? "",
      Color: registro.colorProduccion?.nombre ?? registro.colorOtro ?? "",
      Programado: registro.controlProduccion?.programado ?? 0,
      Producido: registro.controlProduccion?.producido ?? 0,
      Buenos: registro.controlProduccion?.buenos ?? 0,
      Rechazados: registro.controlProduccion?.rechazados ?? 0,
      "Horas producción": numero(
        registro.controlProduccion?.horasProduccion,
      ),
      "Producción por hora": numero(
        registro.controlProduccion?.produccionPorHora,
      ),
      "Eficiencia %": numero(
        registro.controlProduccion?.eficiencia,
      ),
      "Rechazo %": numero(
        registro.controlProduccion?.porcentajeRechazo,
      ),
      "Cumplimiento %": numero(
        registro.controlProduccion?.cumplimientoPrograma,
      ),
      "Es simulación": registro.esSimulacion ? "SÍ" : "NO",
      "Archivo importado": registro.archivoImportado ?? "",
    }));

    const filasMolienda = registros
      .filter((registro) => registro.controlMolienda)
      .map((registro) => ({
        Fecha: fechaIso(registro.fechaProduccion),
        Lote: registro.lote,
        Línea: registro.lineaProduccion.nombre,
        Máquina: registro.maquina.nombre,
        "Peso recuperable": numero(
          registro.controlMolienda?.pesoRecuperable,
        ),
        "Peso no recuperable": numero(
          registro.controlMolienda?.pesoNoRecuperable,
        ),
        "Peso barrido": numero(
          registro.controlMolienda?.pesoBarrido,
        ),
        "Peso total": numero(
          registro.controlMolienda?.pesoTotal,
        ),
      }));

    const filasConsumo = registros.flatMap((registro) =>
      registro.consumosMateriaPrima.map((consumo) => ({
        Fecha: fechaIso(registro.fechaProduccion),
        Lote: registro.lote,
        Material: consumo.producto.nombre,
        Código:
          consumo.producto.codigoSap ??
          consumo.producto.codigo,
        Unidad:
          consumo.producto.unidadMedida?.simbolo ?? "",
        "Cantidad inicial": numero(consumo.cantidadInicial),
        "Cantidad consumida": numero(
          consumo.cantidadConsumida,
        ),
        "Cantidad final": numero(consumo.cantidadFinal),
        "Consumo estándar/envase": numero(
          consumo.consumoEstandarEnvase,
        ),
        "Consumo real/envase": numero(
          consumo.consumoRealEnvase,
        ),
        Diferencia: numero(consumo.diferenciaConsumo),
        "Rendimiento %": numero(consumo.rendimiento),
      })),
    );

    const filasParadas = registros.flatMap((registro) =>
      registro.paradasMaquina.map((parada) => ({
        Fecha: fechaIso(registro.fechaProduccion),
        Lote: registro.lote,
        Línea: registro.lineaProduccion.nombre,
        Máquina: registro.maquina.nombre,
        Turno: registro.turno.nombre,
        Inicio: parada.horaInicio,
        Fin: parada.horaFin,
        Minutos: parada.minutos,
        Tipo: parada.tipo,
        Motivo: parada.motivo,
        Observaciones: parada.observaciones ?? "",
      })),
    );

    const programado = filasProduccion.reduce(
      (total, fila) => total + Number(fila.Programado),
      0,
    );
    const producido = filasProduccion.reduce(
      (total, fila) => total + Number(fila.Producido),
      0,
    );
    const buenos = filasProduccion.reduce(
      (total, fila) => total + Number(fila.Buenos),
      0,
    );
    const rechazados = filasProduccion.reduce(
      (total, fila) => total + Number(fila.Rechazados),
      0,
    );
    const minutosParada = filasParadas.reduce(
      (total, fila) => total + Number(fila.Minutos),
      0,
    );

    const filasResumen = [
      {
        Indicador: "Empresa",
        Valor: empresa.nombreComercial,
      },
      {
        Indicador: "Fecha desde",
        Valor: fechaDesde ? fechaIso(fechaDesde) : "Toda la historia",
      },
      {
        Indicador: "Fecha hasta",
        Valor: fechaHasta ? fechaIso(fechaHasta) : "Toda la historia",
      },
      {
        Indicador: "Tipo de datos",
        Valor: tipoDatos,
      },
      {
        Indicador: "Registros",
        Valor: registros.length,
      },
      {
        Indicador: "Programado",
        Valor: programado,
      },
      {
        Indicador: "Producido",
        Valor: producido,
      },
      {
        Indicador: "Buenos",
        Valor: buenos,
      },
      {
        Indicador: "Rechazados",
        Valor: rechazados,
      },
      {
        Indicador: "Minutos de parada",
        Valor: minutosParada,
      },
      {
        Indicador: "Eficiencia global %",
        Valor:
          programado > 0
            ? (buenos / programado) * 100
            : 0,
      },
      {
        Indicador: "Cumplimiento %",
        Valor:
          programado > 0
            ? (producido / programado) * 100
            : 0,
      },
    ];

    const libro = XLSX.utils.book_new();

    const hojas = [
      {
        nombre: "RESUMEN",
        filas: filasResumen,
      },
      {
        nombre: "PRODUCCION",
        filas: filasProduccion,
      },
      {
        nombre: "MOLIENDA",
        filas: filasMolienda,
      },
      {
        nombre: "CONSUMO_MP",
        filas: filasConsumo,
      },
      {
        nombre: "PARADAS",
        filas: filasParadas,
      },
    ];

    for (const item of hojas) {
      const hoja = XLSX.utils.json_to_sheet(
        item.filas.length > 0
          ? item.filas
          : [{ Mensaje: "Sin datos para los filtros seleccionados" }],
      );

      anchoAutomatico(hoja, item.filas);
      XLSX.utils.book_append_sheet(
        libro,
        hoja,
        item.nombre,
      );
    }

    const contenido = XLSX.write(libro, {
      type: "buffer",
      bookType: "xlsx",
    });

    const nombreArchivo = exportarTodo
      ? `reporte-produccion-completo-${fechaIso(new Date())}.xlsx`
      : `reporte-produccion-${fechaIso(fechaDesde!)}-${fechaIso(fechaHasta!)}.xlsx`;

    return new NextResponse(contenido, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Error al exportar producción:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo generar el archivo Excel.",
      },
      { status: 500 },
    );
  }
}