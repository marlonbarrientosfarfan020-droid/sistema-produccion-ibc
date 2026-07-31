"use client";

import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState } from "react";

type RespuestaDashboard = {
  ok: boolean;
  mensaje?: string;
  tarjetas: {
    registros: number;
    programado: number;
    producido: number;
    buenos: number;
    rechazados: number;
    eficiencia: number;
    cumplimiento: number;
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
      eficiencia: number;
      minutosParada: number;
    }>;
  };
};

function fechaHaceDias(dias: number) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString().slice(0, 10);
}

function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [fechaDesde, setFechaDesde] = useState(fechaHaceDias(29));
  const [fechaHasta, setFechaHasta] = useState(fechaHoy());
  const [tipoDatos, setTipoDatos] = useState("todos");
  const [datos, setDatos] = useState<RespuestaDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  function parametros() {
    return new URLSearchParams({
      fechaDesde,
      fechaHasta,
      tipoDatos,
    });
  }

  async function cargar() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
        `/api/dashboard/produccion?${parametros().toString()}`,
        { cache: "no-store" },
      );

      const contenido = await respuesta.json();

      if (!respuesta.ok || !contenido.ok) {
        throw new Error(contenido.mensaje ?? "No se pudo cargar el reporte.");
      }

      setDatos(contenido);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar el reporte.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function descargar(tipo: "excel" | "pdf", alcance: "filtros" | "todo") {
    const query = parametros();
    query.set("alcance", alcance);

    window.location.href =
      tipo === "excel"
        ? `/api/produccion/exportar?${query.toString()}`
        : `/api/produccion/exportar-pdf?${query.toString()}`;
  }

  return (
    <main className="space-y-7">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
          Análisis industrial
        </p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">
          Reportes de Producción
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-medium text-slate-200">
          Consulte resultados diarios y exporte información a Excel o PDF.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-black text-slate-700">
            Fecha desde
            <input
              type="date"
              value={fechaDesde}
              onChange={(evento) => setFechaDesde(evento.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="text-sm font-black text-slate-700">
            Fecha hasta
            <input
              type="date"
              value={fechaHasta}
              onChange={(evento) => setFechaHasta(evento.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="text-sm font-black text-slate-700">
            Tipo de datos
            <select
              value={tipoDatos}
              onChange={(evento) => setTipoDatos(evento.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="todos">Todos</option>
              <option value="reales">Solo reales</option>
              <option value="simulados">Solo simulados</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => void cargar()}
            className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
          >
            {cargando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Generar reporte
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Registros", datos?.tarjetas.registros ?? 0],
          ["Producido", datos?.tarjetas.producido ?? 0],
          ["Buenos", datos?.tarjetas.buenos ?? 0],
          ["Rechazados", datos?.tarjetas.rechazados ?? 0],
          ["Eficiencia", `${(datos?.tarjetas.eficiencia ?? 0).toFixed(2)} %`],
        ].map(([titulo, valor]) => (
          <article
            key={String(titulo)}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-black uppercase text-slate-500">{titulo}</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{valor}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BotonExportar
          titulo="Excel filtrado"
          descripcion="Descarga el periodo seleccionado."
          icono={<FileSpreadsheet className="h-6 w-6" />}
          onClick={() => descargar("excel", "filtros")}
        />
        <BotonExportar
          titulo="PDF filtrado"
          descripcion="Reporte listo para impresión."
          icono={<FileText className="h-6 w-6" />}
          onClick={() => descargar("pdf", "filtros")}
        />
        <BotonExportar
          titulo="Excel completo"
          descripcion="Descarga todo el historial."
          icono={<Download className="h-6 w-6" />}
          onClick={() => descargar("excel", "todo")}
        />
        <BotonExportar
          titulo="PDF completo"
          descripcion="Reporte histórico completo."
          icono={<CalendarDays className="h-6 w-6" />}
          onClick={() => descargar("pdf", "todo")}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-black text-slate-950">
            Detalle diario
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Programado</th>
                <th className="px-4 py-3">Producido</th>
                <th className="px-4 py-3">Buenos</th>
                <th className="px-4 py-3">Rechazados</th>
                <th className="px-4 py-3">Eficiencia</th>
                <th className="px-4 py-3">Paradas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(datos?.graficos.tendenciaDiaria ?? []).map((fila) => (
                <tr key={fila.fecha} className="text-sm font-semibold">
                  <td className="px-4 py-3">{fila.fecha}</td>
                  <td className="px-4 py-3">{fila.programado}</td>
                  <td className="px-4 py-3">{fila.producido}</td>
                  <td className="px-4 py-3">{fila.buenos}</td>
                  <td className="px-4 py-3">{fila.rechazados}</td>
                  <td className="px-4 py-3">{fila.eficiencia.toFixed(2)} %</td>
                  <td className="px-4 py-3">{fila.minutosParada} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function BotonExportar({
  titulo,
  descripcion,
  icono,
  onClick,
}: {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icono}
      </div>
      <p className="mt-4 font-black text-slate-950">{titulo}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">{descripcion}</p>
    </button>
  );
}
