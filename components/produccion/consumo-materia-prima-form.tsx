"use client";

import {
  BarChart3,
  Boxes,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

export type MaterialConsumoOpcion = {
  id: string;
  codigo: string;
  codigoSap: string | null;
  nombre: string;
  unidadMedida: {
    simbolo: string;
  } | null;
};

export type FilaConsumoMateriaPrima = {
  filaId: string;
  productoId: string;
  cantidadInicial: string;
  cantidadConsumida: string;
  consumoEstandarEnvase: string;
  observaciones: string;
};

export type FilaConsumoMateriaPrimaCalculada =
  FilaConsumoMateriaPrima & {
    cantidadFinal: number;
    consumoRealEnvase: number;
    diferenciaConsumo: number;
    rendimiento: number;
  };

type Props = {
  materiales: MaterialConsumoOpcion[];
  productosBuenos: number;
  pesoEnvaseKg: number;
  onChange?: (
    filas: FilaConsumoMateriaPrimaCalculada[],
  ) => void;
};

function crearFila(): FilaConsumoMateriaPrima {
  return {
    filaId:
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    productoId: "",
    cantidadInicial: "",
    cantidadConsumida: "",
    consumoEstandarEnvase: "",
    observaciones: "",
  };
}

function numero(valor: string) {
  const convertido = Number(
    valor.trim().replace(",", "."),
  );

  return Number.isFinite(convertido)
    ? Math.max(0, convertido)
    : 0;
}

function calcularFila(
  fila: FilaConsumoMateriaPrima,
  productosBuenos: number,
  pesoEnvaseKg: number,
): FilaConsumoMateriaPrimaCalculada {
  const inicial = numero(fila.cantidadInicial);
  const consumida = numero(fila.cantidadConsumida);
  const estandar = numero(fila.consumoEstandarEnvase);

  const cantidadFinal = Math.max(0, inicial - consumida);

  const consumoRealEnvase =
    productosBuenos > 0
      ? consumida / productosBuenos
      : 0;

  const diferenciaConsumo =
    estandar > 0
      ? consumoRealEnvase - estandar
      : 0;

  const pesoProduccionBuena =
    productosBuenos * Math.max(0, pesoEnvaseKg);

  const rendimiento =
    consumida > 0
      ? (pesoProduccionBuena / consumida) * 100
      : 0;

  return {
    ...fila,
    cantidadFinal,
    consumoRealEnvase,
    diferenciaConsumo,
    rendimiento,
  };
}

export default function ConsumoMateriaPrimaForm({
  materiales,
  productosBuenos,
  pesoEnvaseKg,
  onChange,
}: Props) {
  const [filas, setFilas] = useState<
    FilaConsumoMateriaPrima[]
  >([crearFila()]);

  const calculadas = useMemo(
    () =>
      filas.map((fila) =>
        calcularFila(
          fila,
          productosBuenos,
          pesoEnvaseKg,
        ),
      ),
    [filas, productosBuenos, pesoEnvaseKg],
  );

  function emitir(
    nuevasFilas: FilaConsumoMateriaPrima[],
  ) {
    onChange?.(
      nuevasFilas.map((fila) =>
        calcularFila(
          fila,
          productosBuenos,
          pesoEnvaseKg,
        ),
      ),
    );
  }

  function actualizar(
    filaId: string,
    campo: keyof FilaConsumoMateriaPrima,
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50">
            <Boxes className="h-6 w-6 text-cyan-700" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              Consumo de materia prima
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Registre el consumo de HDPE virgen, molido u
              otros materiales utilizados.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={agregarFila}
            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-cyan-800"
          >
            <Plus className="h-4 w-4" />
            Agregar material
          </button>

          <button
            type="button"
            onClick={limpiar}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar consumo
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1180px] space-y-4">
          <div className="grid grid-cols-[220px_130px_130px_130px_150px_150px_150px_130px_52px] gap-3 px-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <span>Material</span>
            <span>Inicial kg</span>
            <span>Consumido kg</span>
            <span>Final kg</span>
            <span>Estándar kg/env.</span>
            <span>Real kg/env.</span>
            <span>Diferencia</span>
            <span>Rendimiento</span>
            <span />
          </div>

          {calculadas.map((fila) => (
            <div
              key={fila.filaId}
              className="grid grid-cols-[220px_130px_130px_130px_150px_150px_150px_130px_52px] gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <select
                value={fila.productoId}
                onChange={(evento) =>
                  actualizar(
                    fila.filaId,
                    "productoId",
                    evento.target.value,
                  )
                }
                className={claseCampo}
              >
                <option value="">
                  Seleccione material
                </option>

                {materiales.map((material) => (
                  <option
                    key={material.id}
                    value={material.id}
                  >
                    {material.codigoSap ??
                      material.codigo}{" "}
                    - {material.nombre}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                step="0.001"
                value={fila.cantidadInicial}
                onChange={(evento) =>
                  actualizar(
                    fila.filaId,
                    "cantidadInicial",
                    evento.target.value,
                  )
                }
                placeholder="0.000"
                className={claseCampo}
              />

              <input
                type="number"
                min="0"
                step="0.001"
                value={fila.cantidadConsumida}
                onChange={(evento) =>
                  actualizar(
                    fila.filaId,
                    "cantidadConsumida",
                    evento.target.value,
                  )
                }
                placeholder="0.000"
                className={claseCampo}
              />

              <CampoAutomatico
                valor={fila.cantidadFinal.toFixed(3)}
              />

              <input
                type="number"
                min="0"
                step="0.0001"
                value={fila.consumoEstandarEnvase}
                onChange={(evento) =>
                  actualizar(
                    fila.filaId,
                    "consumoEstandarEnvase",
                    evento.target.value,
                  )
                }
                placeholder="0.0000"
                className={claseCampo}
              />

              <CampoAutomatico
                valor={fila.consumoRealEnvase.toFixed(4)}
              />

              <CampoAutomatico
                valor={
                  fila.diferenciaConsumo > 0
                    ? `+${fila.diferenciaConsumo.toFixed(4)}`
                    : fila.diferenciaConsumo.toFixed(4)
                }
              />

              <CampoAutomatico
                valor={`${fila.rendimiento.toFixed(2)}%`}
              />

              <button
                type="button"
                onClick={() =>
                  eliminarFila(fila.filaId)
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                aria-label="Eliminar material"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <textarea
                value={fila.observaciones}
                onChange={(evento) =>
                  actualizar(
                    fila.filaId,
                    "observaciones",
                    evento.target.value,
                  )
                }
                rows={2}
                placeholder="Observaciones del material..."
                className="col-span-9 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Resumen
          titulo="Productos buenos"
          valor={`${productosBuenos}`}
        />

        <Resumen
          titulo="Peso por envase"
          valor={`${pesoEnvaseKg.toFixed(3)} kg`}
        />

        <Resumen
          titulo="Material consumido"
          valor={`${calculadas
            .reduce(
              (total, fila) =>
                total +
                numero(fila.cantidadConsumida),
              0,
            )
            .toFixed(3)} kg`}
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800">
        <BarChart3 className="mt-0.5 h-5 w-5 shrink-0" />
        El saldo final, consumo real, diferencia y rendimiento
        se calculan automáticamente.
      </div>
    </section>
  );
}

const claseCampo =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100";

function CampoAutomatico({
  valor,
}: {
  valor: string;
}) {
  return (
    <div className="flex h-11 items-center rounded-xl border border-cyan-100 bg-cyan-50 px-3 text-sm font-black text-slate-800">
      {valor}
    </div>
  );
}

function Resumen({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 text-xl font-black text-slate-950">
        {valor}
      </p>
    </article>
  );
}