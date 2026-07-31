"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

export type DatosControlProduccion = {
  programado: string;
  producido: string;
  buenos: string;
  horasProduccion: string;
  observaciones: string;
};

const datosIniciales: DatosControlProduccion = {
  programado: "",
  producido: "",
  buenos: "",
  horasProduccion: "",
  observaciones: "",
};

type ControlProduccionFormProps = {
  onChange?: (
    datos: DatosControlProduccion & {
      rechazados: number;
      eficiencia: number;
      porcentajeRechazo: number;
      cumplimientoPrograma: number;
      produccionPorHora: number;
    },
  ) => void;
};

function convertirNumero(valor: string) {
  if (!valor.trim()) {
    return 0;
  }

  const numero = Number(valor.replace(",", "."));

  return Number.isFinite(numero) ? numero : 0;
}

function formatearPorcentaje(valor: number) {
  return `${valor.toFixed(2)}%`;
}

export default function ControlProduccionForm({
  onChange,
}: ControlProduccionFormProps) {
  const [datos, setDatos] =
    useState<DatosControlProduccion>(datosIniciales);

  const calculos = useMemo(() => {
    const programado = Math.max(
      0,
      Math.trunc(convertirNumero(datos.programado)),
    );

    const producido = Math.max(
      0,
      Math.trunc(convertirNumero(datos.producido)),
    );

    const buenos = Math.max(
      0,
      Math.trunc(convertirNumero(datos.buenos)),
    );

    const horasProduccion = Math.max(
      0,
      convertirNumero(datos.horasProduccion),
    );

    const rechazados = Math.max(0, producido - buenos);

    const eficiencia =
      programado > 0 ? (buenos / programado) * 100 : 0;

    const porcentajeRechazo =
      producido > 0 ? (rechazados / producido) * 100 : 0;

    const cumplimientoPrograma =
      programado > 0 ? (producido / programado) * 100 : 0;

    const produccionPorHora =
      horasProduccion > 0 ? buenos / horasProduccion : 0;

    return {
      programado,
      producido,
      buenos,
      horasProduccion,
      rechazados,
      eficiencia,
      porcentajeRechazo,
      cumplimientoPrograma,
      produccionPorHora,
    };
  }, [datos]);

  function emitirCambio(nuevosDatos: DatosControlProduccion) {
    const programado = Math.max(
      0,
      Math.trunc(convertirNumero(nuevosDatos.programado)),
    );

    const producido = Math.max(
      0,
      Math.trunc(convertirNumero(nuevosDatos.producido)),
    );

    const buenos = Math.max(
      0,
      Math.trunc(convertirNumero(nuevosDatos.buenos)),
    );

    const horasProduccion = Math.max(
      0,
      convertirNumero(nuevosDatos.horasProduccion),
    );

    const rechazados = Math.max(0, producido - buenos);

    const eficiencia =
      programado > 0 ? (buenos / programado) * 100 : 0;

    const porcentajeRechazo =
      producido > 0 ? (rechazados / producido) * 100 : 0;

    const cumplimientoPrograma =
      programado > 0 ? (producido / programado) * 100 : 0;

    const produccionPorHora =
      horasProduccion > 0 ? buenos / horasProduccion : 0;

    onChange?.({
      ...nuevosDatos,
      rechazados,
      eficiencia,
      porcentajeRechazo,
      cumplimientoPrograma,
      produccionPorHora,
    });
  }

  function actualizarCampo(
    campo: keyof DatosControlProduccion,
    valor: string,
  ) {
    const nuevosDatos = {
      ...datos,
      [campo]: valor,
    };

    setDatos(nuevosDatos);
    emitirCambio(nuevosDatos);
  }

  function limpiar() {
    setDatos(datosIniciales);
    emitirCambio(datosIniciales);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              Control de producción
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Registre la producción programada, producida,
              buena y las horas efectivas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={limpiar}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar producción
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <CampoNumerico
          titulo="Programado"
          valor={datos.programado}
          unidad="envases"
          entero
          onChange={(valor) =>
            actualizarCampo("programado", valor)
          }
        />

        <CampoNumerico
          titulo="Producido"
          valor={datos.producido}
          unidad="envases"
          entero
          onChange={(valor) =>
            actualizarCampo("producido", valor)
          }
        />

        <CampoNumerico
          titulo="Buenos"
          valor={datos.buenos}
          unidad="envases"
          entero
          onChange={(valor) =>
            actualizarCampo("buenos", valor)
          }
        />

        <CampoNumerico
          titulo="Horas de producción"
          valor={datos.horasProduccion}
          unidad="horas"
          onChange={(valor) =>
            actualizarCampo("horasProduccion", valor)
          }
        />
      </div>

      {calculos.buenos > calculos.producido && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          La cantidad de productos buenos no puede superar
          la cantidad producida.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <Indicador
          titulo="Rechazados"
          valor={`${calculos.rechazados}`}
          detalle="Producido - Buenos"
          icono={<XCircle className="h-5 w-5" />}
        />

        <Indicador
          titulo="Eficiencia"
          valor={formatearPorcentaje(calculos.eficiencia)}
          detalle="Buenos / Programado"
          icono={<Activity className="h-5 w-5" />}
        />

        <Indicador
          titulo="Rechazo"
          valor={formatearPorcentaje(
            calculos.porcentajeRechazo,
          )}
          detalle="Rechazados / Producido"
          icono={<XCircle className="h-5 w-5" />}
        />

        <Indicador
          titulo="Cumplimiento"
          valor={formatearPorcentaje(
            calculos.cumplimientoPrograma,
          )}
          detalle="Producido / Programado"
          icono={<Target className="h-5 w-5" />}
        />

        <Indicador
          titulo="Producción por hora"
          valor={calculos.produccionPorHora.toFixed(2)}
          detalle="Envases buenos por hora"
          icono={<Clock3 className="h-5 w-5" />}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">
          Observaciones de producción
        </label>

        <textarea
          value={datos.observaciones}
          onChange={(evento) =>
            actualizarCampo(
              "observaciones",
              evento.target.value,
            )
          }
          rows={4}
          placeholder="Registre incidencias, cambios en el programa o comentarios de producción..."
          className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        Los indicadores se calculan automáticamente.
      </div>
    </section>
  );
}

function CampoNumerico({
  titulo,
  valor,
  unidad,
  entero = false,
  onChange,
}: {
  titulo: string;
  valor: string;
  unidad: string;
  entero?: boolean;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {titulo}
      </label>

      <div className="relative">
        <input
          type="number"
          min="0"
          step={entero ? "1" : "0.01"}
          value={valor}
          onChange={(evento) =>
            onChange(evento.target.value)
          }
          placeholder="0"
          className="w-full rounded-2xl border border-slate-300 py-3 pl-4 pr-20 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />

        <span className="pointer-events-none absolute right-4 top-3.5 text-xs font-black text-slate-400">
          {unidad}
        </span>
      </div>
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
          {icono}
        </div>

        <PackageCheck className="h-5 w-5 text-slate-300" />
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {valor}
      </p>

      <p className="mt-2 text-xs font-semibold text-slate-500">
        {detalle}
      </p>
    </article>
  );
}