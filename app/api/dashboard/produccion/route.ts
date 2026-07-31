import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const tiposParada = [
  "MECANICA",
  "ELECTRICA",
  "CALIDAD",
  "FALTA_MATERIAL",
  "CAMBIO_MOLDE",
  "AJUSTE_PROCESO",
  "OTRA",
] as const;

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

function redondear(valor: number, decimales = 2) {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function nombreTipoParada(tipo: string) {
  const nombres: Record<string, string> = {
    MECANICA: "Mecánica",
    ELECTRICA: "Eléctrica",
    CALIDAD: "Calidad",
    FALTA_MATERIAL: "Falta de material",
    CAMBIO_MOLDE: "Cambio de molde",
    AJUSTE_PROCESO: "Ajuste del proceso",
    OTRA: "Otra",
  };

  return nombres[tipo] ?? tipo;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const fechaDesde =
      convertirFechaInicio(url.searchParams.get("fechaDesde")) ??
      fechaHaceDias(29);

    const fechaHasta =
      convertirFechaFin(url.searchParams.get("fechaHasta")) ??
      new Date();

    const turnoId = limpiarTexto(url.searchParams.get("turnoId"));
    const lineaProduccionId = limpiarTexto(url.searchParams.get("lineaId"));
    const maquinaId = limpiarTexto(url.searchParams.get("maquinaId"));
    const operadorId = limpiarTexto(url.searchParams.get("operadorId"));
    const productoTerminadoId = limpiarTexto(url.searchParams.get("productoId"));
    const tipoDatos = limpiarTexto(
      url.searchParams.get("tipoDatos"),
    ).toLowerCase() || "todos";

    if (!["todos", "reales", "simulados"].includes(tipoDatos)) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "El tipo de datos no es válido.",
        },
        { status: 400 },
      );
    }

    const filtroSimulacion =
      tipoDatos === "reales"
        ? { esSimulacion: false }
        : tipoDatos === "simulados"
          ? { esSimulacion: true }
          : {};

    if (fechaDesde > fechaHasta) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "La fecha inicial no puede ser posterior a la fecha final.",
        },
        { status: 400 },
      );
    }

    const empresa = await prisma.empresa.findFirst({
      where: { activo: true },
      orderBy: { creadoEn: "asc" },
      select: { id: true, nombreComercial: true },
    });

    if (!empresa) {
      return NextResponse.json(
        { ok: false, mensaje: "No existe una empresa activa." },
        { status: 404 },
      );
    }

    const registros = await prisma.registroProduccion.findMany({
      where: {
        empresaId: empresa.id,
        estado: { not: "ANULADO" },
        ...filtroSimulacion,
        fechaProduccion: { gte: fechaDesde, lte: fechaHasta },
        ...(turnoId ? { turnoId } : {}),
        ...(lineaProduccionId ? { lineaProduccionId } : {}),
        ...(maquinaId ? { maquinaId } : {}),
        ...(operadorId ? { operadorId } : {}),
        ...(productoTerminadoId ? { productoTerminadoId } : {}),
      },
      orderBy: [
        { fechaProduccion: "asc" },
        { creadoEn: "asc" },
      ],
      include: {
        turno: { select: { id: true, codigo: true, nombre: true } },
        lineaProduccion: { select: { id: true, codigo: true, nombre: true } },
        maquina: { select: { id: true, codigo: true, nombre: true } },
        operador: { select: { id: true, codigo: true, nombre: true } },
        productoTerminado: {
          select: { id: true, codigo: true, codigoSap: true, nombre: true },
        },
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
              },
            },
          },
        },
        paradasMaquina: true,
      },
    });

    const [turnos, lineas, maquinas, operadores, productos] = await Promise.all([
      prisma.turno.findMany({
        where: { empresaId: empresa.id, activo: true },
        orderBy: { orden: "asc" },
        select: { id: true, codigo: true, nombre: true },
      }),
      prisma.lineaProduccion.findMany({
        where: { empresaId: empresa.id, activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, codigo: true, nombre: true },
      }),
      prisma.maquina.findMany({
        where: { empresaId: empresa.id, activo: true },
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          lineaProduccionId: true,
        },
      }),
      prisma.operador.findMany({
        where: { empresaId: empresa.id, activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, codigo: true, nombre: true },
      }),
      prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          tipo: "PRODUCTO_TERMINADO",
          activo: true,
        },
        orderBy: { nombre: "asc" },
        select: { id: true, codigo: true, codigoSap: true, nombre: true },
      }),
    ]);

    let programadoTotal = 0;
    let producidoTotal = 0;
    let buenosTotal = 0;
    let rechazadosTotal = 0;
    let horasProduccionTotal = 0;
    let minutosParadaTotal = 0;
    let moliendaRecuperableTotal = 0;
    let moliendaNoRecuperableTotal = 0;
    let moliendaBarridoTotal = 0;
    let consumoMateriaPrimaTotal = 0;

    const porDia = new Map<string, any>();
    const porTurno = new Map<string, any>();
    const porLinea = new Map<string, any>();
    const porMaquina = new Map<string, any>();
    const paradasPorTipo = new Map<string, any>();
    const consumoPorMaterial = new Map<string, any>();

    for (const tipo of tiposParada) {
      paradasPorTipo.set(tipo, {
        tipo,
        nombre: nombreTipoParada(tipo),
        minutos: 0,
        cantidad: 0,
      });
    }

    for (const registro of registros) {
      const control = registro.controlProduccion;
      const programado = control?.programado ?? 0;
      const producido = control?.producido ?? 0;
      const buenos = control?.buenos ?? 0;
      const rechazados = control?.rechazados ?? 0;
      const horasProduccion = numero(control?.horasProduccion);
      const minutosParada = registro.paradasMaquina.reduce(
        (total, parada) => total + parada.minutos,
        0,
      );

      programadoTotal += programado;
      producidoTotal += producido;
      buenosTotal += buenos;
      rechazadosTotal += rechazados;
      horasProduccionTotal += horasProduccion;
      minutosParadaTotal += minutosParada;

      moliendaRecuperableTotal += numero(
        registro.controlMolienda?.pesoRecuperable,
      );
      moliendaNoRecuperableTotal += numero(
        registro.controlMolienda?.pesoNoRecuperable,
      );
      moliendaBarridoTotal += numero(
        registro.controlMolienda?.pesoBarrido,
      );

      const fecha = fechaIso(registro.fechaProduccion);
      const diaActual = porDia.get(fecha) ?? {
        fecha,
        programado: 0,
        producido: 0,
        buenos: 0,
        rechazados: 0,
        minutosParada: 0,
        eficiencia: 0,
        registros: 0,
      };

      diaActual.programado += programado;
      diaActual.producido += producido;
      diaActual.buenos += buenos;
      diaActual.rechazados += rechazados;
      diaActual.minutosParada += minutosParada;
      diaActual.registros += 1;
      diaActual.eficiencia =
        diaActual.programado > 0
          ? (diaActual.buenos / diaActual.programado) * 100
          : 0;
      porDia.set(fecha, diaActual);

      const turnoActual = porTurno.get(registro.turno.id) ?? {
        ...registro.turno,
        producido: 0,
        buenos: 0,
        rechazados: 0,
        minutosParada: 0,
      };
      turnoActual.producido += producido;
      turnoActual.buenos += buenos;
      turnoActual.rechazados += rechazados;
      turnoActual.minutosParada += minutosParada;
      porTurno.set(registro.turno.id, turnoActual);

      const lineaActual = porLinea.get(registro.lineaProduccion.id) ?? {
        ...registro.lineaProduccion,
        programado: 0,
        producido: 0,
        buenos: 0,
        rechazados: 0,
        eficiencia: 0,
      };
      lineaActual.programado += programado;
      lineaActual.producido += producido;
      lineaActual.buenos += buenos;
      lineaActual.rechazados += rechazados;
      lineaActual.eficiencia =
        lineaActual.programado > 0
          ? (lineaActual.buenos / lineaActual.programado) * 100
          : 0;
      porLinea.set(registro.lineaProduccion.id, lineaActual);

      const maquinaActual = porMaquina.get(registro.maquina.id) ?? {
        ...registro.maquina,
        producido: 0,
        buenos: 0,
        rechazados: 0,
        minutosParada: 0,
      };
      maquinaActual.producido += producido;
      maquinaActual.buenos += buenos;
      maquinaActual.rechazados += rechazados;
      maquinaActual.minutosParada += minutosParada;
      porMaquina.set(registro.maquina.id, maquinaActual);

      for (const parada of registro.paradasMaquina) {
        const paradaActual = paradasPorTipo.get(parada.tipo) ?? {
          tipo: parada.tipo,
          nombre: nombreTipoParada(parada.tipo),
          minutos: 0,
          cantidad: 0,
        };
        paradaActual.minutos += parada.minutos;
        paradaActual.cantidad += 1;
        paradasPorTipo.set(parada.tipo, paradaActual);
      }

      for (const consumo of registro.consumosMateriaPrima) {
        const consumido = numero(consumo.cantidadConsumida);
        consumoMateriaPrimaTotal += consumido;

        const materialActual = consumoPorMaterial.get(consumo.productoId) ?? {
          productoId: consumo.productoId,
          codigo: consumo.producto.codigoSap ?? consumo.producto.codigo,
          nombre: consumo.producto.nombre,
          consumido: 0,
          inicial: 0,
          final: 0,
          consumoRealPromedio: 0,
          rendimientoPromedio: 0,
          registros: 0,
        };

        materialActual.consumido += consumido;
        materialActual.inicial += numero(consumo.cantidadInicial);
        materialActual.final += numero(consumo.cantidadFinal);
        materialActual.consumoRealPromedio += numero(consumo.consumoRealEnvase);
        materialActual.rendimientoPromedio += numero(consumo.rendimiento);
        materialActual.registros += 1;
        consumoPorMaterial.set(consumo.productoId, materialActual);
      }
    }

    const eficienciaGlobal =
      programadoTotal > 0 ? (buenosTotal / programadoTotal) * 100 : 0;

    const cumplimientoGlobal =
      programadoTotal > 0 ? (producidoTotal / programadoTotal) * 100 : 0;

    const porcentajeRechazo =
      producidoTotal > 0 ? (rechazadosTotal / producidoTotal) * 100 : 0;

    const produccionPorHora =
      horasProduccionTotal > 0 ? buenosTotal / horasProduccionTotal : 0;

    const moliendaTotal =
      moliendaRecuperableTotal +
      moliendaNoRecuperableTotal +
      moliendaBarridoTotal;

    const fechaHoy = fechaIso(new Date());
    const produccionHoy = porDia.get(fechaHoy)?.producido ?? 0;

    const tendenciaDiaria = Array.from(porDia.values()).map((dia) => ({
      ...dia,
      eficiencia: redondear(dia.eficiencia, 2),
    }));

    const produccionPorTurno = Array.from(porTurno.values()).sort(
      (a, b) => b.producido - a.producido,
    );

    const produccionPorLinea = Array.from(porLinea.values())
      .map((linea) => ({
        ...linea,
        eficiencia: redondear(linea.eficiencia, 2),
      }))
      .sort((a, b) => b.producido - a.producido);

    const produccionPorMaquina = Array.from(porMaquina.values()).sort(
      (a, b) => b.producido - a.producido,
    );

    const paretoParadas = Array.from(paradasPorTipo.values())
      .filter((parada) => parada.minutos > 0)
      .sort((a, b) => b.minutos - a.minutos);

    let acumuladoParadas = 0;
    const totalPareto = paretoParadas.reduce(
      (total, parada) => total + parada.minutos,
      0,
    );

    const paretoConAcumulado = paretoParadas.map((parada) => {
      acumuladoParadas += parada.minutos;
      return {
        ...parada,
        porcentajeAcumulado:
          totalPareto > 0
            ? redondear((acumuladoParadas / totalPareto) * 100, 2)
            : 0,
      };
    });

    const consumoMateriales = Array.from(consumoPorMaterial.values())
      .map((material) => ({
        ...material,
        consumido: redondear(material.consumido, 3),
        inicial: redondear(material.inicial, 3),
        final: redondear(material.final, 3),
        consumoRealPromedio:
          material.registros > 0
            ? redondear(material.consumoRealPromedio / material.registros, 4)
            : 0,
        rendimientoPromedio:
          material.registros > 0
            ? redondear(material.rendimientoPromedio / material.registros, 2)
            : 0,
      }))
      .sort((a, b) => b.consumido - a.consumido);

    const alertas: Array<{
      nivel: "CRITICA" | "ADVERTENCIA" | "INFORMATIVA";
      codigo: string;
      titulo: string;
      mensaje: string;
      valor: number;
      unidad: string;
    }> = [];

    if (eficienciaGlobal < 80) {
      alertas.push({
        nivel: "CRITICA",
        codigo: "EFICIENCIA_BAJA",
        titulo: "Eficiencia crítica",
        mensaje: "La eficiencia global está por debajo del 80%.",
        valor: redondear(eficienciaGlobal, 2),
        unidad: "%",
      });
    } else if (eficienciaGlobal < 90) {
      alertas.push({
        nivel: "ADVERTENCIA",
        codigo: "EFICIENCIA_ATENCION",
        titulo: "Eficiencia por mejorar",
        mensaje: "La eficiencia global está por debajo del objetivo de 90%.",
        valor: redondear(eficienciaGlobal, 2),
        unidad: "%",
      });
    }

    if (porcentajeRechazo >= 8) {
      alertas.push({
        nivel: "CRITICA",
        codigo: "RECHAZO_ALTO",
        titulo: "Rechazo elevado",
        mensaje: "El porcentaje de rechazo supera el 8%.",
        valor: redondear(porcentajeRechazo, 2),
        unidad: "%",
      });
    } else if (porcentajeRechazo >= 5) {
      alertas.push({
        nivel: "ADVERTENCIA",
        codigo: "RECHAZO_ATENCION",
        titulo: "Rechazo en observación",
        mensaje: "El porcentaje de rechazo supera el 5%.",
        valor: redondear(porcentajeRechazo, 2),
        unidad: "%",
      });
    }

    if (cumplimientoGlobal < 85) {
      alertas.push({
        nivel: "CRITICA",
        codigo: "CUMPLIMIENTO_BAJO",
        titulo: "Programa incumplido",
        mensaje: "El cumplimiento de producción está por debajo del 85%.",
        valor: redondear(cumplimientoGlobal, 2),
        unidad: "%",
      });
    } else if (cumplimientoGlobal < 95) {
      alertas.push({
        nivel: "ADVERTENCIA",
        codigo: "CUMPLIMIENTO_ATENCION",
        titulo: "Cumplimiento parcial",
        mensaje: "El cumplimiento está por debajo del objetivo de 95%.",
        valor: redondear(cumplimientoGlobal, 2),
        unidad: "%",
      });
    }

    if (minutosParadaTotal >= 120) {
      alertas.push({
        nivel: "CRITICA",
        codigo: "PARADAS_ALTAS",
        titulo: "Demasiado tiempo detenido",
        mensaje: "Las paradas acumuladas superan las 2 horas.",
        valor: minutosParadaTotal,
        unidad: "min",
      });
    } else if (minutosParadaTotal >= 60) {
      alertas.push({
        nivel: "ADVERTENCIA",
        codigo: "PARADAS_ATENCION",
        titulo: "Tiempo detenido relevante",
        mensaje: "Las paradas acumuladas superan 60 minutos.",
        valor: minutosParadaTotal,
        unidad: "min",
      });
    }

    for (const material of consumoMateriales) {
      if (
        material.rendimientoPromedio > 0 &&
        material.rendimientoPromedio < 90
      ) {
        alertas.push({
          nivel: "ADVERTENCIA",
          codigo: `RENDIMIENTO_${material.productoId}`,
          titulo: "Rendimiento bajo de materia prima",
          mensaje: `${material.nombre} tiene un rendimiento promedio menor al 90%.`,
          valor: material.rendimientoPromedio,
          unidad: "%",
        });
      }
    }

    if (alertas.length === 0 && registros.length > 0) {
      alertas.push({
        nivel: "INFORMATIVA",
        codigo: "OPERACION_ESTABLE",
        titulo: "Operación estable",
        mensaje: "No se detectaron desviaciones relevantes en el periodo.",
        valor: redondear(eficienciaGlobal, 2),
        unidad: "%",
      });
    }

    const estadoPlanta =
      alertas.some((alerta) => alerta.nivel === "CRITICA")
        ? "RIESGO"
        : alertas.some((alerta) => alerta.nivel === "ADVERTENCIA")
          ? "ATENCION"
          : "NORMAL";

    return NextResponse.json({
      ok: true,
      empresa,
      filtros: {
        fechaDesde: fechaIso(fechaDesde),
        fechaHasta: fechaIso(fechaHasta),
        turnoId: turnoId || null,
        lineaId: lineaProduccionId || null,
        maquinaId: maquinaId || null,
        operadorId: operadorId || null,
        productoId: productoTerminadoId || null,
        tipoDatos,
      },
      catalogos: {
        turnos,
        lineas,
        maquinas,
        operadores,
        productos,
      },
      estadoPlanta,
      alertas,
      tarjetas: {
        registros: registros.length,
        produccionHoy,
        programado: programadoTotal,
        producido: producidoTotal,
        buenos: buenosTotal,
        rechazados: rechazadosTotal,
        eficiencia: redondear(eficienciaGlobal, 2),
        cumplimiento: redondear(cumplimientoGlobal, 2),
        porcentajeRechazo: redondear(porcentajeRechazo, 2),
        produccionPorHora: redondear(produccionPorHora, 2),
        minutosParada: minutosParadaTotal,
        consumoMateriaPrima: redondear(consumoMateriaPrimaTotal, 3),
        moliendaTotal: redondear(moliendaTotal, 3),
      },
      graficos: {
        tendenciaDiaria,
        produccionPorTurno,
        produccionPorLinea,
        produccionPorMaquina,
        paretoParadas: paretoConAcumulado,
        consumoMateriales,
        molienda: [
          {
            categoria: "Recuperable",
            peso: redondear(moliendaRecuperableTotal, 3),
          },
          {
            categoria: "No recuperable",
            peso: redondear(moliendaNoRecuperableTotal, 3),
          },
          {
            categoria: "Barrido",
            peso: redondear(moliendaBarridoTotal, 3),
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error al cargar el dashboard de producción:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el dashboard de producción.",
      },
      { status: 500 },
    );
  }
}