import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SignJWT,
  jwtVerify,
  type JWTPayload,
} from "jose";

export const NOMBRE_COOKIE_SESION =
  "produccion_ibc_sesion";

const DURACION_SESION_SEGUNDOS =
  60 * 60 * 12; // 12 horas

export const ROLES_USUARIO = [
  "SUPERADMIN",
  "ADMINISTRADOR",
  "JEFE_PLANTA",
  "SUPERVISOR",
  "OPERADOR",
  "ALMACEN",
  "CALIDAD",
  "MANTENIMIENTO",
  "CONSULTA",
] as const;

export type RolUsuarioSesion =
  (typeof ROLES_USUARIO)[number];

export type SesionUsuario = {
  usuarioId: string;
  empresaId: string;
  plantaId: string | null;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolUsuarioSesion;
};

type PayloadSesion = JWTPayload &
  SesionUsuario & {
    tipo: "sesion";
  };

function obtenerClaveSecreta() {
  const secreto = process.env.AUTH_SECRET;

  if (!secreto) {
    throw new Error(
      "AUTH_SECRET no está configurado en el archivo .env.",
    );
  }

  if (secreto.length < 32) {
    throw new Error(
      "AUTH_SECRET debe tener al menos 32 caracteres.",
    );
  }

  return new TextEncoder().encode(secreto);
}

function esRolValido(
  rol: unknown,
): rol is RolUsuarioSesion {
  return (
    typeof rol === "string" &&
    ROLES_USUARIO.includes(
      rol as RolUsuarioSesion,
    )
  );
}

function payloadValido(
  payload: JWTPayload,
): payload is PayloadSesion {
  return (
    payload.tipo === "sesion" &&
    typeof payload.usuarioId === "string" &&
    typeof payload.empresaId === "string" &&
    (typeof payload.plantaId === "string" ||
      payload.plantaId === null) &&
    typeof payload.nombres === "string" &&
    typeof payload.apellidos === "string" &&
    typeof payload.correo === "string" &&
    esRolValido(payload.rol)
  );
}

export async function crearTokenSesion(
  sesion: SesionUsuario,
) {
  const ahora = Math.floor(Date.now() / 1000);

  return new SignJWT({
    ...sesion,
    tipo: "sesion",
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt(ahora)
    .setNotBefore(ahora)
    .setExpirationTime(
      ahora + DURACION_SESION_SEGUNDOS,
    )
    .setSubject(sesion.usuarioId)
    .sign(obtenerClaveSecreta());
}

export async function verificarTokenSesion(
  token: string,
): Promise<SesionUsuario | null> {
  try {
    const resultado = await jwtVerify(
      token,
      obtenerClaveSecreta(),
      {
        algorithms: ["HS256"],
      },
    );

    if (!payloadValido(resultado.payload)) {
      return null;
    }

    return {
      usuarioId: resultado.payload.usuarioId,
      empresaId: resultado.payload.empresaId,
      plantaId: resultado.payload.plantaId,
      nombres: resultado.payload.nombres,
      apellidos: resultado.payload.apellidos,
      correo: resultado.payload.correo,
      rol: resultado.payload.rol,
    };
  } catch {
    return null;
  }
}

export async function guardarCookieSesion(
  sesion: SesionUsuario,
) {
  const token = await crearTokenSesion(sesion);
  const almacenCookies = await cookies();

  almacenCookies.set(
    NOMBRE_COOKIE_SESION,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DURACION_SESION_SEGUNDOS,
    },
  );
}

export async function eliminarCookieSesion() {
  const almacenCookies = await cookies();

  almacenCookies.set(
    NOMBRE_COOKIE_SESION,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    },
  );
}

export async function obtenerSesionActual() {
  const almacenCookies = await cookies();
  const token = almacenCookies.get(
    NOMBRE_COOKIE_SESION,
  )?.value;

  if (!token) {
    return null;
  }

  return verificarTokenSesion(token);
}

export async function exigirSesion() {
  const sesion = await obtenerSesionActual();

  if (!sesion) {
    redirect("/login");
  }

  return sesion;
}

export async function exigirRoles(
  rolesPermitidos: RolUsuarioSesion[],
) {
  const sesion = await exigirSesion();

  if (!rolesPermitidos.includes(sesion.rol)) {
    redirect("/dashboard");
  }

  return sesion;
}

export function tieneRol(
  sesion: SesionUsuario | null,
  rolesPermitidos: RolUsuarioSesion[],
) {
  return Boolean(
    sesion &&
      rolesPermitidos.includes(sesion.rol),
  );
}

export function nombreCompletoUsuario(
  sesion: SesionUsuario,
) {
  return `${sesion.nombres} ${sesion.apellidos}`.trim();
}