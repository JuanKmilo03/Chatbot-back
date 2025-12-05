// prisma/seed.ts
import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcrypt";
import { generarCodigoUsuario, generarCodigoSeguridad } from "../src/utils/codigos.js";

const prisma = new PrismaClient();

// Función auxiliar para generar códigos únicos
async function generarCodigoSeguridad(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigo = "";
  let existe = true;

  while (existe) {
    codigo = "";
    for (let i = 0; i < 8; i++) {
      codigo += chars[Math.floor(Math.random() * chars.length)];
    }

    const usuario = await prisma.usuario.findFirst({
      where: { codigoSeguridad: codigo }
    });

    existe = !!usuario;
  }

  return codigo;
}

async function generarCodigoUsuario(rol: string): Promise<string> {
  let prefijo = "";

  switch (rol) {
    case "ESTUDIANTE": prefijo = "UEST"; break;
    case "EMPRESA":    prefijo = "UEMP"; break;
    case "DIRECTOR":   prefijo = "UDIR"; break;
    case "ADMIN":      prefijo = "UADM"; break;
    default:           prefijo = "UGEN";
  }

  let codigo = "";
  let existe = true;

  while (existe) {
    const numero = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    codigo = `${prefijo}${numero}`;

    const encontrado = await prisma.usuario.findFirst({
      where: { codigoUsuario: codigo }
    });

    existe = !!encontrado;
  }

  return codigo;
}

async function main() {
  console.log("🌱 Iniciando seed...");

  // ---------- PROGRAMAS ----------
  const programas = await Promise.all([
    prisma.programa.upsert({
      where: { nombre: "Ingeniería de Sistemas" },
      update: {},
      create: { nombre: "Ingeniería de Sistemas", facultad: "Facultad de Ingeniería" },
    }),
    prisma.programa.upsert({
      where: { nombre: "Ingeniería Industrial" },
      update: {},
      create: { nombre: "Ingeniería Industrial", facultad: "Facultad de Ingeniería" },
    }),
    prisma.programa.upsert({
      where: { nombre: "Ingeniería Civil" },
      update: {},
      create: { nombre: "Ingeniería Civil", facultad: "Facultad de Ingeniería" },
    }),
  ]);

  const [progSis, progInd, progCiv] = programas;

  // ---------- DIRECTORES (usuarios) ----------
  const directorPassword = await bcrypt.hash("director1234", 10);

  const directorUsuarios = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "adrianamilenaal@ufps.edu.co" },
      update: {
        codigoUsuario: await generarCodigoUsuario("DIRECTOR"),
        codigoSeguridad: await generarCodigoSeguridad()
      },
      create: { 
        nombre: "Adriana Milena", 
        email: "adrianamilenaal@ufps.edu.co", 
        password: directorPassword, 
        rol: Rol.DIRECTOR,
        codigoUsuario: await generarCodigoUsuario("DIRECTOR"),
        codigoSeguridad: await generarCodigoSeguridad()
      },
    }),
    prisma.usuario.upsert({
      where: { email: "director.industrial@ufps.edu.co" },
      update: {
        codigoUsuario: await generarCodigoUsuario("DIRECTOR"),
        codigoSeguridad: await generarCodigoSeguridad()
      },
      create: { 
        nombre: "Director Industrial", 
        email: "director.industrial@ufps.edu.co", 
        password: directorPassword, 
        rol: Rol.DIRECTOR,
        codigoUsuario: await generarCodigoUsuario("DIRECTOR"),
        codigoSeguridad: await generarCodigoSeguridad()
      },
    }),
    prisma.usuario.upsert({
      where: { email: "director.civil@ufps.edu.co" },
      update: {
        codigoUsuario: await generarCodigoUsuario("DIRECTOR"),
        codigoSeguridad: await generarCodigoSeguridad()
      },
      create: { 
        nombre: "Director Civil", 
        email: "director.civil@ufps.edu.co", 
        password: directorPassword, 
        rol: Rol.DIRECTOR,
        codigoUsuario: await generarCodigoUsuario("DIRECTOR"),
        codigoSeguridad: await generarCodigoSeguridad()
      },
    }),
  ]);

  const [uDir1, uDir2, uDir3] = directorUsuarios;

  const directores = await Promise.all([
    prisma.director.upsert({
      where: { usuarioId: uDir1.id },
      update: {},
      create: { usuarioId: uDir1.id, programaId: progSis.id, Facultad: progSis.facultad },
    }),
    prisma.director.upsert({
      where: { usuarioId: uDir2.id },
      update: {},
      create: { usuarioId: uDir2.id, programaId: progInd.id, Facultad: progInd.facultad },
    }),
    prisma.director.upsert({
      where: { usuarioId: uDir3.id },
      update: {},
      create: { usuarioId: uDir3.id, programaId: progCiv.id, Facultad: progCiv.facultad },
    }),
  ]);

  const [dirSis, dirInd, dirCiv] = directores;

  // ---------- ADMIN ----------
  const adminPassword = await bcrypt.hash("admin1234", 10);
  
  await prisma.usuario.upsert({
    where: { email: "admin@ufps.edu.co" },
    update: {
      codigoUsuario: await generarCodigoUsuario("ADMIN"),
      codigoSeguridad: await generarCodigoSeguridad()
    },
    create: { 
      nombre: "Administrador General", 
      email: "admin@ufps.edu.co", 
      password: adminPassword, 
      rol: Rol.ADMIN,
      codigoUsuario: await generarCodigoUsuario("ADMIN"),
      codigoSeguridad: await generarCodigoSeguridad()
    },
  });

  // ---------- EMPRESA A (aprobada, con convenio + vacantes) ----------
  const empresaPassword = await bcrypt.hash("empresa1234", 10);
  const codigoUsuarioEmpresaA = await generarCodigoUsuario("EMPRESA");
  const codigoSeguridadEmpresaA = await generarCodigoSeguridad();
  
  const usuarioEmpresa = await prisma.usuario.upsert({
    where: { email: "empresa@demo.com" },
    update: {
      codigoUsuario: codigoUsuarioEmpresaA,
      codigoSeguridad: codigoSeguridadEmpresaA
    },
    create: { 
      nombre: "Empresa Demo S.A.", 
      email: "empresa@demo.com", 
      password: empresaPassword, 
      rol: Rol.EMPRESA,
      codigoUsuario: codigoUsuarioEmpresaA,
      codigoSeguridad: codigoSeguridadEmpresaA
    },
  });

  const convenioLink = "https://res.cloudinary.com/dqwxyv3zc/image/upload/v1764365976/DocumentosPracticas/kmdh9xfopf2zres4lkxb.pdf";

  const empresa = await prisma.empresa.upsert({
    where: { nit: "9001234567" },
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

  // ---------- VACANTES para empresa A (3 vacantes en distintas áreas) ----------
  const vacantesData = [
    {
      titulo: "Practicante Backend Node.js",
      modalidad: Modalidad.HIBRIDO,
      descripcion: "Asistencia en APIs con Node.js, Prisma y PostgreSQL.",
      area: "Desarrollo",
      ciudad: "Cúcuta",
      habilidadesTecnicas: ["Node.js", "SQL", "TypeScript"],
      habilidadesBlandas: ["Comunicación", "Responsabilidad"],
    },
    {
      titulo: "Practicante DevOps",
      modalidad: Modalidad.PRESENCIAL,
      descripcion: "Soporte en CI/CD, deployment y automatización de infra.",
      area: "DevOps",
      ciudad: "Cúcuta",
      habilidadesTecnicas: ["Docker", "Kubernetes", "CI/CD"],
      habilidadesBlandas: ["Proactividad", "Resolución de problemas"],
    },
    {
      titulo: "Practicante - Gestión de Proyectos",
      modalidad: Modalidad.REMOTO,
      descripcion: "Apoyo en gestión de proyectos, cronogramas y seguimiento.",
      area: "Gestión de Proyectos",
      ciudad: "Remoto",
      habilidadesTecnicas: ["Gestión de proyectos", "Herramientas ágiles"],
      habilidadesBlandas: ["Organización", "Comunicación"],
    },
  ];

  for (const v of vacantesData) {
    // 1. Buscar si ya existe una vacante con este título para esta empresa
    const existing = await prisma.vacante.findFirst({
      where: {
        titulo: v.titulo,
        empresaId: empresa.id,
      },
    });

    if (existing) {
      // 2. Si existe → actualizamos por ID (el único unique válido)
      await prisma.vacante.update({
        where: { id: existing.id },
        data: {
          modalidad: v.modalidad,
          descripcion: v.descripcion,
          area: v.area,
          ciudad: v.ciudad,
          habilidadesTecnicas: v.habilidadesTecnicas,
          habilidadesBlandas: v.habilidadesBlandas,
          estado: EstadoGeneral.APROBADA,
          convenioId: convenioA.id,
          directorValidaId: dirSis.id,
        },
      });
    } else {
      // 3. Si no existe → crear la vacante desde cero
      await prisma.vacante.create({
        data: {
          empresaId: empresa.id,
          convenioId: convenioA.id,
          directorValidaId: dirSis.id,
          titulo: v.titulo,
          modalidad: v.modalidad,
          descripcion: v.descripcion,
          area: v.area,
          ciudad: v.ciudad,
          habilidadesTecnicas: v.habilidadesTecnicas,
          habilidadesBlandas: v.habilidadesBlandas,
          estado: EstadoGeneral.APROBADA,
        },
      });
    }
  }

  // ---------- ESTUDIANTE (demo) ----------
  const estudiantePassword = await bcrypt.hash("estudiante1234", 10);
  const codigoUsuarioEstudiante = await generarCodigoUsuario("ESTUDIANTE");
  const codigoSeguridadEstudiante = await generarCodigoSeguridad();
  
  const usuarioEst = await prisma.usuario.upsert({
    where: { email: "juancamilobame@ufps.edu.co" },
    update: {
      codigoUsuario: codigoUsuarioEstudiante,
      codigoSeguridad: codigoSeguridadEstudiante
    },
    create: { 
      nombre: "Juan Camilo Bamé", 
      email: "juancamilobame@ufps.edu.co", 
      password: estudiantePassword, 
      rol: Rol.ESTUDIANTE,
      codigoUsuario: codigoUsuarioEstudiante,
      codigoSeguridad: codigoSeguridadEstudiante
    },
  });

  const estudiante = await prisma.estudiante.upsert({
    where: { usuarioId: usuarioEst.id },
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

  let actividad = await prisma.actividadCronograma.findFirst({
    where: { cronogramaId: cronograma.id, nombre: "Revisión de hojas de vida" }
  });

  if (!actividad) {
    actividad = await prisma.actividadCronograma.create({
      data: {
        cronogramaId: cronograma.id,
        nombre: "Revisión de hojas de vida",
        descripcion: "El director revisará los CV recibidos.",
        fechaInicio: new Date("2025-01-15"),
        fechaFin: new Date("2025-01-30"),
        tipo: TipoActividad.REVISIÓN,
      },
    });
  }

  // ---------- NOTIFICACION DEMO ----------
  let notificacion = await prisma.notificacion.findFirst({ where: { destinatarioId: dirSis.id, tipo: TipoNotificacion.NUEVA_SOLICITUD_VACANTE } });
  if (!notificacion) {
    notificacion = await prisma.notificacion.create({
      data: {
        tipo: TipoNotificacion.NUEVA_SOLICITUD_VACANTE,
        titulo: "Nueva vacante pendiente",
        mensaje: "Tienes una nueva vacante pendiente de revisión",
        prioridad: PrioridadNotificacion.MEDIA,
        destinatarioId: dirSis.id,
        destinatarioRol: Rol.DIRECTOR,
        leida: false,
      },
    });
  }

  // ---------- EMPRESA B (PENDIENTE, sin convenios) ----------
  const codigoUsuarioEmpresaB = await generarCodigoUsuario("EMPRESA");
  const codigoSeguridadEmpresaB = await generarCodigoSeguridad();
  
  const usuarioEmpresaPend = await prisma.usuario.upsert({
    where: { email: "empresa.pendiente@demo.com" },
    update: {
      codigoUsuario: codigoUsuarioEmpresaB,
      codigoSeguridad: codigoSeguridadEmpresaB
    },
    create: { 
      nombre: "Empresa Pendiente LTDA", 
      email: "empresa.pendiente@demo.com", 
      password: await bcrypt.hash("empresaPend123", 10), 
      rol: Rol.EMPRESA,
      codigoUsuario: codigoUsuarioEmpresaB,
      codigoSeguridad: codigoSeguridadEmpresaB
    },
  });

  await prisma.empresa.upsert({
    where: { nit: "9007654321" },
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

  // ---------- EMPRESA C (APROBADA, con convenio EN_REVISION) ----------
  const codigoUsuarioEmpresaC = await generarCodigoUsuario("EMPRESA");
  const codigoSeguridadEmpresaC = await generarCodigoSeguridad();
  
  const usuarioEmpresaC = await prisma.usuario.upsert({
    where: { email: "empresa.revision@demo.com" },
    update: {
      codigoUsuario: codigoUsuarioEmpresaC,
      codigoSeguridad: codigoSeguridadEmpresaC
    },
    create: { 
      nombre: "Empresa Revisión S.A.", 
      email: "empresa.revision@demo.com", 
      password: await bcrypt.hash("empresaRev123", 10), 
      rol: Rol.EMPRESA,
      codigoUsuario: codigoUsuarioEmpresaC,
      codigoSeguridad: codigoSeguridadEmpresaC
    },
  });

  const empresaRevision = await prisma.empresa.upsert({
    where: { nit: "9009998887" },
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
      directorId: dirSis.id,
    },
  });

  // representante legal empresa C
  await prisma.representanteLegal.upsert({
    where: { empresaId: empresaRevision.id },
    update: {},
    create: {
      empresaId: empresaRevision.id,
      nombreCompleto: "María García",
      tipoDocumento: "CC",
      numeroDocumento: "2020202020",
      email: "legal.revision@demo.com",
      telefono: "3201112233",
    },
  });

  // convenio para empresa C en EN_REVISION
  let convenioC = await prisma.convenio.findFirst({ where: { empresaId: empresaRevision.id, nombre: "Convenio Específico 2025" } });
  if (!convenioC) {
    convenioC = await prisma.convenio.create({
      data: {
        empresaId: empresaRevision.id,
        directorId: dirSis.id,
        nombre: "Convenio Específico 2025",
        descripcion: "Convenio específico en proceso de revisión.",
        tipo: TipoConvenio.ESPECIFICO,
        fechaInicio: new Date("2025-03-01"),
        fechaFin: new Date("2026-02-28"),
        estado: EstadoConvenio.EN_REVISION,
        archivoUrl: convenioLink,
      },
    });
  }

  // documento asociado al convenioC (opcional)
  await prisma.documento.create({
    data: {
      titulo: "Convenio Específico 2025",
      descripcion: "Documento del convenio en revisión",
      categoria: TipoDocumento.CONVENIO_EMPRESA,
      archivoUrl: convenioLink,
      nombreArchivo: "convenio-especifico-2025.pdf",
      convenioId: convenioC.id,
      empresaId: empresaRevision.id,
    },
  });

  // ---------- MÁS ESTUDIANTES DE PRUEBA ----------
  const estudiantesData = [
    {
      nombre: "Ana María López",
      email: "ana.lopez@ufps.edu.co",
      codigo: "2025002",
      documento: "987654321",
      semestre: 9,
      perfil: "Estudiante interesada en desarrollo frontend y UX/UI.",
      habilidadesTecnicas: ["React", "JavaScript", "CSS"],
      habilidadesBlandas: ["Creatividad", "Trabajo en equipo"],
    },
    {
      nombre: "Carlos Andrés Gómez",
      email: "carlos.gomez@ufps.edu.co",
      codigo: "2025003",
      documento: "456789123",
      semestre: 7,
      perfil: "Estudiante con interés en bases de datos y análisis de datos.",
      habilidadesTecnicas: ["SQL", "Python", "Power BI"],
      habilidadesBlandas: ["Análisis", "Detalle"],
    },
    {
      nombre: "María Fernanda Rodríguez",
      email: "maria.rodriguez@ufps.edu.co",
      codigo: "2025004",
      documento: "321654987",
      semestre: 10,
      perfil: "Estudiante próxima a graduarse, experiencia en proyectos ágiles.",
      habilidadesTecnicas: ["Java", "Spring Boot", "Docker"],
      habilidadesBlandas: ["Liderazgo", "Comunicación"],
    },
  ];

  for (const est of estudiantesData) {
    const codigoUsuarioEst = await generarCodigoUsuario("ESTUDIANTE");
    const codigoSeguridadEst = await generarCodigoSeguridad();
    
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: est.email }
    });

    if (!usuarioExistente) {
      const usuarioEst = await prisma.usuario.create({
        data: {
          nombre: est.nombre,
          email: est.email,
          password: await bcrypt.hash("estudiante1234", 10),
          rol: Rol.ESTUDIANTE,
          codigoUsuario: codigoUsuarioEst,
          codigoSeguridad: codigoSeguridadEst
        },
      });

      await prisma.estudiante.create({
        data: {
          usuarioId: usuarioEst.id,
          programaId: progSis.id,
          codigo: est.codigo,
          documento: est.documento,
          semestre: est.semestre,
          perfil: est.perfil,
          habilidadesTecnicas: est.habilidadesTecnicas,
          habilidadesBlandas: est.habilidadesBlandas,
          perfilCompleto: true,
          estadoProceso: EstadoPractica.EN_PROCESO,
        },
      });
    }
  }

  console.log("✅ Seed completado correctamente.");
  console.log(`📊 Resumen (aprox):
  - Programas: ${programas.length}
  - Directores: ${directores.length}
  - Empresas creadas/aseguradas: 3
  - Estudiantes: 4
  - Convenios: empresa A (APROBADO) + empresa C (EN_REVISION)
  - Vacantes creadas (empresa A): ${vacantesData.length}
  `);
  
  // Mostrar códigos generados para referencia
  console.log("\n🔑 Códigos generados:");
  console.log("- Director Sistemas:", directorUsuarios[0].codigoUsuario, "/", directorUsuarios[0].codigoSeguridad);
  console.log("- Empresa Demo:", codigoUsuarioEmpresaA, "/", codigoSeguridadEmpresaA);
  console.log("- Estudiante Demo:", codigoUsuarioEstudiante, "/", codigoSeguridadEstudiante);
  console.log("- Admin:", await generarCodigoUsuario("ADMIN"));
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });