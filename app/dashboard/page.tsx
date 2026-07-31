"use client";

import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarDays,
  Factory,
  Filter,
  Gauge,
  LoaderCircle,
  PackageCheck,
  Download,
  RefreshCcw,
  RotateCcw,
  TimerReset,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CatalogoSimple = {
  id: string;
  codigo: string;
  nombre: string;
};

type MaquinaCatalogo = CatalogoSimple & {
  lineaProduccionId: string | null;
};

type ProductoCatalogo = CatalogoSimple & {
  codigoSap: string | null;
};

type RespuestaDashboard = {
  ok: boolean;
  mensaje?: string;
  empresa: {
    id: string;
    nombreComercial: string;
  };
  estadoPlanta: "NORMAL" | "ATENCION" | "RIESGO";
  alertas: Array<{
    nivel: "CRITICA" | "ADVERTENCIA" | "INFORMATIVA";
    codigo: string;
    titulo: string;
    mensaje: string;
    valor: number;
    unidad: string;
  }>;
  filtros: {
    fechaDesde: string;
    fechaHasta: string;
    turnoId: string | null;
    lineaId: string | null;
    maquinaId: string | null;
    operadorId: string | null;
    productoId: string | null;
    tipoDatos: string;
  };
  catalogos: {
    turnos: CatalogoSimple[];
    lineas: CatalogoSimple[];
    maquinas: MaquinaCatalogo[];
    operadores: CatalogoSimple[];
    productos: ProductoCatalogo[];
  };
  tarjetas: {
    registros: number;
    produccionHoy: number;
    programado: number;
    producido: number;
    buenos: number;
    rechazados: number;
    eficiencia: number;
    cumplimiento: number;
    porcentajeRechazo: number;
    produccionPorHora: number;
    minutosParada: number;
    consumoMateriaPrima: number;
    moliendaTotal: number;
  };
  graficos: {
    tendenciaDiaria: Array<{
      fecha: string;
      programado: number;
      producido: number;
      buenos: number;
      rechazados: number;
      minutosParada: number;
      eficiencia: number;
      registros: number;
    }>;
    produccionPorTurno: Array<{
      id: string;
      codigo: string;
      nombre: string;
      producido: number;
      buenos: number;
      rechazados: number;
      minutosParada: number;
    }>;
    produccionPorLinea: Array<{
      id: string;
      codigo: string;
      nombre: string;
      programado: number;
      producido: number;
      buenos: number;
      rechazados: number;
      eficiencia: number;
    }>;
    produccionPorMaquina: Array<{
      id: string;
      codigo: string;
      nombre: string;
      producido: number;
      buenos: number;
      rechazados: number;
      minutosParada: number;
    }>;
    paretoParadas: Array<{
      tipo: string;
      nombre: string;
      minutos: number;
      cantidad: number;
      porcentajeAcumulado: number;
    }>;
    consumoMateriales: Array<{
      productoId: string;
      codigo: string;
      nombre: string;
      consumido: number;
      inicial: number;
      final: number;
      consumoRealPromedio: number;
      rendimientoPromedio: number;
      registros: number;
    }>;
    molienda: Array<{
      categoria: string;
      peso: number;
    }>;
  };
};

const coloresPie = [
  "#7c3aed",
  "#ef4444",
  "#f59e0b",
];

function fechaHaceDias(dias: number) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);

  return fecha.toISOString().slice(0, 10);
}

function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

function formatearFechaCorta(fecha: string) {
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}`;
}

function formatearNumero(valor: number, decimales = 0) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export default function DashboardPage() {
  const [datos, setDatos] =
    useState<RespuestaDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [fechaDesde, setFechaDesde] = useState(
    fechaHaceDias(29),
  );
  const [fechaHasta, setFechaHasta] = useState(
    fechaHoy(),
  );
  const [turnoId, setTurnoId] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [maquinaId, setMaquinaId] = useState("");
  const [operadorId, setOperadorId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [tipoDatos, setTipoDatos] = useState("todos");

  function construirParametros() {
    const parametros = new URLSearchParams({
      fechaDesde,
      fechaHasta,
      tipoDatos,
    });

    if (turnoId) parametros.set("turnoId", turnoId);
    if (lineaId) parametros.set("lineaId", lineaId);
    if (maquinaId) parametros.set("maquinaId", maquinaId);
    if (operadorId) parametros.set("operadorId", operadorId);
    if (productoId) parametros.set("productoId", productoId);

    return parametros;
  }

  async function cargarDashboard() {
    try {
      setCargando(true);
      setError("");

      const parametros = construirParametros();

      const respuesta = await fetch(
        `/api/dashboard/produccion?${parametros.toString()}`,
        {
          cache: "no-store",
        },
      );

      const contenido =
        (await respuesta.json()) as RespuestaDashboard;

      if (!respuesta.ok || !contenido.ok) {
        throw new Error(
          contenido.mensaje ??
            "No se pudo cargar el dashboard.",
        );
      }

      setDatos(contenido);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar el dashboard.",
      );
    } finally {
      setCargando(false);
    }
  }

  function descargarReporte(
    formato: "excel" | "pdf",
    alcance: "filtros" | "todo",
  ) {
    const parametros =
      alcance === "filtros"
        ? construirParametros()
        : new URLSearchParams({
            alcance: "todo",
            tipoDatos,
          });

    parametros.set("alcance", alcance);

    const ruta =
      formato === "excel"
        ? "/api/produccion/exportar"
        : "/api/produccion/exportar-pdf";

    window.location.href =
      `${ruta}?${parametros.toString()}`;
  }

  useEffect(() => {
    void cargarDashboard();
    // Solo se ejecuta al ingresar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maquinasFiltradas = useMemo(() => {
    if (!datos) {
      return [];
    }

    if (!lineaId) {
      return datos.catalogos.maquinas;
    }

    return datos.catalogos.maquinas.filter(
      (maquina) =>
        maquina.lineaProduccionId === lineaId,
    );
  }, [datos, lineaId]);

  function limpiarFiltros() {
    setFechaDesde(fechaHaceDias(29));
    setFechaHasta(fechaHoy());
    setTurnoId("");
    setLineaId("");
    setMaquinaId("");
    setOperadorId("");
    setProductoId("");
    setTipoDatos("todos");
  }

  if (cargando && !datos) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-11 w-11 animate-spin text-blue-600" />

          <p className="mt-4 text-sm font-black text-slate-600">
            Cargando inteligencia de producción...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-700 p-7 text-white shadow-xl md:p-9">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
              Inteligencia industrial
            </p>

            <h1 className="mt-3 text-3xl font-black md:text-4xl">
              Dashboard de Producción IBC
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-200 md:text-base">
              Indicadores ejecutivos, tendencias, eficiencia,
              consumo, molienda y causas de parada en una sola
              vista.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                Periodo analizado
              </p>

              <p className="mt-1 text-lg font-black">
                {fechaDesde} — {fechaHasta}
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                Estado de la planta
              </p>
              <p className="mt-1 text-lg font-black">
                {datos?.estadoPlanta === "RIESGO"
                  ? "🔴 Riesgo"
                  : datos?.estadoPlanta === "ATENCION"
                    ? "🟡 Atención"
                    : "🟢 Normal"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Filter className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-slate-950">
                Filtros interactivos
              </h2>

              <p className="text-sm font-medium text-slate-500">
                Todos los indicadores se actualizarán juntos.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </button>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={() =>
                  descargarReporte("excel", "filtros")
                }
                disabled={cargando}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Excel filtrado
              </button>

              <button
                type="button"
                onClick={() =>
                  descargarReporte("excel", "todo")
                }
                disabled={cargando}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Excel completo
              </button>

              <button
                type="button"
                onClick={() =>
                  descargarReporte("pdf", "filtros")
                }
                disabled={cargando}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                PDF filtrado
              </button>

              <button
                type="button"
                onClick={() =>
                  descargarReporte("pdf", "todo")
                }
                disabled={cargando}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-800 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                PDF completo
              </button>
            </div>

            <button
              type="button"
              onClick={() => void cargarDashboard()}
              disabled={cargando}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Aplicar filtros
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-8">
          <input
            type="date"
            value={fechaDesde}
            onChange={(evento) =>
              setFechaDesde(evento.target.value)
            }
            className={claseCampo}
          />

          <input
            type="date"
            value={fechaHasta}
            onChange={(evento) =>
              setFechaHasta(evento.target.value)
            }
            className={claseCampo}
          />

          <select
            value={tipoDatos}
            onChange={(evento) =>
              setTipoDatos(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="todos">Todos los datos</option>
            <option value="reales">Solo reales</option>
            <option value="simulados">Solo simulados</option>
          </select>

          <select
            value={turnoId}
            onChange={(evento) =>
              setTurnoId(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="">Todos los turnos</option>
            {datos?.catalogos.turnos.map((turno) => (
              <option key={turno.id} value={turno.id}>
                {turno.codigo} - {turno.nombre}
              </option>
            ))}
          </select>

          <select
            value={lineaId}
            onChange={(evento) => {
              setLineaId(evento.target.value);
              setMaquinaId("");
            }}
            className={claseCampo}
          >
            <option value="">Todas las líneas</option>
            {datos?.catalogos.lineas.map((linea) => (
              <option key={linea.id} value={linea.id}>
                {linea.codigo} - {linea.nombre}
              </option>
            ))}
          </select>

          <select
            value={maquinaId}
            onChange={(evento) =>
              setMaquinaId(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="">Todas las máquinas</option>
            {maquinasFiltradas.map((maquina) => (
              <option key={maquina.id} value={maquina.id}>
                {maquina.codigo} - {maquina.nombre}
              </option>
            ))}
          </select>

          <select
            value={operadorId}
            onChange={(evento) =>
              setOperadorId(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="">Todos los operadores</option>
            {datos?.catalogos.operadores.map((operador) => (
              <option
                key={operador.id}
                value={operador.id}
              >
                {operador.codigo} - {operador.nombre}
              </option>
            ))}
          </select>

          <select
            value={productoId}
            onChange={(evento) =>
              setProductoId(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="">Todos los productos</option>
            {datos?.catalogos.productos.map((producto) => (
              <option
                key={producto.id}
                value={producto.id}
              >
                {producto.codigoSap ?? producto.codigo} -{" "}
                {producto.nombre}
              </option>
            ))}
          </select>
        </div>
      </section>


      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-950">
              Alertas inteligentes
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Reglas automáticas sobre eficiencia, rechazo, cumplimiento, paradas y materia prima.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(datos?.alertas ?? []).map((alerta) => (
            <article
              key={alerta.codigo}
              className={[
                "rounded-2xl border p-4",
                alerta.nivel === "CRITICA"
                  ? "border-red-200 bg-red-50"
                  : alerta.nivel === "ADVERTENCIA"
                    ? "border-amber-200 bg-amber-50"
                    : "border-emerald-200 bg-emerald-50",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                {alerta.nivel === "CRITICA" ? (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                ) : alerta.nivel === "ADVERTENCIA" ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                ) : (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                )}

                <div>
                  <p className="font-black text-slate-950">
                    {alerta.titulo}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                    {alerta.mensaje}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {formatearNumero(alerta.valor, 2)} {alerta.unidad}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaKpi
          titulo="Producido"
          valor={formatearNumero(
            datos?.tarjetas.producido ?? 0,
          )}
          detalle={`Programado: ${formatearNumero(
            datos?.tarjetas.programado ?? 0,
          )}`}
          icono={<Factory className="h-6 w-6" />}
          clase="from-blue-600 to-indigo-700"
        />

        <TarjetaKpi
          titulo="Productos buenos"
          valor={formatearNumero(
            datos?.tarjetas.buenos ?? 0,
          )}
          detalle={`Eficiencia: ${formatearNumero(
            datos?.tarjetas.eficiencia ?? 0,
            2,
          )}%`}
          icono={<PackageCheck className="h-6 w-6" />}
          clase="from-emerald-600 to-teal-700"
        />

        <TarjetaKpi
          titulo="Rechazados"
          valor={formatearNumero(
            datos?.tarjetas.rechazados ?? 0,
          )}
          detalle={`${formatearNumero(
            datos?.tarjetas.porcentajeRechazo ?? 0,
            2,
          )}% de rechazo`}
          icono={<XCircle className="h-6 w-6" />}
          clase="from-red-600 to-rose-700"
        />

        <TarjetaKpi
          titulo="Tiempo detenido"
          valor={`${formatearNumero(
            datos?.tarjetas.minutosParada ?? 0,
          )} min`}
          detalle="Todas las causas de parada"
          icono={<TimerReset className="h-6 w-6" />}
          clase="from-amber-500 to-orange-700"
        />

        <TarjetaSimple
          titulo="Cumplimiento"
          valor={`${formatearNumero(
            datos?.tarjetas.cumplimiento ?? 0,
            2,
          )}%`}
          icono={<Gauge className="h-5 w-5" />}
        />

        <TarjetaSimple
          titulo="Producción por hora"
          valor={formatearNumero(
            datos?.tarjetas.produccionPorHora ?? 0,
            2,
          )}
          icono={<TrendingUp className="h-5 w-5" />}
        />

        <TarjetaSimple
          titulo="Materia prima"
          valor={`${formatearNumero(
            datos?.tarjetas.consumoMateriaPrima ?? 0,
            3,
          )} kg`}
          icono={<Boxes className="h-5 w-5" />}
        />

        <TarjetaSimple
          titulo="Molienda total"
          valor={`${formatearNumero(
            datos?.tarjetas.moliendaTotal ?? 0,
            3,
          )} kg`}
          icono={<Activity className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <PanelGrafico
          titulo="Producción diaria"
          descripcion="Programado, producido, buenos y rechazados."
          clase="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart
              data={
                datos?.graficos.tendenciaDiaria.map(
                  (fila) => ({
                    ...fila,
                    fechaCorta: formatearFechaCorta(
                      fila.fecha,
                    ),
                  }),
                ) ?? []
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis dataKey="fechaCorta" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="producido"
                name="Producido"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="buenos"
                name="Buenos"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="programado"
                name="Programado"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="rechazados"
                name="Rechazados"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </PanelGrafico>

        <PanelGrafico
          titulo="Eficiencia diaria"
          descripcion="Evolución porcentual del periodo."
        >
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart
              data={
                datos?.graficos.tendenciaDiaria.map(
                  (fila) => ({
                    ...fila,
                    fechaCorta: formatearFechaCorta(
                      fila.fecha,
                    ),
                  }),
                ) ?? []
              }
            >
              <defs>
                <linearGradient
                  id="eficiencia"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#2563eb"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="#2563eb"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis dataKey="fechaCorta" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="eficiencia"
                name="Eficiencia %"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#eficiencia)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </PanelGrafico>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PanelGrafico
          titulo="Producción por turno"
          descripcion="Comparación de desempeño entre turnos."
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={
                datos?.graficos.produccionPorTurno ?? []
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="producido"
                name="Producido"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="buenos"
                name="Buenos"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="rechazados"
                name="Rechazados"
                fill="#ef4444"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </PanelGrafico>

        <PanelGrafico
          titulo="Producción por línea"
          descripcion="Volumen y eficiencia por línea productiva."
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={
                datos?.graficos.produccionPorLinea ?? []
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="producido"
                name="Producido"
                fill="#4f46e5"
                radius={[8, 8, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="eficiencia"
                name="Eficiencia %"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </PanelGrafico>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <PanelGrafico
          titulo="Pareto de paradas"
          descripcion="Minutos detenidos por clasificación."
          clase="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart
              data={
                datos?.graficos.paretoParadas ?? []
              }
              layout="vertical"
              margin={{
                left: 20,
                right: 20,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="nombre"
                width={130}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="minutos"
                name="Minutos"
                fill="#f59e0b"
                radius={[0, 8, 8, 0]}
              />
              <Line
                dataKey="porcentajeAcumulado"
                name="% acumulado"
                stroke="#7c3aed"
                strokeWidth={3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </PanelGrafico>

        <PanelGrafico
          titulo="Composición de molienda"
          descripcion="Recuperable, no recuperable y barrido."
        >
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={datos?.graficos.molienda ?? []}
                dataKey="peso"
                nameKey="categoria"
                innerRadius={75}
                outerRadius={115}
                paddingAngle={4}
              >
                {(datos?.graficos.molienda ?? []).map(
                  (_, indice) => (
                    <Cell
                      key={indice}
                      fill={
                        coloresPie[
                          indice % coloresPie.length
                        ]
                      }
                    />
                  ),
                )}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </PanelGrafico>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PanelGrafico
          titulo="Consumo de materia prima"
          descripcion="Consumo acumulado por material."
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={
                datos?.graficos.consumoMateriales ?? []
              }
              layout="vertical"
              margin={{
                left: 25,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="nombre"
                width={140}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="consumido"
                name="Consumido kg"
                fill="#0891b2"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </PanelGrafico>

        <PanelGrafico
          titulo="Producción por máquina"
          descripcion="Comparación de volumen y paradas."
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={
                datos?.graficos.produccionPorMaquina ??
                []
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="buenos"
                name="Buenos"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="rechazados"
                name="Rechazados"
                fill="#ef4444"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </PanelGrafico>
      </section>
    </main>
  );
}

const claseCampo =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function TarjetaKpi({
  titulo,
  valor,
  detalle,
  icono,
  clase,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: React.ReactNode;
  clase: string;
}) {
  return (
    <article
      className={`overflow-hidden rounded-3xl bg-gradient-to-br ${clase} p-6 text-white shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/75">
            {titulo}
          </p>

          <p className="mt-3 text-3xl font-black">
            {valor}
          </p>

          <p className="mt-2 text-sm font-semibold text-white/80">
            {detalle}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          {icono}
        </div>
      </div>
    </article>
  );
}

function TarjetaSimple({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {titulo}
          </p>

          <p className="mt-3 text-2xl font-black text-slate-950">
            {valor}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icono}
        </div>
      </div>
    </article>
  );
}

function PanelGrafico({
  titulo,
  descripcion,
  clase = "",
  children,
}: {
  titulo: string;
  descripcion: string;
  clase?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 ${clase}`}
    >
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-950">
          {titulo}
        </h2>

        <p className="mt-1 text-sm font-medium text-slate-500">
          {descripcion}
        </p>
      </div>

      {children}
    </article>
  );
}