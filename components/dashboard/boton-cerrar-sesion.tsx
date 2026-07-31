"use client";

import {
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RespuestaLogout = {
  ok: boolean;
  mensaje?: string;
};

export default function BotonCerrarSesion() {
  const router = useRouter();

  const [cerrando, setCerrando] =
    useState(false);
  const [error, setError] = useState("");

  async function cerrarSesion() {
    try {
      setCerrando(true);
      setError("");

      const respuesta = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );

      const datos =
        (await respuesta.json()) as RespuestaLogout;

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudo cerrar la sesión.",
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cerrar la sesión.",
      );
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void cerrarSesion()}
        disabled={cerrando}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-black text-slate-200 transition hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cerrando ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Cerrando...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </>
        )}
      </button>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}