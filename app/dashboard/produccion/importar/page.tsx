"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useState,
} from "react";

type ErrorImportacion = {
  hoja: string;
  fila: number;
  mensaje: string;
};

type Resultado = {
  ok: boolean;
  valido?: boolean;
  mensaje: string;
  archivo?: string;
  resumen?: {
    producciones: number;
    moliendas: number;
    consumos: number;
    paradas: number;
    errores: number;
    importados?: number;
  };
  errores?: ErrorImportacion[];
};

const LIMITE_MB = 15;

export default function ImportarProduccionPage() {
  const [archivo, setArchivo] =
    useState<File | null>(null);
  const [resultado, setResultado] =
    useState<Resultado | null>(null);
  const [procesando, setProcesando] =
    useState(false);
  const [arrastrando, setArrastrando] =
    useState(false);
  const [cantidadSimulados, setCantidadSimulados] =
    useState<number | null>(null);
  const [consultandoSimulados, setConsultandoSimulados] =
    useState(false);
  const [eliminandoSimulados, setEliminandoSimulados] =
    useState(false);
  const [confirmacionEliminar, setConfirmacionEliminar] =
    useState("");
  const [mensajeSimulados, setMensajeSimulados] =
    useState("");

  function seleccionarArchivo(
    seleccionado: File | null,
  ) {
    setResultado(null);

    if (!seleccionado) {
      setArchivo(null);
      return;
    }

    if (
      !seleccionado.name
        .toLowerCase()
        .endsWith(".xlsx")
    ) {
      setArchivo(null);
      setResultado({
        ok: false,
        mensaje:
          "Seleccione un archivo Excel con extensión .xlsx.",
      });
      return;
    }

    if (
      seleccionado.size >
      LIMITE_MB * 1024 * 1024
    ) {
      setArchivo(null);
      setResultado({
        ok: false,
        mensaje: `El archivo no debe superar ${LIMITE_MB} MB.`,
      });
      return;
    }

    setArchivo(seleccionado);
  }

  function alCambiarArchivo(
    evento: ChangeEvent<HTMLInputElement>,
  ) {
    seleccionarArchivo(
      evento.target.files?.[0] ?? null,
    );
  }

  function alSoltar(
    evento: DragEvent<HTMLLabelElement>,
  ) {
    evento.preventDefault();
    setArrastrando(false);

    seleccionarArchivo(
      evento.dataTransfer.files?.[0] ?? null,
    );
  }

  async function procesar(
    modo: "validar" | "importar",
  ) {
    if (!archivo) {
      setResultado({
        ok: false,
        mensaje:
          "Seleccione primero el Excel de simulación.",
      });
      return;
    }

    try {
      setProcesando(true);

      const formulario = new FormData();
      formulario.append("archivo", archivo);

      const respuesta = await fetch(
        `/api/produccion/importar?modo=${modo}`,
        {
          method: "POST",
          body: formulario,
        },
      );

      const datos =
        (await respuesta.json()) as Resultado;

      setResultado(datos);
    } catch {
      setResultado({
        ok: false,
        mensaje:
          "No se pudo comunicar con el servidor.",
      });
    } finally {
      setProcesando(false);
    }
  }

  function reiniciar() {
    setArchivo(null);
    setResultado(null);
  }

  async function consultarSimulados() {
    try {
      setConsultandoSimulados(true);
      setMensajeSimulados("");

      const respuesta = await fetch(
        "/api/produccion/simulaciones",
        {
          cache: "no-store",
        },
      );

      const datos = (await respuesta.json()) as {
        ok: boolean;
        cantidad?: number;
        mensaje?: string;
      };

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudieron consultar los datos simulados.",
        );
      }

      setCantidadSimulados(datos.cantidad ?? 0);
      setMensajeSimulados(datos.mensaje ?? "");
    } catch (errorDesconocido) {
      setMensajeSimulados(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron consultar los datos simulados.",
      );
    } finally {
      setConsultandoSimulados(false);
    }
  }

  async function eliminarSimulados() {
    if (
      confirmacionEliminar !==
      "ELIMINAR DATOS SIMULADOS"
    ) {
      setMensajeSimulados(
        'Escriba exactamente: ELIMINAR DATOS SIMULADOS',
      );
      return;
    }

    try {
      setEliminandoSimulados(true);
      setMensajeSimulados("");

      const respuesta = await fetch(
        "/api/produccion/simulaciones",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            confirmacion: confirmacionEliminar,
          }),
        },
      );

      const datos = (await respuesta.json()) as {
        ok: boolean;
        eliminados?: number;
        mensaje?: string;
      };

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudieron eliminar los datos simulados.",
        );
      }

      setCantidadSimulados(0);
      setConfirmacionEliminar("");
      setMensajeSimulados(
        datos.mensaje ??
          "Los datos simulados fueron eliminados.",
      );
    } catch (errorDesconocido) {
      setMensajeSimulados(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron eliminar los datos simulados.",
      );
    } finally {
      setEliminandoSimulados(false);
    }
  }

  const puedeImportar =
    Boolean(archivo) &&
    resultado?.valido === true &&
    (resultado.errores?.length ?? 0) === 0;

  return (
    <main className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950 to-blue-700 p-7 text-white shadow-xl md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          Herramienta de pruebas
        </p>

        <h1 className="mt-3 text-3xl font-black md:text-4xl">
          Importar simulación de producción
        </h1>

        <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-slate-200 md:text-base">
          Valide e importe un Excel con producción,
          molienda, consumo de materia prima y paradas
          para visualizar el dashboard con información
          simulada.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <TarjetaPaso
          numero="1"
          titulo="Seleccionar Excel"
          texto="Use la plantilla de simulación con las cuatro hojas obligatorias."
        />

        <TarjetaPaso
          numero="2"
          titulo="Validar"
          texto="El sistema revisará columnas, catálogos, lotes y cantidades."
        />

        <TarjetaPaso
          numero="3"
          titulo="Importar"
          texto="Los registros se guardarán marcados como datos simulados."
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <label
          onDragOver={(evento) => {
            evento.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() =>
            setArrastrando(false)
          }
          onDrop={alSoltar}
          className={[
            "flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition",
            arrastrando
              ? "border-cyan-500 bg-cyan-50"
              : "border-slate-300 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/50",
          ].join(" ")}
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={alCambiarArchivo}
            className="hidden"
          />

          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-700">
            <UploadCloud className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-xl font-black text-slate-950">
            Arrastre el Excel o haga clic aquí
          </h2>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Archivo .xlsx · máximo {LIMITE_MB} MB
          </p>

          {archivo && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-left shadow-sm">
              <FileSpreadsheet className="h-6 w-6 text-cyan-700" />

              <div>
                <p className="font-black text-slate-900">
                  {archivo.name}
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  {(archivo.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reiniciar}
            disabled={procesando}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Reiniciar
          </button>

          <button
            type="button"
            onClick={() => void procesar("validar")}
            disabled={!archivo || procesando}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
            Validar archivo
          </button>

          <button
            type="button"
            onClick={() => void procesar("importar")}
            disabled={!puedeImportar || procesando}
            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
            Importar simulación
          </button>
        </div>
      </section>

      {resultado && (
        <section
          className={[
            "rounded-3xl border p-6 shadow-sm md:p-8",
            resultado.ok
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50",
          ].join(" ")}
        >
          <div className="flex items-start gap-4">
            {resultado.ok ? (
              <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-1 h-7 w-7 shrink-0 text-red-600" />
            )}

            <div className="min-w-0 flex-1">
              <h2
                className={[
                  "text-lg font-black",
                  resultado.ok
                    ? "text-emerald-900"
                    : "text-red-900",
                ].join(" ")}
              >
                {resultado.mensaje}
              </h2>

              {resultado.archivo && (
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Archivo: {resultado.archivo}
                </p>
              )}
            </div>
          </div>

          {resultado.resumen && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Resumen
                titulo="Producciones"
                valor={resultado.resumen.producciones}
              />
              <Resumen
                titulo="Moliendas"
                valor={resultado.resumen.moliendas}
              />
              <Resumen
                titulo="Consumos"
                valor={resultado.resumen.consumos}
              />
              <Resumen
                titulo="Paradas"
                valor={resultado.resumen.paradas}
              />
              <Resumen
                titulo={
                  resultado.resumen.importados
                    ? "Importados"
                    : "Errores"
                }
                valor={
                  resultado.resumen.importados ??
                  resultado.resumen.errores
                }
              />
            </div>
          )}

          {(resultado.errores?.length ?? 0) >
            0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white">
              <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />

                <p className="text-sm font-black text-red-800">
                  Errores encontrados
                </p>
              </div>

              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">
                        Hoja
                      </th>
                      <th className="px-4 py-3">
                        Fila
                      </th>
                      <th className="px-4 py-3">
                        Problema
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {resultado.errores?.map(
                      (error, indice) => (
                        <tr
                          key={`${error.hoja}-${error.fila}-${indice}`}
                          className="text-sm font-semibold text-slate-700"
                        >
                          <td className="px-4 py-3 font-black">
                            {error.hoja}
                          </td>
                          <td className="px-4 py-3">
                            {error.fila || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {error.mensaje}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <Trash2 className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-black text-red-950">
                  Administrar datos simulados
                </h2>

                <p className="mt-1 text-sm font-semibold text-red-800">
                  Esta acción elimina únicamente registros con
                  esSimulacion = true. La producción real no se toca.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void consultarSimulados()}
                disabled={
                  consultandoSimulados ||
                  eliminandoSimulados
                }
                className="flex items-center justify-center gap-2 rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-black text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {consultandoSimulados ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-5 w-5" />
                )}
                Consultar simulaciones
              </button>

              {cantidadSimulados !== null && (
                <div className="rounded-2xl border border-red-200 bg-white px-5 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-red-600">
                    Registros simulados
                  </p>

                  <p className="mt-1 text-2xl font-black text-red-950">
                    {cantidadSimulados}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-5">
            <label className="text-xs font-black uppercase tracking-wide text-slate-600">
              Confirmación obligatoria
            </label>

            <input
              value={confirmacionEliminar}
              onChange={(evento) =>
                setConfirmacionEliminar(
                  evento.target.value,
                )
              }
              placeholder="ELIMINAR DATOS SIMULADOS"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Escriba exactamente: ELIMINAR DATOS SIMULADOS
            </p>

            <button
              type="button"
              onClick={() => void eliminarSimulados()}
              disabled={
                eliminandoSimulados ||
                cantidadSimulados === 0 ||
                confirmacionEliminar !==
                  "ELIMINAR DATOS SIMULADOS"
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {eliminandoSimulados ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
              Eliminar datos simulados
            </button>
          </div>
        </div>

        {mensajeSimulados && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-800">
            {mensajeSimulados}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

          <p className="text-sm font-bold leading-6 text-blue-900">
            Los cálculos de eficiencia, rechazo,
            cumplimiento, minutos de parada y consumo real
            se vuelven a calcular en el servidor antes de
            guardar.
          </p>
        </div>
      </section>
    </main>
  );
}

function TarjetaPaso({
  numero,
  titulo,
  texto,
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-sm font-black text-cyan-800">
        {numero}
      </div>

      <h2 className="mt-4 text-lg font-black text-slate-950">
        {titulo}
      </h2>

      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {texto}
      </p>
    </article>
  );
}

function Resumen({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <article className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {valor}
      </p>
    </article>
  );
}