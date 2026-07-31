"use client";

import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  UserRoundX,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Usuario = {
  id: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string | null;
  correo: string;
  rol: string;
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
  plantaId: string | null;
  ultimoAccesoEn: string | null;
  creadoEn: string;
  planta: { id: string; codigo: string; nombre: string } | null;
};

type Planta = { id: string; codigo: string; nombre: string };

type Respuesta = {
  ok: boolean;
  mensaje?: string;
  usuarios: Usuario[];
  plantas: Planta[];
  catalogos: { roles: string[]; estados: string[] };
};

type Formulario = {
  id: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string;
  password: string;
  rol: string;
  estado: string;
  plantaId: string;
};

const inicial: Formulario = {
  id: "",
  nombres: "",
  apellidos: "",
  numeroDocumento: "",
  correo: "",
  password: "",
  rol: "OPERADOR",
  estado: "ACTIVO",
  plantaId: "",
};

const claseCampo =
  "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function nombreRol(rol: string) {
  const mapa: Record<string, string> = {
    SUPERADMIN: "Superadministrador",
    ADMINISTRADOR: "Administrador",
    JEFE_PLANTA: "Jefe de planta",
    SUPERVISOR: "Supervisor",
    OPERADOR: "Operador",
    ALMACEN: "Almacén",
    CALIDAD: "Calidad",
    MANTENIMIENTO: "Mantenimiento",
    CONSULTA: "Consulta",
  };
  return mapa[rol] ?? rol;
}

function fechaHora(valor: string | null) {
  if (!valor) return "Nunca";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [formulario, setFormulario] = useState<Formulario>(inicial);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const respuesta = await fetch("/api/configuracion/usuarios", { cache: "no-store" });
      const datos = (await respuesta.json()) as Respuesta;
      if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje ?? "No se pudieron cargar los usuarios.");
      setUsuarios(datos.usuarios);
      setPlantas(datos.plantas);
      setRoles(datos.catalogos.roles);
      setEstados(datos.catalogos.estados);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { void cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      [u.nombres, u.apellidos, u.correo, u.numeroDocumento ?? "", u.rol, u.planta?.nombre ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [usuarios, busqueda]);

  function nuevo() {
    setFormulario(inicial);
    setMostrarPassword(false);
    setError("");
    setModal(true);
  }

  function editar(usuario: Usuario) {
    setFormulario({
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      numeroDocumento: usuario.numeroDocumento ?? "",
      correo: usuario.correo,
      password: "",
      rol: usuario.rol,
      estado: usuario.estado,
      plantaId: usuario.plantaId ?? "",
    });
    setMostrarPassword(false);
    setError("");
    setModal(true);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    try {
      setGuardando(true);
      setError("");
      setMensaje("");
      const respuesta = await fetch("/api/configuracion/usuarios", {
        method: formulario.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });
      const datos = (await respuesta.json()) as { ok: boolean; mensaje?: string };
      if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje ?? "No se pudo guardar el usuario.");
      setMensaje(datos.mensaje ?? "Usuario guardado correctamente.");
      setModal(false);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(usuario: Usuario) {
    if (!window.confirm(`¿Desactivar a ${usuario.nombres} ${usuario.apellidos}?`)) return;
    try {
      setError("");
      const respuesta = await fetch(`/api/configuracion/usuarios?id=${usuario.id}`, { method: "DELETE" });
      const datos = (await respuesta.json()) as { ok: boolean; mensaje?: string };
      if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje ?? "No se pudo desactivar.");
      setMensaje(datos.mensaje ?? "Usuario desactivado.");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo desactivar.");
    }
  }

  return (
    <main className="space-y-7">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-700 p-7 text-white shadow-xl md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Seguridad y acceso</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">Usuarios del sistema</h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-200 md:text-base">
          Cree usuarios, asigne plantas, roles y estados, y administre sus credenciales de acceso.
        </p>
      </section>

      {mensaje && <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" />{mensaje}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, correo, rol o planta..." className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => void cargar()} className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"><RefreshCcw className="h-4 w-4" />Actualizar</button>
            <button onClick={nuevo} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"><Plus className="h-5 w-5" />Nuevo usuario</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Resumen titulo="Total" valor={usuarios.length} />
        <Resumen titulo="Activos" valor={usuarios.filter((u) => u.estado === "ACTIVO").length} />
        <Resumen titulo="Bloqueados" valor={usuarios.filter((u) => u.estado === "BLOQUEADO").length} />
        <Resumen titulo="Inactivos" valor={usuarios.filter((u) => u.estado === "INACTIVO").length} />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex min-h-80 items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-blue-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full">
              <thead className="bg-slate-50"><tr className="text-left text-xs font-black uppercase text-slate-500"><th className="px-5 py-4">Usuario</th><th className="px-5 py-4">Correo</th><th className="px-5 py-4">Rol</th><th className="px-5 py-4">Planta</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Último acceso</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-200">
                {filtrados.map((u) => (
                  <tr key={u.id} className="text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><UserRound className="h-5 w-5" /></div><div><p className="font-black text-slate-950">{u.nombres} {u.apellidos}</p><p className="text-xs text-slate-500">{u.numeroDocumento || "Sin documento"}</p></div></div></td>
                    <td className="px-5 py-4">{u.correo}</td>
                    <td className="px-5 py-4"><span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{nombreRol(u.rol)}</span></td>
                    <td className="px-5 py-4">{u.planta?.nombre ?? "Todas / Sin asignar"}</td>
                    <td className="px-5 py-4"><EstadoBadge estado={u.estado} /></td>
                    <td className="px-5 py-4">{fechaHora(u.ultimoAccesoEn)}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => editar(u)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700"><Edit3 className="h-4 w-4" /></button>{u.estado !== "INACTIVO" && <button onClick={() => void desactivar(u)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700"><UserRoundX className="h-4 w-4" /></button>}</div></td>
                  </tr>
                ))}
                {filtrados.length === 0 && <tr><td colSpan={7} className="px-6 py-14 text-center text-sm font-bold text-slate-500">No se encontraron usuarios.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5"><div><p className="text-xs font-black uppercase text-blue-600">Administración</p><h2 className="mt-1 text-2xl font-black text-slate-950">{formulario.id ? "Editar usuario" : "Nuevo usuario"}</h2></div><button onClick={() => setModal(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300"><X className="h-5 w-5" /></button></div>
            <form onSubmit={guardar} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Campo etiqueta="Nombres" valor={formulario.nombres} cambiar={(v) => setFormulario((a) => ({ ...a, nombres: v }))} obligatorio />
                <Campo etiqueta="Apellidos" valor={formulario.apellidos} cambiar={(v) => setFormulario((a) => ({ ...a, apellidos: v }))} obligatorio />
                <Campo etiqueta="Documento" valor={formulario.numeroDocumento} cambiar={(v) => setFormulario((a) => ({ ...a, numeroDocumento: v }))} />
                <Campo etiqueta="Correo" tipo="email" valor={formulario.correo} cambiar={(v) => setFormulario((a) => ({ ...a, correo: v }))} obligatorio />
                <div><label className="mb-2 block text-xs font-black uppercase text-slate-600">Contraseña{!formulario.id && <span className="text-red-600"> *</span>}</label><div className="relative"><input type={mostrarPassword ? "text" : "password"} value={formulario.password} onChange={(e) => setFormulario((a) => ({ ...a, password: e.target.value }))} required={!formulario.id} placeholder={formulario.id ? "Vacío para conservarla" : "Mínimo 8 caracteres"} className={claseCampo} /><button type="button" onClick={() => setMostrarPassword((v) => !v)} className="absolute right-3 top-2.5 h-8 w-8">{mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
                <Seleccion etiqueta="Rol" valor={formulario.rol} cambiar={(v) => setFormulario((a) => ({ ...a, rol: v }))} opciones={roles.map((r) => ({ valor: r, etiqueta: nombreRol(r) }))} />
                <Seleccion etiqueta="Planta" valor={formulario.plantaId} cambiar={(v) => setFormulario((a) => ({ ...a, plantaId: v }))} opciones={[{ valor: "", etiqueta: "Todas / Sin asignar" }, ...plantas.map((p) => ({ valor: p.id, etiqueta: `${p.codigo} - ${p.nombre}` }))]} />
                {formulario.id && <Seleccion etiqueta="Estado" valor={formulario.estado} cambiar={(v) => setFormulario((a) => ({ ...a, estado: v }))} opciones={estados.map((e) => ({ valor: e, etiqueta: e === "ACTIVO" ? "Activo" : e === "BLOQUEADO" ? "Bloqueado" : "Inactivo" }))} />}
              </div>
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={() => setModal(false)} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black">Cancelar</button><button type="submit" disabled={guardando} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white">{guardando ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}Guardar usuario</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Campo({ etiqueta, valor, cambiar, tipo = "text", obligatorio = false }: { etiqueta: string; valor: string; cambiar: (v: string) => void; tipo?: string; obligatorio?: boolean }) {
  return <div><label className="mb-2 block text-xs font-black uppercase text-slate-600">{etiqueta}{obligatorio && <span className="text-red-600"> *</span>}</label><input type={tipo} value={valor} onChange={(e) => cambiar(e.target.value)} required={obligatorio} className={claseCampo} /></div>;
}

function Seleccion({ etiqueta, valor, cambiar, opciones }: { etiqueta: string; valor: string; cambiar: (v: string) => void; opciones: Array<{ valor: string; etiqueta: string }> }) {
  return <div><label className="mb-2 block text-xs font-black uppercase text-slate-600">{etiqueta}</label><select value={valor} onChange={(e) => cambiar(e.target.value)} className={claseCampo}>{opciones.map((o) => <option key={`${etiqueta}-${o.valor}`} value={o.valor}>{o.etiqueta}</option>)}</select></div>;
}

function Resumen({ titulo, valor }: { titulo: string; valor: number }) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-500">{titulo}</p><p className="mt-2 text-3xl font-black text-slate-950">{valor}</p></article>;
}

function EstadoBadge({ estado }: { estado: Usuario["estado"] }) {
  const clases = estado === "ACTIVO" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : estado === "BLOQUEADO" ? "border-red-200 bg-red-50 text-red-700" : "border-slate-300 bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${clases}`}>{estado === "ACTIVO" ? "Activo" : estado === "BLOQUEADO" ? "Bloqueado" : "Inactivo"}</span>;
}