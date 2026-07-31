"use client";

import {
  CheckCircle2,
  Clock3,
  Moon,
  Pencil,
  Plus,
  Save,
  Sun,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type Turno = {
  id: string;
  codigo: string;
  nombre: string;
  horaInicio: string;
  horaSalida: string;
  cruzaMedianoche: boolean;
  color: string | null;
  orden: number;
  toleranciaIngresoMin: number;
  toleranciaSalidaMin: number;
  seleccionAutomatica: boolean;
  descripcion: string | null;
  activo: boolean;
};

type FormularioTurno = {
  id: string;
  codigo: string;
  nombre: string;
  horaInicio: string;
  horaSalida: string;
  cruzaMedianoche: boolean;
  color: string;
  orden: string;
  toleranciaIngresoMin: string;
  toleranciaSalidaMin: string;
  seleccionAutomatica: boolean;
  descripcion: string;
  activo: boolean;
};

const formularioInicial: FormularioTurno = {
  id: "",
  codigo: "",
  nombre: "",
  horaInicio: "07:00",
  horaSalida: "19:00",
  cruzaMedianoche: false,
  color: "#2563EB",
  orden: "1",
  toleranciaIngresoMin: "0",
  toleranciaSalidaMin: "0",
  seleccionAutomatica: true,
  descripcion: "",
  activo: true,
};

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [formulario, setFormulario] =
    useState<FormularioTurno>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarTurnos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch("/api/turnos", {
        cache: "no-store",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ?? "No se pudieron cargar los turnos.",
        );
      }

      setTurnos(datos.turnos);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar los turnos.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarTurnos();
  }, [cargarTurnos]);

  function actualizarCampo<K extends keyof FormularioTurno>(
    campo: K,
    valor: FormularioTurno[K],
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function nuevoTurno() {
    const siguienteOrden =
      turnos.length > 0
        ? Math.max(...turnos.map((turno) => turno.orden)) + 1
        : 1;

    setFormulario({
      ...formularioInicial,
      orden: String(siguienteOrden),
    });

    setMensaje("");
    setError("");
  }

  function editarTurno(turno: Turno) {
    setFormulario({
      id: turno.id,
      codigo: turno.codigo,
      nombre: turno.nombre,
      horaInicio: turno.horaInicio,
      horaSalida: turno.horaSalida,
      cruzaMedianoche: turno.cruzaMedianoche,
      color: turno.color ?? "#2563EB",
      orden: String(turno.orden),
      toleranciaIngresoMin: String(
        turno.toleranciaIngresoMin,
      ),
      toleranciaSalidaMin: String(
        turno.toleranciaSalidaMin,
      ),
      seleccionAutomatica: turno.seleccionAutomatica,
      descripcion: turno.descripcion ?? "",
      activo: turno.activo,
    });

    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function guardarTurno(evento: FormEvent) {
    evento.preventDefault();

    try {
      setGuardando(true);
      setMensaje("");
      setError("");

      const respuesta = await fetch("/api/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formulario,
          orden: Number(formulario.orden),
          toleranciaIngresoMin: Number(
            formulario.toleranciaIngresoMin,
          ),
          toleranciaSalidaMin: Number(
            formulario.toleranciaSalidaMin,
          ),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ?? "No se pudo guardar el turno.",
        );
      }

      setMensaje(datos.mensaje);
      nuevoTurno();
      await cargarTurnos();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo guardar el turno.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Configuración
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Turnos de producción
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
              Modifica los horarios del turno día, turno noche o
              registra nuevos turnos según la operación de la planta.
            </p>
          </div>

          <button
            type="button"
            onClick={nuevoTurno}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Nuevo turno
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={guardarTurno}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                {formulario.id ? "Editar turno" : "Registrar turno"}
              </h3>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Los horarios se mostrarán automáticamente en
                Producción.
              </p>
            </div>

            <Clock3 className="h-7 w-7 text-blue-600" />
          </div>

          {mensaje && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              {mensaje}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <X className="h-5 w-5" />
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Código
              </label>

              <input
                value={formulario.codigo}
                onChange={(evento) =>
                  actualizarCampo("codigo", evento.target.value)
                }
                placeholder="Ejemplo: 1"
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Orden
              </label>

              <input
                type="number"
                min="1"
                value={formulario.orden}
                onChange={(evento) =>
                  actualizarCampo("orden", evento.target.value)
                }
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                Nombre
              </label>

              <input
                value={formulario.nombre}
                onChange={(evento) =>
                  actualizarCampo("nombre", evento.target.value)
                }
                placeholder="Ejemplo: Turno Día"
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Hora de inicio
              </label>

              <input
                type="time"
                value={formulario.horaInicio}
                onChange={(evento) =>
                  actualizarCampo(
                    "horaInicio",
                    evento.target.value,
                  )
                }
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Hora de salida
              </label>

              <input
                type="time"
                value={formulario.horaSalida}
                onChange={(evento) =>
                  actualizarCampo(
                    "horaSalida",
                    evento.target.value,
                  )
                }
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Color
              </label>

              <input
                type="color"
                value={formulario.color}
                onChange={(evento) =>
                  actualizarCampo("color", evento.target.value)
                }
                className="h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white p-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Estado
              </label>

              <select
                value={formulario.activo ? "activo" : "inactivo"}
                onChange={(evento) =>
                  actualizarCampo(
                    "activo",
                    evento.target.value === "activo",
                  )
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={formulario.cruzaMedianoche}
                onChange={(evento) =>
                  actualizarCampo(
                    "cruzaMedianoche",
                    evento.target.checked,
                  )
                }
                className="h-5 w-5 rounded border-slate-300"
              />

              <span className="text-sm font-bold text-slate-700">
                Este turno termina al día siguiente
              </span>
            </label>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Tolerancia de ingreso
              </label>

              <input
                type="number"
                min="0"
                value={formulario.toleranciaIngresoMin}
                onChange={(evento) =>
                  actualizarCampo(
                    "toleranciaIngresoMin",
                    evento.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Minutos
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Tolerancia de salida
              </label>

              <input
                type="number"
                min="0"
                value={formulario.toleranciaSalidaMin}
                onChange={(evento) =>
                  actualizarCampo(
                    "toleranciaSalidaMin",
                    evento.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Minutos
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                Descripción
              </label>

              <textarea
                rows={3}
                value={formulario.descripcion}
                onChange={(evento) =>
                  actualizarCampo(
                    "descripcion",
                    evento.target.value,
                  )
                }
                placeholder="Descripción opcional"
                className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            {guardando
              ? "Guardando..."
              : formulario.id
                ? "Actualizar turno"
                : "Guardar turno"}
          </button>
        </form>

        <div className="space-y-4">
          {cargando ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-500 shadow-sm">
              Cargando turnos...
            </div>
          ) : (
            turnos.map((turno) => {
              const EsNoche =
                turno.cruzaMedianoche ||
                turno.nombre.toLowerCase().includes("noche");

              const Icono = EsNoche ? Moon : Sun;

              return (
                <article
                  key={turno.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                        style={{
                          backgroundColor:
                            turno.color ?? "#2563EB",
                        }}
                      >
                        <Icono className="h-7 w-7" />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                          Código {turno.codigo}
                        </p>

                        <h3 className="mt-1 text-xl font-black text-slate-950">
                          {turno.nombre}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {turno.horaInicio} a {turno.horaSalida}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "rounded-full px-3 py-1.5 text-xs font-black",
                          turno.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {turno.activo ? "Activo" : "Inactivo"}
                      </span>

                      <button
                        type="button"
                        onClick={() => editarTurno(turno)}
                        className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}