"use client";

import {
  Clock3,
  Plus,
  RotateCcw,
  TimerReset,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

export type TipoParadaMaquina =
  | "MECANICA"
  | "ELECTRICA"
  | "CALIDAD"
  | "FALTA_MATERIAL"
  | "CAMBIO_MOLDE"
  | "AJUSTE_PROCESO"
  | "OTRA";

export type FilaParadaMaquina = {
  filaId: string;
  horaInicio: string;
  horaFin: string;
  tipo: TipoParadaMaquina | "";
  motivo: string;
  observaciones: string;
};

export type FilaParadaMaquinaCalculada =
  FilaParadaMaquina & {
    minutos: number;
  };

type Props = {
  onChange?: (
    paradas: FilaParadaMaquinaCalculada[],
  ) => void;
};

const tiposParada: {
  valor: TipoParadaMaquina;
  etiqueta: string;
}[] = [
  {
    valor: "MECANICA",
    etiqueta: "Mecánica",
  },
  {
    valor: "ELECTRICA",
    etiqueta: "Eléctrica",
  },
  {
    valor: "CALIDAD",
    etiqueta: "Calidad",
  },
  {
    valor: "FALTA_MATERIAL",
    etiqueta: "Falta de material",
  },
  {
    valor: "CAMBIO_MOLDE",
    etiqueta: "Cambio de molde",
  },
  {
    valor: "AJUSTE_PROCESO",
    etiqueta: "Ajuste del proceso",
  },
  {
    valor: "OTRA",
    etiqueta: "Otra",
  },
];

function crearFila(): FilaParadaMaquina {
  return {
    filaId:
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    horaInicio: "",
    horaFin: "",
    tipo: "",
    motivo: "",
    observaciones: "",
  };
}

function minutosDesdeMedianoche(hora: string) {
  const [horasTexto, minutosTexto] =
    hora.split(":");

  const horas = Number(horasTexto);
  const minutos = Number(minutosTexto);

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

function calcularMinutos(
  horaInicio: string,
  horaFin: string,
) {
  const inicio =
    minutosDesdeMedianoche(horaInicio);
  const fin = minutosDesdeMedianoche(horaFin);

  if (inicio === null || fin === null) {
    return 0;
  }

  if (fin >= inicio) {
    return fin - inicio;
  }

  return 24 * 60 - inicio + fin;
}

function calcularFila(
  fila: FilaParadaMaquina,
): FilaParadaMaquinaCalculada {
  return {
    ...fila,
    minutos: calcularMinutos(
      fila.horaInicio,
      fila.horaFin,
    ),
  };
}

export default function ParadasMaquinaForm({
  onChange,
}: Props) {
  const [filas, setFilas] = useState<
    FilaParadaMaquina[]
  >([crearFila()]);

  const calculadas = useMemo(
    () => filas.map(calcularFila),
    [filas],
  );

  const totalMinutos = useMemo(
    () =>
      calculadas.reduce(
        (total, fila) => total + fila.minutos,
        0,
      ),
    [calculadas],
  );

  function emitir(
    nuevasFilas: FilaParadaMaquina[],
  ) {
    onChange?.(
      nuevasFilas.map(calcularFila),
    );
  }

  function actualizar(
    filaId: string,
    campo: keyof FilaParadaMaquina,
    valor: string,
  ) {
    const nuevasFilas = filas.map((fila) =>
      fila.filaId === filaId
        ? {
            ...fila,
            [campo]: valor,
          }
        : fila,
    );

    setFilas(nuevasFilas);
    emitir(nuevasFilas);
  }

  function agregarFila() {
    const nuevasFilas = [...filas, crearFila()];
    setFilas(nuevasFilas);
    emitir(nuevasFilas);
  }

  function eliminarFila(filaId: string) {
    const nuevasFilas =
      filas.length === 1
        ? [crearFila()]
        : filas.filter(
            (fila) => fila.filaId !== filaId,
          );

    setFilas(nuevasFilas);
    emitir(nuevasFilas);
  }

  function limpiar() {
    const nuevasFilas = [crearFila()];
    setFilas(nuevasFilas);
    emitir(nuevasFilas);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
            <Wrench className="h-6 w-6 text-amber-700" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              Paradas de máquina
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Registre las interrupciones del turno y su causa.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={agregarFila}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Agregar parada
          </button>

          <button
            type="button"
            onClick={limpiar}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar paradas
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {calculadas.map((fila, indice) => (
          <article
            key={fila.filaId}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-black text-slate-900">
                    Parada {indice + 1}
                  </p>

                  <p className="text-xs font-semibold text-slate-500">
                    {fila.minutos} minutos detenidos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  eliminarFila(fila.filaId)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                aria-label="Eliminar parada"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Campo titulo="Hora de inicio">
                <input
                  type="time"
                  value={fila.horaInicio}
                  onChange={(evento) =>
                    actualizar(
                      fila.filaId,
                      "horaInicio",
                      evento.target.value,
                    )
                  }
                  className={claseCampo}
                />
              </Campo>

              <Campo titulo="Hora de fin">
                <input
                  type="time"
                  value={fila.horaFin}
                  onChange={(evento) =>
                    actualizar(
                      fila.filaId,
                      "horaFin",
                      evento.target.value,
                    )
                  }
                  className={claseCampo}
                />
              </Campo>

              <Campo titulo="Minutos automáticos">
                <div className="flex h-11 items-center rounded-xl border border-amber-100 bg-amber-50 px-3 text-sm font-black text-slate-800">
                  {fila.minutos} min
                </div>
              </Campo>

              <Campo titulo="Clasificación">
                <select
                  value={fila.tipo}
                  onChange={(evento) =>
                    actualizar(
                      fila.filaId,
                      "tipo",
                      evento.target.value,
                    )
                  }
                  className={claseCampo}
                >
                  <option value="">
                    Seleccione el tipo
                  </option>

                  {tiposParada.map((tipo) => (
                    <option
                      key={tipo.valor}
                      value={tipo.valor}
                    >
                      {tipo.etiqueta}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo titulo="Motivo">
                <input
                  value={fila.motivo}
                  onChange={(evento) =>
                    actualizar(
                      fila.filaId,
                      "motivo",
                      evento.target.value,
                    )
                  }
                  placeholder="Ejemplo: cambio de molde"
                  className={claseCampo}
                />
              </Campo>
            </div>

            <div className="mt-4">
              <Campo titulo="Observaciones">
                <textarea
                  value={fila.observaciones}
                  onChange={(evento) =>
                    actualizar(
                      fila.filaId,
                      "observaciones",
                      evento.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Detalle adicional de la parada..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                />
              </Campo>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-slate-950 to-amber-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              Tiempo detenido total
            </p>

            <p className="mt-2 text-4xl font-black">
              {totalMinutos} minutos
            </p>

            <p className="mt-2 text-sm font-semibold text-amber-100">
              Suma de todas las paradas registradas.
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
            <TimerReset className="h-8 w-8" />
          </div>
        </div>
      </div>
    </section>
  );
}

const claseCampo =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-100";

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black text-slate-600">
        {titulo}
      </label>

      {children}
    </div>
  );
}