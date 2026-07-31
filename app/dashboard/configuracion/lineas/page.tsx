"use client";

import {
  CheckCircle2,
  Edit3,
  Factory,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Search,
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
  tipo: string;
  descripcion: string | null;
  activo: boolean;
  planta: Planta;
  _count: {
    maquinas: number;
  };
};

type Respuesta = {
  ok: boolean;
  mensaje?: string;
  lineas: Linea[];
  plantas: Planta[];
  tipos: string[];
};

const inicial = {
  id: "",
  plantaId: "",
  codigo: "",
  nombre: "",
  tipo: "SOPLADO",
  descripcion: "",
  activo: true,
};

function nombreTipo(tipo: string) {
  return tipo
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letra) =>
      letra.toUpperCase(),
    );
}

export default function LineasPage() {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modal, setModal] = useState(false);
  const [formulario, setFormulario] =
    useState(inicial);

  async function cargar() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
        "/api/configuracion/lineas",
        { cache: "no-store" },
      );

      const datos =
        (await respuesta.json()) as Respuesta;

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudieron cargar las líneas.",
        );
      }

      setLineas(datos.lineas);
      setPlantas(datos.plantas);
      setTipos(datos.tipos);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudieron cargar las líneas.",
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

    if (!texto) return lineas;

    return lineas.filter((linea) =>
      [
        linea.codigo,
        linea.nombre,
        linea.tipo,
        linea.planta.nombre,
        linea.descripcion ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto),
    );
  }, [lineas, busqueda]);

  function nueva() {
    setFormulario({
      ...inicial,
      plantaId: plantas[0]?.id ?? "",
    });
    setError("");
    setMensaje("");
    setModal(true);
  }

  function editar(linea: Linea) {
    setFormulario({
      id: linea.id,
      plantaId: linea.plantaId,
      codigo: linea.codigo,
      nombre: linea.nombre,
      tipo: linea.tipo,
      descripcion: linea.descripcion ?? "",
      activo: linea.activo,
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
        "/api/configuracion/lineas",
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
            "No se pudo guardar la línea.",
        );
      }

      setModal(false);
      setMensaje(
        datos.mensaje ??
          "Línea guardada correctamente.",
      );
      await cargar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo guardar la línea.",
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
          Líneas de producción
        </h1>
        <p className="mt-3 text-sm font-medium text-slate-200">
          Administre las líneas disponibles y las máquinas asociadas.
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
              placeholder="Buscar línea..."
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
              Nueva línea
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
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-black uppercase text-slate-500">
                  <th className="px-5 py-4">Línea</th>
                  <th className="px-5 py-4">Planta</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4">Máquinas</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtradas.map((linea) => (
                  <tr key={linea.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <Factory className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-950">
                            {linea.nombre}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {linea.codigo}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {linea.planta.nombre}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {nombreTipo(linea.tipo)}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-slate-950">
                      {linea._count.maquinas}
                    </td>
                    <td className="px-5 py-4">
                      <span className={[
                        "rounded-full border px-3 py-1 text-xs font-black",
                        linea.activo
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-slate-100 text-slate-600",
                      ].join(" ")}>
                        {linea.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => editar(linea)}
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
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase text-blue-600">
                  Configuración
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {formulario.id
                    ? "Editar línea"
                    : "Nueva línea"}
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
              <select
                value={formulario.plantaId}
                onChange={(e) =>
                  setFormulario((actual) => ({
                    ...actual,
                    plantaId: e.target.value,
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

              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <select
                value={formulario.tipo}
                onChange={(e) =>
                  setFormulario((actual) => ({
                    ...actual,
                    tipo: e.target.value,
                  }))
                }
                className={campo}
              >
                {tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {nombreTipo(tipo)}
                  </option>
                ))}
              </select>

              <textarea
                value={formulario.descripcion}
                onChange={(e) =>
                  setFormulario((actual) => ({
                    ...actual,
                    descripcion: e.target.value,
                  }))
                }
                placeholder="Descripción"
                rows={4}
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
                    Línea activa
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
                  {guardando ? "Guardando..." : "Guardar línea"}
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
