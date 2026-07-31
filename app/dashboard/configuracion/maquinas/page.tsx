"use client";

import {
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Planta = {
  id: string;
  codigo: string;
  nombre: string;
};

type Linea = {
  id: string;
  plantaId: string;
  codigo: string;
  nombre: string;
};

type Maquina = {
  id: string;
  plantaId: string;
  lineaProduccionId: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  anioFabricacion: number | null;
  capacidadNominal: string | number | null;
  unidadCapacidad: string | null;
  estado: string;
  observaciones: string | null;
  activo: boolean;
  planta: Planta;
  lineaProduccion: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
};

type Respuesta = {
  ok: boolean;
  mensaje?: string;
  maquinas: Maquina[];
  plantas: Planta[];
  lineas: Linea[];
  estados: string[];
};

const inicial = {
  id: "",
  plantaId: "",
  lineaProduccionId: "",
  codigo: "",
  nombre: "",
  descripcion: "",
  marca: "",
  modelo: "",
  numeroSerie: "",
  anioFabricacion: "",
  capacidadNominal: "",
  unidadCapacidad: "",
  estado: "OPERATIVA",
  observaciones: "",
  activo: true,
};

function etiquetaEstado(estado: string) {
  return estado
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letra) =>
      letra.toUpperCase(),
    );
}

export default function MaquinasPage() {
  const [maquinas, setMaquinas] =
    useState<Maquina[]>([]);
  const [plantas, setPlantas] =
    useState<Planta[]>([]);
  const [lineas, setLineas] =
    useState<Linea[]>([]);
  const [estados, setEstados] =
    useState<string[]>([]);
  const [cargando, setCargando] =
    useState(true);
  const [guardando, setGuardando] =
    useState(false);
  const [busqueda, setBusqueda] =
    useState("");
  const [error, setError] =
    useState("");
  const [mensaje, setMensaje] =
    useState("");
  const [modal, setModal] =
    useState(false);
  const [formulario, setFormulario] =
    useState(inicial);

  async function cargar() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
        "/api/configuracion/maquinas",
        { cache: "no-store" },
      );

      const datos =
        (await respuesta.json()) as Respuesta;

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudieron cargar las máquinas.",
        );
      }

      setMaquinas(datos.maquinas);
      setPlantas(datos.plantas);
      setLineas(datos.lineas);
      setEstados(datos.estados);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar las máquinas.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return maquinas;

    return maquinas.filter((maquina) =>
      [
        maquina.codigo,
        maquina.nombre,
        maquina.marca ?? "",
        maquina.modelo ?? "",
        maquina.estado,
        maquina.lineaProduccion?.nombre ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto),
    );
  }, [maquinas, busqueda]);

  const lineasDisponibles = lineas.filter(
    (linea) =>
      !formulario.plantaId ||
      linea.plantaId === formulario.plantaId,
  );

  function nueva() {
    const plantaId = plantas[0]?.id ?? "";

    setFormulario({
      ...inicial,
      plantaId,
      lineaProduccionId:
        lineas.find(
          (linea) =>
            linea.plantaId === plantaId,
        )?.id ?? "",
    });
    setError("");
    setMensaje("");
    setModal(true);
  }

  function editar(maquina: Maquina) {
    setFormulario({
      id: maquina.id,
      plantaId: maquina.plantaId,
      lineaProduccionId:
        maquina.lineaProduccionId ?? "",
      codigo: maquina.codigo,
      nombre: maquina.nombre,
      descripcion: maquina.descripcion ?? "",
      marca: maquina.marca ?? "",
      modelo: maquina.modelo ?? "",
      numeroSerie: maquina.numeroSerie ?? "",
      anioFabricacion:
        maquina.anioFabricacion?.toString() ?? "",
      capacidadNominal:
        maquina.capacidadNominal?.toString() ?? "",
      unidadCapacidad:
        maquina.unidadCapacidad ?? "",
      estado: maquina.estado,
      observaciones:
        maquina.observaciones ?? "",
      activo: maquina.activo,
    });
    setError("");
    setMensaje("");
    setModal(true);
  }

  async function guardar(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        "/api/configuracion/maquinas",
        {
          method: formulario.id
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulario),
        },
      );

      const datos = (await respuesta.json()) as {
        ok: boolean;
        mensaje?: string;
      };

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudo guardar la máquina.",
        );
      }

      setModal(false);
      setMensaje(
        datos.mensaje ??
          "Máquina guardada correctamente.",
      );
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo guardar la máquina.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="space-y-7">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-700 p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
          Configuración industrial
        </p>
        <h1 className="mt-3 text-3xl font-black">
          Máquinas
        </h1>
        <p className="mt-3 text-sm font-medium text-slate-200">
          Registre las máquinas, sus capacidades y su estado operativo.
        </p>
      </section>

      {mensaje && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar máquina..."
              className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void cargar()}
              className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={nueva}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              <Plus className="h-5 w-5" />
              Nueva máquina
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircle className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-black uppercase text-slate-500">
                  <th className="px-5 py-4">Máquina</th>
                  <th className="px-5 py-4">Línea</th>
                  <th className="px-5 py-4">Marca / modelo</th>
                  <th className="px-5 py-4">Capacidad</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Activa</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtradas.map((maquina) => (
                  <tr key={maquina.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-950">
                            {maquina.nombre}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {maquina.codigo}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {maquina.lineaProduccion?.nombre ??
                        "Sin línea"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {[maquina.marca, maquina.modelo]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {maquina.capacidadNominal
                        ? `${maquina.capacidadNominal} ${maquina.unidadCapacidad ?? ""}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {etiquetaEstado(maquina.estado)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {maquina.activo ? "Sí" : "No"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => editar(maquina)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase text-blue-600">
                  Configuración
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {formulario.id
                    ? "Editar máquina"
                    : "Nueva máquina"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={formulario.plantaId}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      plantaId: e.target.value,
                      lineaProduccionId: "",
                    }))
                  }
                  required
                  className={campo}
                >
                  <option value="">Seleccione una planta</option>
                  {plantas.map((planta) => (
                    <option key={planta.id} value={planta.id}>
                      {planta.codigo} - {planta.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={formulario.lineaProduccionId}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      lineaProduccionId: e.target.value,
                    }))
                  }
                  className={campo}
                >
                  <option value="">Sin línea asignada</option>
                  {lineasDisponibles.map((linea) => (
                    <option key={linea.id} value={linea.id}>
                      {linea.codigo} - {linea.nombre}
                    </option>
                  ))}
                </select>

                <input
                  value={formulario.codigo}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      codigo: e.target.value,
                    }))
                  }
                  placeholder="Código"
                  required
                  className={campo}
                />

                <input
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      nombre: e.target.value,
                    }))
                  }
                  placeholder="Nombre"
                  required
                  className={campo}
                />

                <input
                  value={formulario.marca}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      marca: e.target.value,
                    }))
                  }
                  placeholder="Marca"
                  className={campo}
                />

                <input
                  value={formulario.modelo}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      modelo: e.target.value,
                    }))
                  }
                  placeholder="Modelo"
                  className={campo}
                />

                <input
                  value={formulario.numeroSerie}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      numeroSerie: e.target.value,
                    }))
                  }
                  placeholder="Número de serie"
                  className={campo}
                />

                <input
                  type="number"
                  value={formulario.anioFabricacion}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      anioFabricacion: e.target.value,
                    }))
                  }
                  placeholder="Año fabricación"
                  className={campo}
                />

                <input
                  type="number"
                  step="0.001"
                  value={formulario.capacidadNominal}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      capacidadNominal: e.target.value,
                    }))
                  }
                  placeholder="Capacidad nominal"
                  className={campo}
                />

                <input
                  value={formulario.unidadCapacidad}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      unidadCapacidad: e.target.value,
                    }))
                  }
                  placeholder="Unidad de capacidad"
                  className={campo}
                />

                <select
                  value={formulario.estado}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      estado: e.target.value,
                    }))
                  }
                  className={campo}
                >
                  {estados.map((estado) => (
                    <option key={estado} value={estado}>
                      {etiquetaEstado(estado)}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={formulario.descripcion}
                onChange={(e) =>
                  setFormulario((actual) => ({
                    ...actual,
                    descripcion: e.target.value,
                  }))
                }
                placeholder="Descripción"
                rows={3}
                className={campo}
              />

              <textarea
                value={formulario.observaciones}
                onChange={(e) =>
                  setFormulario((actual) => ({
                    ...actual,
                    observaciones: e.target.value,
                  }))
                }
                placeholder="Observaciones"
                rows={3}
                className={campo}
              />

              {formulario.id && (
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={formulario.activo}
                    onChange={(e) =>
                      setFormulario((actual) => ({
                        ...actual,
                        activo: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm font-black text-slate-700">
                    Máquina activa
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white"
                >
                  {guardando ? "Guardando..." : "Guardar máquina"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const campo =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
