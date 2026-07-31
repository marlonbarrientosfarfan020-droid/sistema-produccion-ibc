import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está configurada.",
  );
}

const correo = String(
  process.env.ADMIN_EMAIL ?? "",
)
  .trim()
  .toLowerCase();

const password = String(
  process.env.ADMIN_PASSWORD ?? "",
);

const nombres =
  process.env.ADMIN_NOMBRES?.trim() ||
  "Administrador";

const apellidos =
  process.env.ADMIN_APELLIDOS?.trim() ||
  "Principal";

if (!correo) {
  throw new Error(
    "ADMIN_EMAIL no está configurado.",
  );
}

if (password.length < 8) {
  throw new Error(
    "ADMIN_PASSWORD debe tener al menos 8 caracteres.",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const empresa =
    await prisma.empresa.findFirst({
      where: {
        activo: true,
      },
      orderBy: {
        creadoEn: "asc",
      },
      include: {
        plantas: {
          where: {
            activo: true,
          },
          orderBy: {
            creadoEn: "asc",
          },
        },
      },
    });

  if (!empresa) {
    throw new Error(
      "No existe una empresa activa.",
    );
  }

  const passwordHash =
    await bcrypt.hash(password, 12);

  const usuario =
    await prisma.usuario.upsert({
      where: {
        empresaId_correo: {
          empresaId: empresa.id,
          correo,
        },
      },
      update: {
        nombres,
        apellidos,
        passwordHash,
        rol: "SUPERADMIN",
        estado: "ACTIVO",
        plantaId:
          empresa.plantas[0]?.id ?? null,
      },
      create: {
        empresaId: empresa.id,
        plantaId:
          empresa.plantas[0]?.id ?? null,
        nombres,
        apellidos,
        correo,
        passwordHash,
        rol: "SUPERADMIN",
        estado: "ACTIVO",
      },
    });

  console.log(
    "Administrador creado correctamente.",
  );
  console.log(`Correo: ${usuario.correo}`);
  console.log(`Rol: ${usuario.rol}`);
}

main()
  .catch((error) => {
    console.error(
      "Error al crear administrador:",
      error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
