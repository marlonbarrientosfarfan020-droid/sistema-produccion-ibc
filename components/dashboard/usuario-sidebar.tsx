"use client";

import {
  LoaderCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import BotonCerrarSesion from "@/components/dashboard/boton-cerrar-sesion";

type UsuarioSesion = {
  id: string;
  empresaId: string;
  plantaId: string | null;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
};

type RespuestaSesion = {
  ok: boolean;
  autenticado?: boolean;
  mensaje?: string;
  usuario?: UsuarioSesion;
};

function nombreRol(rol: string) {
  const nombres: Record<string, string> = {
    SUPERADMIN: "Superadministrador",
    ADMINISTRADOR: "Administrador",
    JEFE_PLANTA: "Jefe de planta",
    SUPERVISOR: "Supervisor",
    OPERADOR: "Operador",
    ALMACEN: "Almacén",
    CALIDAD: "Control de calidad",
    MANTENIMIENTO: "Mantenimiento",
    CONSULTA: "Consulta",
  };

  return nombres[rol] ?? rol;
}

export default function UsuarioSidebar() {
  const [usuario, setUsuario] =
    useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] =
    useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarSesion() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          "/api/auth/session",
          {
            cache: "no-store",
          },
        );

        const datos =
          (await respuesta.json()) as RespuestaSesion;

        if (
          !respuesta.ok ||
          !datos.ok ||
          !datos.autenticado ||
          !datos.usuario
        ) {
          throw new Error(
            datos.mensaje ??
              "No se pudo cargar la sesión.",
          );
        }

        setUsuario(datos.usuario);
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar la sesión.",
        );
      } finally {
        setCargando(false);
      }
    }

    void cargarSesion();
  }, []);

  if (cargando) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center gap-3">
          <LoaderCircle className="h-5 w-5 animate-spin text-blue-400" />

          <p className="text-sm font-bold text-slate-300">
            Cargando usuario...
          </p>
        </div>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <p className="text-xs font-bold leading-5 text-red-300">
          {error || "Sesión no disponible."}
        </p>

        <BotonCerrarSesion />
      </div>
    );
  }

  const iniciales = `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-300">
          {iniciales || (
            <UserRound className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-white">
            {usuario.nombreCompleto}
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-slate-400">
            {usuario.correo}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />

            <span className="text-[11px] font-black uppercase tracking-wide text-emerald-300">
              {nombreRol(usuario.rol)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <BotonCerrarSesion />
      </div>
    </div>
  );
}