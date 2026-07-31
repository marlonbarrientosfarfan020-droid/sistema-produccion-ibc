"use client";

import {
  CheckCircle2,
  Recycle,
  RotateCcw,
  Scale,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

export type DatosControlMolienda = {
  pesoRecuperable: string;
  pesoNoRecuperable: string;
  pesoBarrido: string;
  observaciones: string;
};

type DatosControlMoliendaCalculados =
  DatosControlMolienda & {
    pesoTotal: number;
  };

type ControlMoliendaFormProps = {
  onChange?: (
    datos: DatosControlMoliendaCalculados,
  ) => void;
};

const datosIniciales: DatosControlMolienda = {
  pesoRecuperable: "",
  pesoNoRecuperable: "",
  pesoBarrido: "",
  observaciones: "",
};

function convertirNumero(valor: string) {
  if (!valor.trim()) {
    return 0;
  }

  const numero = Number(
    valor.trim().replace(",", "."),
  );

  return Number.isFinite(numero)
    ? Math.max(0, numero)
    : 0;
}

function calcularDatos(
  datos: DatosControlMolienda,
): DatosControlMoliendaCalculados {
  const pesoRecuperable = convertirNumero(
    datos.pesoRecuperable,
  );

  const pesoNoRecuperable = convertirNumero(
    datos.pesoNoRecuperable,
  );

  const pesoBarrido = convertirNumero(
    datos.pesoBarrido,
  );

  return {
    ...datos,
    pesoTotal:
      pesoRecuperable +
      pesoNoRecuperable +
      pesoBarrido,
  };
}

export default function ControlMoliendaForm({
  onChange,
}: ControlMoliendaFormProps) {
  const [datos, setDatos] =
    useState<DatosControlMolienda>(datosIniciales);

  const calculos = useMemo(
    () => calcularDatos(datos),
    [datos],
  );

  function actualizarCampo(
    campo: keyof DatosControlMolienda,
    valor: string,
  ) {
    const nuevosDatos = {
      ...datos,
      [campo]: valor,
    };

    setDatos(nuevosDatos);
    onChange?.(calcularDatos(nuevosDatos));
  }

  function limpiar() {
    setDatos(datosIniciales);
    onChange?.(calcularDatos(datosIniciales));
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
            <Recycle className="h-6 w-6 text-violet-600" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              Control de molienda
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Registre el material recuperable, no
              recuperable y el peso de barrido.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={limpiar}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar molienda
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <CampoPeso
          titulo="Molienda recuperable"
          descripcion="Material que puede reutilizarse"
          valor={datos.pesoRecuperable}
          icono={
            <Recycle className="h-5 w-5" />
          }
          onChange={(valor) =>
            actualizarCampo(
              "pesoRecuperable",
              valor,
            )
          }
        />

        <CampoPeso
          titulo="Molienda no recuperable"
          descripcion="Material que no puede reutilizarse"
          valor={datos.pesoNoRecuperable}
          icono={
            <Trash2 className="h-5 w-5" />
          }
          onChange={(valor) =>
            actualizarCampo(
              "pesoNoRecuperable",
              valor,
            )
          }
        />

        <CampoPeso
          titulo="Peso de barrido"
          descripcion="Material recogido durante la limpieza"
          valor={datos.pesoBarrido}
          icono={<Scale className="h-5 w-5" />}
          onChange={(valor) =>
            actualizarCampo(
              "pesoBarrido",
              valor,
            )
          }
        />
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-violet-950 to-violet-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
              Total de molienda
            </p>

            <p className="mt-2 text-4xl font-black">
              {calculos.pesoTotal.toFixed(3)} kg
            </p>

            <p className="mt-2 text-sm font-semibold text-violet-200">
              Recuperable + no recuperable + barrido
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
            <Scale className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">
          Observaciones de molienda
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
          placeholder="Registre incidencias, procedencia del material o comentarios relacionados con la molienda..."
          className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        El peso total de molienda se calcula
        automáticamente.
      </div>
    </section>
  );
}

function CampoPeso({
  titulo,
  descripcion,
  valor,
  icono,
  onChange,
}: {
  titulo: string;
  descripcion: string;
  valor: string;
  icono: React.ReactNode;
  onChange: (valor: string) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
        {icono}
      </div>

      <label className="mt-4 block text-sm font-black text-slate-800">
        {titulo}
      </label>

      <p className="mt-1 min-h-10 text-xs font-semibold leading-5 text-slate-500">
        {descripcion}
      </p>

      <div className="relative mt-4">
        <input
          type="number"
          min="0"
          step="0.001"
          value={valor}
          onChange={(evento) =>
            onChange(evento.target.value)
          }
          placeholder="0.000"
          className="w-full rounded-2xl border border-slate-300 py-3 pl-4 pr-12 text-sm font-bold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />

        <span className="pointer-events-none absolute right-4 top-3.5 text-xs font-black text-slate-400">
          kg
        </span>
      </div>
    </article>
  );
}