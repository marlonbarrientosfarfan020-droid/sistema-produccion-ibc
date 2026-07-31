import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { obtenerSesionActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const roles = [
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

const estados = ["ACTIVO", "INACTIVO", "BLOQUEADO"] as const;

type Rol = (typeof roles)[number];
type Estado = (typeof estados)[number];

type Body = {
  id?: unknown;
  nombres?: unknown;
  apellidos?: unknown;
  numeroDocumento?: unknown;
  correo?: unknown;
  password?: unknown;
  rol?: unknown;
  estado?: unknown;
  plantaId?: unknown;
};

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function error(mensaje: string, status = 400) {
  return NextResponse.json({ ok: false, mensaje }, { status });
}

async function accesoAdministrador() {
  const sesion = await obtenerSesionActual();

  if (!sesion) {
    return { sesion: null, respuesta: error("Debe iniciar sesión.", 401) };
  }

  if (!["SUPERADMIN", "ADMINISTRADOR"].includes(sesion.rol)) {
    return {
      sesion: null,
      respuesta: error("No tiene permisos para administrar usuarios.", 403),
    };
  }

  return { sesion, respuesta: null };
}

export async function GET() {
  try {
    const acceso = await accesoAdministrador();
    if (!acceso.sesion) return acceso.respuesta;

    const [usuarios, plantas] = await Promise.all([
      prisma.usuario.findMany({
        where: { empresaId: acceso.sesion.empresaId },
        orderBy: [{ estado: "asc" }, { nombres: "asc" }],
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          numeroDocumento: true,
          correo: true,
          rol: true,
          estado: true,
          plantaId: true,
          ultimoAccesoEn: true,
          creadoEn: true,
          planta: { select: { id: true, codigo: true, nombre: true } },
        },
      }),
      prisma.planta.findMany({
        where: { empresaId: acceso.sesion.empresaId, activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, codigo: true, nombre: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      usuarios,
      plantas,
      catalogos: { roles, estados },
    });
  } catch (e) {
    console.error("Error listando usuarios:", e);
    return error("No se pudieron cargar los usuarios.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const acceso = await accesoAdministrador();
    if (!acceso.sesion) return acceso.respuesta;

    const body = (await request.json()) as Body;
    const nombres = texto(body.nombres);
    const apellidos = texto(body.apellidos);
    const correo = texto(body.correo).toLowerCase();
    const password = texto(body.password);
    const rol = texto(body.rol) as Rol;
    const plantaId = texto(body.plantaId) || null;

    if (!nombres || !apellidos) return error("Nombres y apellidos son obligatorios.");
    if (!correo.includes("@")) return error("Ingrese un correo válido.");
    if (password.length < 8) return error("La contraseña debe tener al menos 8 caracteres.");
    if (!roles.includes(rol)) return error("Seleccione un rol válido.");
    if (acceso.sesion.rol !== "SUPERADMIN" && rol === "SUPERADMIN") {
      return error("Solo un superadministrador puede crear otro superadministrador.", 403);
    }

    const existe = await prisma.usuario.findFirst({
      where: {
        empresaId: acceso.sesion.empresaId,
        correo: { equals: correo, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existe) return error("Ya existe un usuario con ese correo.");

    if (plantaId) {
      const planta = await prisma.planta.findFirst({
        where: { id: plantaId, empresaId: acceso.sesion.empresaId, activo: true },
        select: { id: true },
      });
      if (!planta) return error("La planta seleccionada no es válida.");
    }

    const usuario = await prisma.usuario.create({
      data: {
        empresaId: acceso.sesion.empresaId,
        plantaId,
        nombres,
        apellidos,
        numeroDocumento: texto(body.numeroDocumento) || null,
        correo,
        passwordHash: await bcrypt.hash(password, 12),
        rol,
        estado: "ACTIVO",
      },
      select: { id: true, nombres: true, apellidos: true, correo: true, rol: true, estado: true },
    });

    return NextResponse.json({ ok: true, mensaje: "Usuario creado correctamente.", usuario }, { status: 201 });
  } catch (e) {
    console.error("Error creando usuario:", e);
    return error("No se pudo crear el usuario.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const acceso = await accesoAdministrador();
    if (!acceso.sesion) return acceso.respuesta;

    const body = (await request.json()) as Body;
    const id = texto(body.id);
    const nombres = texto(body.nombres);
    const apellidos = texto(body.apellidos);
    const correo = texto(body.correo).toLowerCase();
    const password = texto(body.password);
    const rol = texto(body.rol) as Rol;
    const estado = texto(body.estado) as Estado;
    const plantaId = texto(body.plantaId) || null;

    if (!id) return error("Falta el identificador del usuario.");
    if (!nombres || !apellidos) return error("Nombres y apellidos son obligatorios.");
    if (!correo.includes("@")) return error("Ingrese un correo válido.");
    if (!roles.includes(rol)) return error("Seleccione un rol válido.");
    if (!estados.includes(estado)) return error("Seleccione un estado válido.");
    if (password && password.length < 8) return error("La nueva contraseña debe tener al menos 8 caracteres.");
    if (id === acceso.sesion.usuarioId && estado !== "ACTIVO") {
      return error("No puede bloquear o desactivar su propia cuenta.");
    }

    const actual = await prisma.usuario.findFirst({
      where: { id, empresaId: acceso.sesion.empresaId },
      select: { id: true, rol: true },
    });
    if (!actual) return error("El usuario no existe.", 404);

    if (
      acceso.sesion.rol !== "SUPERADMIN" &&
      (actual.rol === "SUPERADMIN" || rol === "SUPERADMIN")
    ) {
      return error("Solo un superadministrador puede modificar superadministradores.", 403);
    }

    const ocupado = await prisma.usuario.findFirst({
      where: {
        empresaId: acceso.sesion.empresaId,
        correo: { equals: correo, mode: "insensitive" },
        id: { not: id },
      },
      select: { id: true },
    });
    if (ocupado) return error("Otro usuario ya utiliza ese correo.");

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        plantaId,
        nombres,
        apellidos,
        numeroDocumento: texto(body.numeroDocumento) || null,
        correo,
        rol,
        estado,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
      select: { id: true, nombres: true, apellidos: true, correo: true, rol: true, estado: true },
    });

    return NextResponse.json({ ok: true, mensaje: "Usuario actualizado correctamente.", usuario });
  } catch (e) {
    console.error("Error actualizando usuario:", e);
    return error("No se pudo actualizar el usuario.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const acceso = await accesoAdministrador();
    if (!acceso.sesion) return acceso.respuesta;

    const id = texto(new URL(request.url).searchParams.get("id"));
    if (!id) return error("Falta el identificador del usuario.");
    if (id === acceso.sesion.usuarioId) return error("No puede desactivar su propia cuenta.");

    const usuario = await prisma.usuario.findFirst({
      where: { id, empresaId: acceso.sesion.empresaId },
      select: { id: true, rol: true },
    });
    if (!usuario) return error("El usuario no existe.", 404);
    if (acceso.sesion.rol !== "SUPERADMIN" && usuario.rol === "SUPERADMIN") {
      return error("Solo un superadministrador puede desactivar a otro superadministrador.", 403);
    }

    await prisma.usuario.update({ where: { id }, data: { estado: "INACTIVO" } });
    return NextResponse.json({ ok: true, mensaje: "Usuario desactivado correctamente." });
  } catch (e) {
    console.error("Error desactivando usuario:", e);
    return error("No se pudo desactivar el usuario.", 500);
  }
}