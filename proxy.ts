import { jwtVerify } from "jose";
import {
  NextRequest,
  NextResponse,
} from "next/server";

const NOMBRE_COOKIE_SESION =
  "produccion_ibc_sesion";

function obtenerClaveSecreta() {
  const secreto = process.env.AUTH_SECRET;

  if (!secreto || secreto.length < 32) {
    throw new Error(
      "AUTH_SECRET debe existir y tener al menos 32 caracteres.",
    );
  }

  return new TextEncoder().encode(secreto);
}

async function tokenEsValido(
  token: string | undefined,
) {
  if (!token) {
    return false;
  }

  try {
    const resultado = await jwtVerify(
      token,
      obtenerClaveSecreta(),
      {
        algorithms: ["HS256"],
      },
    );

    return (
      resultado.payload.tipo === "sesion" &&
      typeof resultado.payload.usuarioId ===
        "string" &&
      typeof resultado.payload.empresaId ===
        "string" &&
      typeof resultado.payload.correo ===
        "string" &&
      typeof resultado.payload.rol === "string"
    );
  } catch {
    return false;
  }
}

function redirigirALogin(
  request: NextRequest,
  eliminarCookie = false,
) {
  const urlLogin = new URL(
    "/login",
    request.url,
  );

  const rutaSolicitada =
    request.nextUrl.pathname +
    request.nextUrl.search;

  urlLogin.searchParams.set(
    "redirect",
    rutaSolicitada,
  );

  const respuesta =
    NextResponse.redirect(urlLogin);

  if (eliminarCookie) {
    respuesta.cookies.set(
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

  return respuesta;
}

export async function proxy(
  request: NextRequest,
) {
  const pathname = request.nextUrl.pathname;

  const esDashboard =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  const esLogin =
    pathname === "/login";

  const token = request.cookies.get(
    NOMBRE_COOKIE_SESION,
  )?.value;

  const sesionValida =
    await tokenEsValido(token);

  if (esDashboard && !sesionValida) {
    return redirigirALogin(
      request,
      Boolean(token),
    );
  }

  if (esLogin && sesionValida) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};