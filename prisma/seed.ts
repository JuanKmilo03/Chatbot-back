// prisma/seed.ts
import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcrypt";
import { generarCodigoUsuario, generarCodigoSeguridad } from "../src/utils/codigos.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // -------------------------------------------------------------
  // 1. PROGRAMAS
  // -------------------------------------------------------------
  const sistemas = await prisma.programa.upsert({
    where: { nombre: "Ingeniería de Sistemas" },
    update: {},
    create: {
      nombre: "Ingeniería de Sistemas",
      facultad: "Facultad de Ingenierías",
    },
  });

  const industrial = await prisma.programa.upsert({
    where: { nombre: "Ingeniería Industrial" },
    update: {},
    create: {
      nombre: "Ingeniería Industrial",
      facultad: "Facultad de Ingenierías",
    },
  });

  console.log("✔ Programas creados");

  // -------------------------------------------------------------
  // 2. USUARIO ADMIN
  // -------------------------------------------------------------
  const adminUser = await prisma.usuario.upsert({
    where: { email: "admin@ufps.edu.co" },
    update: {},
    create: {
      nombre: "Administrador General",
      email: "admin@ufps.edu.co",
      password: await bcrypt.hash("admin123", 10),
      rol: Rol.ADMIN,
      codigoUsuario: await generarCodigoUsuario(Rol.ADMIN, prisma),
      codigoSeguridad: await generarCodigoSeguridad(prisma),
    },
  });

  console.log("✔ Admin creado");

  // -------------------------------------------------------------
  // 3. USUARIO DIRECTOR
  // -------------------------------------------------------------
  const directorUser = await prisma.usuario.upsert({
    where: { email: "juancamilobame@ufps.edu.co" },
    update: {},
    create: {
      nombre: "Director Sistemas",
      email: "juancamilobame@ufps.edu.co",
      password: await bcrypt.hash("director123", 10),
      rol: Rol.DIRECTOR,
      codigoUsuario: await generarCodigoUsuario(Rol.DIRECTOR, prisma),
      codigoSeguridad: await generarCodigoSeguridad(prisma),
    },
  });

  const director = await prisma.director.upsert({
    where: { usuarioId: directorUser.id },
    update: {},
    create: {
      usuarioId: directorUser.id,
      programaId: sistemas.id,
      Facultad: "Facultad de Ingenierías",
    },
  });

  console.log("✔ Director creado");

  // -------------------------------------------------------------
  // 4. USUARIO EMPRESA
  // -------------------------------------------------------------
  const empresaUser = await prisma.usuario.upsert({
    where: { email: "contacto@empresa.com" },
    update: {},
    create: {
      nombre: "Empresa Ejemplo",
      email: "contacto@empresa.com",
      password: await bcrypt.hash("empresa123", 10),
      rol: Rol.EMPRESA,
      codigoUsuario: await generarCodigoUsuario(Rol.EMPRESA, prisma),
      codigoSeguridad: await generarCodigoSeguridad(prisma),
    },
  });

  const empresa = await prisma.empresa.upsert({
    where: { usuarioId: empresaUser.id },
    update: {},
    create: {
      usuarioId: empresaUser.id,
      nit: "900123456",
      programaId: sistemas.id,
      telefono: "3120000000",
      direccion: "Cúcuta - Norte de Santander",
      sector: "Tecnología",
      descripcion: "Empresa dedicada a desarrollo de software.",
      habilitada: false,
    },
  });

  console.log("✔ Empresa creada");

  // -------------------------------------------------------------
  // 5. USUARIO ESTUDIANTE
  // -------------------------------------------------------------
  const estudianteUser = await prisma.usuario.upsert({
    where: { email: "adrianamilenaal@ufps.edu.co" },
    update: {},
    create: {
      nombre: "Estudiante Prueba",
      email: "adrianamilenaal@ufps.edu.co",
      password: await bcrypt.hash("est123", 10),
      rol: Rol.ESTUDIANTE,
      codigoUsuario: await generarCodigoUsuario(Rol.ESTUDIANTE, prisma),
      codigoSeguridad: await generarCodigoSeguridad(prisma),
    },
  });

  await prisma.estudiante.upsert({
    where: { usuarioId: estudianteUser.id },
    update: {},
    create: {
      usuarioId: estudianteUser.id,
      programaId: sistemas.id,
      semestre: 6,
      telefono: "3111111111",
      perfilCompleto: false,
    },
  });

  console.log("✔ Estudiante creado");

  console.log("🌱 SEED COMPLETADO EXITOSAMENTE");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
