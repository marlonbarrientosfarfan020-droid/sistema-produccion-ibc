"use client";

import {
  Eye,
  EyeOff,
  Factory,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RespuestaLogin = {
  ok: boolean;
  mensaje?: string;
  usuario?: {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
  };
};

type RespuestaSesion = {
  ok: boolean;
  autenticado?: boolean;
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginCargando />}>
      <LoginContenido />
    </Suspense>
  );
}

function LoginContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] =
    useState(false);
  const [ingresando, setIngresando] =
    useState(false);
  const [verificandoSesion, setVerificandoSesion] =
    useState(true);
  const [mensaje, setMensaje] = useState("");

  const redireccion =
    searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    async function verificarSesion() {
      try {
        const respuesta = await fetch(
          "/api/auth/session",
          {
            cache: "no-store",
          },
        );

        const datos =
          (await respuesta.json()) as RespuestaSesion;

        if (
          respuesta.ok &&
          datos.ok &&
          datos.autenticado
        ) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // Si no existe sesión, mostramos el login.
      } finally {
        setVerificandoSesion(false);
      }
    }

    void verificarSesion();
  }, [router]);

  async function iniciarSesion(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    try {
      setIngresando(true);
      setMensaje("");

      const respuesta = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo,
            password,
          }),
        },
      );

      const datos =
        (await respuesta.json()) as RespuestaLogin;

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudo iniciar sesión.",
        );
      }

      router.replace(redireccion);
      router.refresh();
    } catch (errorDesconocido) {
      setMensaje(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo iniciar sesión.",
      );
    } finally {
      setIngresando(false);
    }
  }

  if (verificandoSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-white">
          <LoaderCircle className="mx-auto h-11 w-11 animate-spin text-blue-400" />

          <p className="mt-4 text-sm font-black">
            Verificando sesión...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 shadow-xl shadow-blue-950/40">
                <Factory className="h-8 w-8" />
              </div>

              <div>
                <p className="text-2xl font-black">
                  Producción IBC
                </p>

                <p className="mt-1 text-sm font-semibold text-blue-200">
                  Control industrial inteligente
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Plataforma industrial
              </p>

              <h1 className="mt-5 text-5xl font-black leading-tight">
                Controle producción, eficiencia y
                calidad desde un solo lugar.
              </h1>

              <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-200">
                Registre producción diaria, analice
                indicadores, revise paradas, consumo de
                materia prima y tome decisiones con datos
                confiables.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4 sm:grid-cols-3">
            <Beneficio
              titulo="Producción"
              texto="Seguimiento diario y por turno."
            />

            <Beneficio
              titulo="Indicadores"
              texto="Eficiencia, rechazo y cumplimiento."
            />

            <Beneficio
              titulo="Seguridad"
              texto="Acceso por usuario y rol."
            />
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-100 px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Factory className="h-7 w-7" />
              </div>

              <div>
                <p className="text-lg font-black text-slate-950">
                  Producción IBC
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  Control industrial
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-300/50 sm:p-9">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <h2 className="mt-6 text-3xl font-black text-slate-950">
                Iniciar sesión
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Ingrese sus credenciales para acceder al
                sistema.
              </p>

              <form
                onSubmit={iniciarSesion}
                className="mt-8 space-y-5"
              >
                <div>
                  <label
                    htmlFor="correo"
                    className="text-sm font-black text-slate-700"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

                    <input
                      id="correo"
                      type="email"
                      value={correo}
                      onChange={(evento) =>
                        setCorreo(evento.target.value)
                      }
                      autoComplete="email"
                      placeholder="usuario@empresa.com"
                      className="w-full rounded-2xl border border-slate-300 py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-black text-slate-700"
                  >
                    Contraseña
                  </label>

                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

                    <input
                      id="password"
                      type={
                        mostrarPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(evento) =>
                        setPassword(
                          evento.target.value,
                        )
                      }
                      autoComplete="current-password"
                      placeholder="Ingrese su contraseña"
                      className="w-full rounded-2xl border border-slate-300 py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPassword(
                          (actual) => !actual,
                        )
                      }
                      className="absolute right-3 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {mensaje && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {mensaje}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    ingresando ||
                    !correo.trim() ||
                    !password
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ingresando ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Ingresar al sistema
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold leading-5 text-slate-500">
                  El acceso está protegido mediante sesión
                  segura y control de permisos por rol.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs font-semibold text-slate-500">
              © 2026 Producción IBC · Sistema de
              control industrial
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}


function LoginCargando() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center text-white">
        <LoaderCircle className="mx-auto h-11 w-11 animate-spin text-blue-400" />

        <p className="mt-4 text-sm font-black">
          Cargando acceso seguro...
        </p>
      </div>
    </main>
  );
}

function Beneficio({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <p className="font-black text-white">
        {titulo}
      </p>

      <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
        {texto}
      </p>
    </article>
  );
}