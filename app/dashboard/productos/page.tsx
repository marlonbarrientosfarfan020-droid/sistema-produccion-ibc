"use client";

import {
  Edit3,
  LoaderCircle,
  PackageCheck,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Unidad = {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
};

type Producto = {
  id: string;
  unidadMedidaId: string | null;
  codigo: string;
  codigoSap: string | null;
  nombre: string;
  descripcion: string | null;
  familia: string | null;
  marca: string | null;
  pesoUnitario: number;
  capacidad: number;
  unidadCapacidad: string | null;
  stockInicial: number;
  stockActual: number;
  stockMinimo: number;
  controlaStock: boolean;
  permiteDecimal: boolean;
  observaciones: string | null;
  activo: boolean;
  estadoStock:
    | "DISPONIBLE"
    | "BAJO"
    | "AGOTADO"
    | "SIN_CONTROL";
  ultimaProduccion: string | null;
  unidadMedida: Unidad | null;
};

type Formulario = {
  id: string;
  codigo: string;
  codigoSap: string;
  nombre: string;
  descripcion: string;
  unidadMedidaId: string;
  familia: string;
  marca: string;
  pesoUnitario: string;
  capacidad: string;
  unidadCapacidad: string;
  stockInicial: string;
  stockActual: string;
  stockMinimo: string;
  controlaStock: boolean;
  permiteDecimal: boolean;
  observaciones: string;
};

const formularioVacio: Formulario = {
  id: "",
  codigo: "",
  codigoSap: "",
  nombre: "",
  descripcion: "",
  unidadMedidaId: "",
  familia: "IBC",
  marca: "",
  pesoUnitario: "0",
  capacidad: "1000",
  unidadCapacidad: "L",
  stockInicial: "0",
  stockActual: "0",
  stockMinimo: "0",
  controlaStock: true,
  permiteDecimal: false,
  observaciones: "",
};

function formatearFecha(fecha: string | null) {
  if (!fecha) {
    return "Sin producción";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(fecha));
}

function etiquetaStock(
  estado: Producto["estadoStock"],
) {
  const etiquetas = {
    DISPONIBLE: "Disponible",
    BAJO: "Stock bajo",
    AGOTADO: "Agotado",
    SIN_CONTROL: "Sin control",
  };

  return etiquetas[estado];
}

function claseStock(
  estado: Producto["estadoStock"],
) {
  const clases = {
    DISPONIBLE:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    BAJO:
      "border-amber-200 bg-amber-50 text-amber-700",
    AGOTADO:
      "border-red-200 bg-red-50 text-red-700",
    SIN_CONTROL:
      "border-slate-200 bg-slate-100 text-slate-600",
  };

  return clases[estado];
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState<Formulario>(formularioVacio);

  async function cargarProductos() {
    try {
      setCargando(true);
      setMensaje("");

      const parametros = new URLSearchParams({
        busqueda,
        estado,
      });

      const respuesta = await fetch(
        `/api/productos?${parametros.toString()}`,
        { cache: "no-store" },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje ?? "No se pudieron cargar los productos.");
      }

      setProductos(datos.productos ?? []);
      setUnidades(datos.unidades ?? []);
      setPuedeEditar(Boolean(datos.permisos?.puedeEditar));
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = useMemo(
    () => ({
      total: productos.length,
      disponibles: productos.filter(
        (producto) =>
          producto.estadoStock === "DISPONIBLE",
      ).length,
      bajoStock: productos.filter(
        (producto) =>
          producto.estadoStock === "BAJO",
      ).length,
      agotados: productos.filter(
        (producto) =>
          producto.estadoStock === "AGOTADO",
      ).length,
      stock: productos.reduce(
        (total, producto) =>
          total + producto.stockActual,
        0,
      ),
    }),
    [productos],
  );

  function nuevoProducto() {
    setFormulario(formularioVacio);
    setModalAbierto(true);
  }

  function editarProducto(producto: Producto) {
    setFormulario({
      id: producto.id,
      codigo: producto.codigo,
      codigoSap: producto.codigoSap ?? "",
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? "",
      unidadMedidaId: producto.unidadMedidaId ?? "",
      familia: producto.familia ?? "",
      marca: producto.marca ?? "",
      pesoUnitario: String(producto.pesoUnitario),
      capacidad: String(producto.capacidad),
      unidadCapacidad: producto.unidadCapacidad ?? "",
      stockInicial: String(producto.stockInicial),
      stockActual: String(producto.stockActual),
      stockMinimo: String(producto.stockMinimo),
      controlaStock: producto.controlaStock,
      permiteDecimal: producto.permiteDecimal,
      observaciones: producto.observaciones ?? "",
    });

    setModalAbierto(true);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();

    try {
      setGuardando(true);
      setMensaje("");

      const esEdicion = Boolean(formulario.id);
      const respuesta = await fetch(
        esEdicion
          ? `/api/productos/${formulario.id}`
          : "/api/productos",
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formulario),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje ?? "No se pudo guardar el producto.");
      }

      setModalAbierto(false);
      setMensaje(datos.mensaje);
      await cargarProductos();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(producto: Producto) {
    const respuesta = await fetch(`/api/productos/${producto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !producto.activo }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      setMensaje(datos.mensaje ?? "No se pudo cambiar el estado.");
      return;
    }

    setMensaje(datos.mensaje);
    await cargarProductos();
  }

  return (
    <main className="space-y-7">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-700 p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
          Catálogo industrial
        </p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">
              Productos terminados
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium text-slate-200">
              Administre códigos, especificaciones y stock de los envases IBC.
            </p>
          </div>

          {puedeEditar && (
            <button
              type="button"
              onClick={nuevoProducto}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-800"
            >
              <Plus className="h-5 w-5" />
              Nuevo producto
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TarjetaResumen
          titulo="Total productos"
          valor={resumen.total}
          detalle="Productos registrados"
          clase="border-slate-200 bg-white"
          valorClase="text-slate-950"
        />

        <TarjetaResumen
          titulo="Disponibles"
          valor={resumen.disponibles}
          detalle="Stock por encima del mínimo"
          clase="border-emerald-200 bg-emerald-50"
          valorClase="text-emerald-700"
        />

        <TarjetaResumen
          titulo="Stock bajo"
          valor={resumen.bajoStock}
          detalle="Requieren reposición"
          clase="border-amber-200 bg-amber-50"
          valorClase="text-amber-700"
        />

        <TarjetaResumen
          titulo="Agotados"
          valor={resumen.agotados}
          detalle="Sin unidades disponibles"
          clase="border-red-200 bg-red-50"
          valorClase="text-red-700"
        />

        <TarjetaResumen
          titulo="Stock acumulado"
          valor={resumen.stock.toFixed(3)}
          detalle="Unidades registradas"
          clase="border-blue-200 bg-blue-50"
          valorClase="text-blue-700"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por código, SAP o nombre"
              className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={estado}
            onChange={(evento) => setEstado(evento.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold"
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>

          <button
            type="button"
            onClick={() => void cargarProductos()}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
          >
            Aplicar filtros
          </button>
        </div>

        {mensaje && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
            {mensaje}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1280px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-black uppercase text-slate-500">
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">Código SAP</th>
                <th className="px-3 py-3">Unidad</th>
                <th className="px-3 py-3">Peso</th>
                <th className="px-3 py-3">Capacidad</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Mínimo</th>
                <th className="px-3 py-3">Estado del stock</th>
                <th className="px-3 py-3">Última producción</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center">
                    <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-sm font-bold text-slate-500">
                    No existen productos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id} className="text-sm">
                    <td className="px-3 py-4">
                      <p className="font-black text-slate-950">{producto.nombre}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{producto.codigo}</p>
                    </td>
                    <td className="px-3 py-4 font-semibold">{producto.codigoSap ?? "—"}</td>
                    <td className="px-3 py-4">{producto.unidadMedida?.simbolo ?? "—"}</td>
                    <td className="px-3 py-4">{producto.pesoUnitario.toFixed(3)} kg</td>
                    <td className="px-3 py-4">{producto.capacidad.toFixed(3)} {producto.unidadCapacidad ?? ""}</td>
                    <td className="px-3 py-4 font-black">{producto.stockActual.toFixed(3)}</td>
                    <td className="px-3 py-4">{producto.stockMinimo.toFixed(3)}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${claseStock(
                          producto.estadoStock,
                        )}`}
                      >
                        {etiquetaStock(producto.estadoStock)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-slate-600">
                      {formatearFecha(producto.ultimaProduccion)}
                    </td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${
                        producto.activo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {producto.activo ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {puedeEditar && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editarProducto(producto)}
                            className="rounded-xl border border-slate-300 p-2 text-slate-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void cambiarEstado(producto)}
                            className="rounded-xl border border-slate-300 p-2 text-slate-700"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {formulario.id ? "Editar producto" : "Nuevo producto"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete los datos del producto terminado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardar} className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Código", "codigo"],
                ["Código SAP", "codigoSap"],
                ["Nombre", "nombre"],
                ["Familia", "familia"],
                ["Marca", "marca"],
                ["Peso unitario", "pesoUnitario"],
                ["Capacidad", "capacidad"],
                ["Unidad de capacidad", "unidadCapacidad"],
                ["Stock inicial", "stockInicial"],
                ["Stock actual", "stockActual"],
                ["Stock mínimo", "stockMinimo"],
              ].map(([etiqueta, campo]) => (
                <label key={campo} className="text-sm font-black text-slate-700">
                  {etiqueta}
                  <input
                    value={String(formulario[campo as keyof Formulario])}
                    onChange={(evento) =>
                      setFormulario((actual) => ({
                        ...actual,
                        [campo]: evento.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-500"
                    required={campo === "codigo" || campo === "nombre"}
                  />
                </label>
              ))}

              <label className="text-sm font-black text-slate-700">
                Unidad de medida
                <select
                  value={formulario.unidadMedidaId}
                  onChange={(evento) =>
                    setFormulario((actual) => ({
                      ...actual,
                      unidadMedidaId: evento.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold"
                >
                  <option value="">Sin unidad</option>
                  {unidades.map((unidad) => (
                    <option key={unidad.id} value={unidad.id}>
                      {unidad.codigo} - {unidad.nombre} ({unidad.simbolo})
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 text-sm font-black text-slate-700">
                Descripción
                <textarea
                  value={formulario.descripcion}
                  onChange={(evento) =>
                    setFormulario((actual) => ({
                      ...actual,
                      descripcion: evento.target.value,
                    }))
                  }
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold"
                />
              </label>

              <label className="flex items-center gap-3 text-sm font-black text-slate-700">
                <input
                  type="checkbox"
                  checked={formulario.controlaStock}
                  onChange={(evento) =>
                    setFormulario((actual) => ({
                      ...actual,
                      controlaStock: evento.target.checked,
                    }))
                  }
                />
                Controla stock
              </label>

              <label className="flex items-center gap-3 text-sm font-black text-slate-700">
                <input
                  type="checkbox"
                  checked={formulario.permiteDecimal}
                  onChange={(evento) =>
                    setFormulario((actual) => ({
                      ...actual,
                      permiteDecimal: evento.target.checked,
                    }))
                  }
                />
                Permite decimales
              </label>

              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {guardando && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Guardar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  detalle,
  clase,
  valorClase,
}: {
  titulo: string;
  valor: string | number;
  detalle: string;
  clase: string;
  valorClase: string;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${clase}`}
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p
        className={`mt-3 text-3xl font-black ${valorClase}`}
      >
        {valor}
      </p>

      <p className="mt-2 text-xs font-semibold text-slate-500">
        {detalle}
      </p>
    </article>
  );
}