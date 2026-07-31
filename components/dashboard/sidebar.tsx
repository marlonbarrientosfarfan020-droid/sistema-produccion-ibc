"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  Factory,
  Gauge,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PackageCheck,
  Settings,
  ShieldCheck,
  Timer,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type RolUsuario =
  | "SUPERADMIN"
  | "ADMINISTRADOR"
  | "JEFE_PLANTA"
  | "SUPERVISOR"
  | "OPERADOR"
  | "ALMACEN"
  | "CALIDAD"
  | "MANTENIMIENTO"
  | "CONSULTA";

type OpcionMenu = {
  nombre: string;
  href: string;
  icono: React.ComponentType<{
    className?: string;
  }>;
  roles: RolUsuario[];
};

type UsuarioSesion = {
  id: string;
  empresaId: string;
  plantaId: string | null;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
};

type RespuestaSesion = {
  ok: boolean;
  autenticado?: boolean;
  mensaje?: string;
  usuario?: UsuarioSesion;
};

const TODOS_LOS_ROLES: RolUsuario[] = [
  "SUPERADMIN",
  "ADMINISTRADOR",
  "JEFE_PLANTA",
  "SUPERVISOR",
  "OPERADOR",
  "ALMACEN",
  "CALIDAD",
  "MANTENIMIENTO",
  "CONSULTA",
];

const ROLES_GESTION: RolUsuario[] = [
  "SUPERADMIN",
  "ADMINISTRADOR",
  "JEFE_PLANTA",
  "SUPERVISOR",
];

const ROLES_ADMINISTRACION: RolUsuario[] = [
  "SUPERADMIN",
  "ADMINISTRADOR",
];

const opcionesPrincipales: OpcionMenu[] = [
  {
    nombre: "Panel principal",
    href: "/dashboard",
    icono: LayoutDashboard,
    roles: TODOS_LOS_ROLES,
  },
  {
    nombre: "Control de Producción Diaria",
    href: "/dashboard/produccion",
    icono: Factory,
    roles: [
      "SUPERADMIN",
      "ADMINISTRADOR",
      "JEFE_PLANTA",
      "SUPERVISOR",
      "OPERADOR",
    ],
  },
  {
    nombre: "Historial de Producción",
    href: "/dashboard/produccion/historial",
    icono: History,
    roles: [
      "SUPERADMIN",
      "ADMINISTRADOR",
      "JEFE_PLANTA",
      "SUPERVISOR",
      "OPERADOR",
      "CALIDAD",
      "MANTENIMIENTO",
      "CONSULTA",
    ],
  },
  {
    nombre: "Líneas",
    href: "/dashboard/configuracion/lineas",
    icono: Gauge,
    roles: ROLES_GESTION,
  },
  {
    nombre: "Máquinas",
    href: "/dashboard/configuracion/maquinas",
    icono: Settings,
    roles: [
      "SUPERADMIN",
      "ADMINISTRADOR",
      "JEFE_PLANTA",
      "SUPERVISOR",
      "MANTENIMIENTO",
    ],
  },
  {
    nombre: "Importar producción",
    href: "/dashboard/produccion/importar",
    icono: UploadCloud,
    roles: ROLES_GESTION,
  },
  {
    nombre: "Reportes",
    href: "/dashboard/reportes",
    icono: ChartNoAxesCombined,
    roles: [
      "SUPERADMIN",
      "ADMINISTRADOR",
      "JEFE_PLANTA",
      "SUPERVISOR",
      "CALIDAD",
      "MANTENIMIENTO",
      "CONSULTA",
    ],
  },
  {
    nombre: "Productos terminados",
    href: "/dashboard/productos",
    icono: PackageCheck,
    roles: [
      "SUPERADMIN",
      "ADMINISTRADOR",
      "JEFE_PLANTA",
      "SUPERVISOR",
      "ALMACEN",
      "CALIDAD",
      "CONSULTA",
    ],
  },
];

const opcionesConfiguracion: OpcionMenu[] = [
  {
    nombre: "Empresa",
    href: "/dashboard/configuracion/empresa",
    icono: Building2,
    roles: ROLES_ADMINISTRACION,
  },
  {
    nombre: "Turnos",
    href: "/dashboard/configuracion/turnos",
    icono: Timer,
    roles: ROLES_GESTION,
  },
  {
    nombre: "Usuarios",
    href: "/dashboard/configuracion/usuarios",
    icono: Users,
    roles: ROLES_ADMINISTRACION,
  },
];

function estaActivo(
  pathname: string,
  href: string,
) {
  if (
    href === "/dashboard" ||
    href === "/dashboard/produccion"
  ) {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function formatearRol(rol: RolUsuario) {
  const nombres: Record<RolUsuario, string> = {
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

  return nombres[rol];
}

function GrupoMenu({
  titulo,
  opciones,
}: {
  titulo: string;
  opciones: OpcionMenu[];
}) {
  const pathname = usePathname();

  if (opciones.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        {titulo}
      </p>

      <nav className="space-y-1">
        {opciones.map((opcion) => {
          const Icono = opcion.icono;
          const activo = estaActivo(
            pathname,
            opcion.href,
          );

          return (
            <Link
              key={opcion.href}
              href={opcion.href}
              className={[
                "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition",
                activo
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icono
                  className={[
                    "h-5 w-5 shrink-0",
                    activo
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white",
                  ].join(" ")}
                />

                <span className="truncate">
                  {opcion.nombre}
                </span>
              </span>

              <ChevronRight
                className={[
                  "h-4 w-4 shrink-0 transition",
                  activo
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function Sidebar() {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<UsuarioSesion | null>(null);
  const [cargandoUsuario, setCargandoUsuario] =
    useState(true);
  const [cerrandoSesion, setCerrandoSesion] =
    useState(false);
  const [errorSesion, setErrorSesion] =
    useState("");

  useEffect(() => {
    async function cargarUsuario() {
      try {
        setCargandoUsuario(true);
        setErrorSesion("");

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
          router.replace("/login");
          router.refresh();
          return;
        }

        setUsuario(datos.usuario);
      } catch {
        setErrorSesion(
          "No se pudo cargar la sesión.",
        );
        router.replace("/login");
        router.refresh();
      } finally {
        setCargandoUsuario(false);
      }
    }

    void cargarUsuario();
  }, [router]);

  const opcionesPrincipalesPermitidas =
    useMemo(() => {
      if (!usuario) {
        return [];
      }

      return opcionesPrincipales.filter(
        (opcion) =>
          opcion.roles.includes(usuario.rol),
      );
    }, [usuario]);

  const opcionesConfiguracionPermitidas =
    useMemo(() => {
      if (!usuario) {
        return [];
      }

      return opcionesConfiguracion.filter(
        (opcion) =>
          opcion.roles.includes(usuario.rol),
      );
    }, [usuario]);

  async function cerrarSesion() {
    try {
      setCerrandoSesion(true);
      setErrorSesion("");

      const respuesta = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );

      const datos = (await respuesta.json()) as {
        ok: boolean;
        mensaje?: string;
      };

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudo cerrar la sesión.",
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (errorDesconocido) {
      setErrorSesion(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cerrar la sesión.",
      );
    } finally {
      setCerrandoSesion(false);
    }
  }

  const nombreCompleto =
    usuario?.nombreCompleto ||
    `${usuario?.nombres ?? ""} ${
      usuario?.apellidos ?? ""
    }`.trim() ||
    "Usuario";

  const iniciales = usuario
    ? `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase()
    : "US";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-white lg:flex">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-950/30">
            <Factory className="h-7 w-7" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-black leading-tight">
              Producción IBC
            </p>

            <p className="mt-1 truncate text-xs font-semibold text-slate-400">
              Control industrial inteligente
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
        {cargandoUsuario ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <LoaderCircle className="h-5 w-5 animate-spin text-blue-400" />

            <p className="text-sm font-bold text-slate-400">
              Cargando permisos...
            </p>
          </div>
        ) : (
          <>
            <GrupoMenu
              titulo="Operaciones"
              opciones={
                opcionesPrincipalesPermitidas
              }
            />

            <GrupoMenu
              titulo="Configuración"
              opciones={
                opcionesConfiguracionPermitidas
              }
            />
          </>
        )}
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          {cargandoUsuario ? (
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 animate-spin text-blue-400" />

              <p className="text-sm font-bold text-slate-400">
                Cargando usuario...
              </p>
            </div>
          ) : usuario ? (
            <>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-300">
                  {iniciales}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">
                    {nombreCompleto}
                  </p>

                  <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                    {usuario.correo}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />

                    <span className="text-[10px] font-black uppercase tracking-wide text-emerald-300">
                      {formatearRol(usuario.rol)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void cerrarSesion()
                }
                disabled={cerrandoSesion}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/60 bg-red-950/30 px-3 py-2.5 text-sm font-black text-red-300 transition hover:bg-red-950/60 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cerrandoSesion ? (
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

              {errorSesion && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
                  {errorSesion}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs font-bold text-red-300">
              Sesión no disponible.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}