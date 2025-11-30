import {
  PrismaClient,
  Rol,
  Modalidad,
  EstadoGeneral,
  EstadoEmpresa,
  EstadoConvenio,
  EstadoPractica,
  TipoConvenio,
  TipoActividad,
  PrioridadNotificacion,
  TipoNotificacion,
  TipoDocumento,
  EstadoPostulacion
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
      where: { email: "directora.sistemas@ufps.edu.co" },
      update: {},
      create: { nombre: "Directora Sistemas", email: "directora.sistemas@ufps.edu.co", password: directorPassword, rol: Rol.DIRECTOR },
    }),
    prisma.usuario.upsert({
      where: { email: "director.industrial@ufps.edu.co" },
      update: {},
      create: { nombre: "Director Industrial", email: "director.industrial@ufps.edu.co", password: directorPassword, rol: Rol.DIRECTOR },
    }),
    prisma.usuario.upsert({
      where: { email: "director.civil@ufps.edu.co" },
      update: {},
      create: { nombre: "Director Civil", email: "director.civil@ufps.edu.co", password: directorPassword, rol: Rol.DIRECTOR },
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
    update: {},
    create: { nombre: "Administrador General", email: "admin@ufps.edu.co", password: adminPassword, rol: Rol.ADMIN },
  });

  // ---------- EMPRESA A (aprobada, con convenio + vacantes) ----------
  const empresaPassword = await bcrypt.hash("empresa1234", 10);
  const usuarioEmpresa = await prisma.usuario.upsert({
    where: { email: "empresa@demo.com" },
    update: {},
    create: { nombre: "Empresa Demo S.A.", email: "empresa@demo.com", password: empresaPassword, rol: Rol.EMPRESA },
  });

  const convenioLink = "https://res.cloudinary.com/dqwxyv3zc/image/upload/v1764365976/DocumentosPracticas/kmdh9xfopf2zres4lkxb.pdf";

  const empresa = await prisma.empresa.upsert({
    where: { nit: "9001234567" },
    update: {},
    create: {
      usuarioId: usuarioEmpresa.id,
      programaId: progSis.id,
      nit: "9001234567",
      telefono: "3001112233",
      direccion: "Calle 45 #12-34",
      sector: "Tecnología",
      descripcion: "Empresa de ejemplo registrada automáticamente.",
      estado: EstadoEmpresa.APROBADA,
      habilitada: true,
      directorId: dirSis.id,
    },
  });

  // representante legal empresa A
  await prisma.representanteLegal.upsert({
    where: { empresaId: empresa.id },
    update: {},
    create: {
      empresaId: empresa.id,
      nombreCompleto: "Juan Pérez",
      tipoDocumento: "CC",
      numeroDocumento: "1010101010",
      email: "legal@demo.com",
      telefono: "3102223344",
    },
  });

  // convenio macro para empresa A (con el link solicitado)
  let convenioA = await prisma.convenio.findFirst({
    where: { nombre: "Convenio Marco 2025", empresaId: empresa.id }
  });

  if (!convenioA) {
    convenioA = await prisma.convenio.create({
      data: {
        empresaId: empresa.id,
        directorId: dirSis.id,
        nombre: "Convenio Marco 2025",
        descripcion: "Convenio general para prácticas profesionales 2025.",
        tipo: TipoConvenio.MACRO,
        fechaInicio: new Date("2025-01-01"),
        fechaFin: new Date("2025-12-31"),
        estado: EstadoConvenio.APROBADO,
        archivoUrl: convenioLink,
      },
    });
  }

  await prisma.documento.create({
    data: {
      titulo: "Convenio Plantilla - 2025",
      descripcion: "Plantilla de convenio (automática)",
      categoria: TipoDocumento.CONVENIO_PLANTILLA,
      archivoUrl: convenioLink,
      nombreArchivo: "convenio-marco-2025.pdf",
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
  const usuarioEst = await prisma.usuario.upsert({
    where: { email: "estudiante1@ufps.edu.co" },
    update: {},
    create: { nombre: "Estudiante Demostración", email: "estudiante1@ufps.edu.co", password: estudiantePassword, rol: Rol.ESTUDIANTE },
  });

  const estudiante = await prisma.estudiante.upsert({
    where: { usuarioId: usuarioEst.id },
    update: {},
    create: {
      usuarioId: usuarioEst.id,
      programaId: progSis.id,
      codigo: "2025001",
      telefono: "3003334455",
      documento: "123456789",
      semestre: 8,
      perfil: "Estudiante interesado en desarrollo backend.",
      habilidadesTecnicas: ["Node.js", "TypeScript"],
      habilidadesBlandas: ["Comunicación", "Trabajo en equipo"],
      experiencia: "Proyectos académicos y freelance.",
      area: "Desarrollo Web",
      perfilCompleto: true,
      estadoProceso: EstadoPractica.EN_PROCESO,
      hojaDeVidaUrl: "",
    },
  });

  // ---------- CRONOGRAMA y ACTIVIDAD ----------
  const cronograma = await prisma.cronograma.upsert({
    where: { programaId_semestre: { programaId: progSis.id, semestre: "2025-1" } as any },
    update: {},
    create: {
      programaId: progSis.id,
      directorId: dirSis.id,
      titulo: "Cronograma Prácticas 2025-1",
      descripcion: "Actividades programadas para el semestre",
      semestre: "2025-1",
      activo: true,
      archivoUrl: "https://example.com/cronograma-2025-1.pdf",
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

  // // ---------- CONVERSACION y MENSAJE ----------
  // const conversacion = await prisma.conversacion.upsert({
  //   where: { empresaId_directorId: { empresaId: empresa.id, directorId: dirSis.id } as any },
  //   update: {},
  //   create: { empresaId: empresa.id, directorId: dirSis.id, titulo: "Contacto inicial de prácticas" },
  // });

  // let mensaje = await prisma.mensaje.findFirst({
  //   where: { conversacionId: conversacion.id, remitenteId: usuarioEmpresa.id }
  // });

  // if (!mensaje) {
  //   mensaje = await prisma.mensaje.create({
  //     data: {
  //       conversacionId: conversacion.id,
  //       remitenteId: usuarioEmpresa.id,
  //       remitenteRol: Rol.EMPRESA,
  //       contenido: "Buenas tardes, deseamos iniciar el proceso de prácticas.",
  //     },
  //   });
  // }

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
  const usuarioEmpresaPend = await prisma.usuario.upsert({
    where: { email: "empresa.pendiente@demo.com" },
    update: {},
    create: { nombre: "Empresa Pendiente LTDA", email: "empresa.pendiente@demo.com", password: await bcrypt.hash("empresaPend123", 10), rol: Rol.EMPRESA },
  });

  await prisma.empresa.upsert({
    where: { nit: "9007654321" },
    update: {},
    create: {
      usuarioId: usuarioEmpresaPend.id,
      programaId: progSis.id,
      nit: "9007654321",
      telefono: "3004445566",
      direccion: "Carrera 10 #5-67",
      sector: "Comercio",
      descripcion: "Empresa en estado pendiente, sin convenios.",
      estado: EstadoEmpresa.PENDIENTE,
      habilitada: false,
      directorId: dirSis.id,
    },
  });

  // ---------- EMPRESA C (APROBADA, con convenio EN_REVISION) ----------
  const usuarioEmpresaC = await prisma.usuario.upsert({
    where: { email: "empresa.revision@demo.com" },
    update: {},
    create: { nombre: "Empresa Revisión S.A.", email: "empresa.revision@demo.com", password: await bcrypt.hash("empresaRev123", 10), rol: Rol.EMPRESA },
  });

  const empresaRevision = await prisma.empresa.upsert({
    where: { nit: "9009998887" },
    update: {},
    create: {
      usuarioId: usuarioEmpresaC.id,
      programaId: progSis.id,
      nit: "9009998887",
      telefono: "3007778899",
      direccion: "Av 20 #30-10",
      sector: "Servicios",
      descripcion: "Empresa aprobada pero con convenio en revisión.",
      estado: EstadoEmpresa.APROBADA,
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

  console.log("✅ Seed completado correctamente.");
  console.log(`📊 Resumen (aprox):
  - Programas: ${programas.length}
  - Directores: ${directores.length}
  - Empresas creadas/aseguradas: 3
  - Estudiante demo: 1
  - Convenios: empresa A (APROBADO) + empresa C (EN_REVISION)
  - Vacantes creadas (empresa A): ${vacantesData.length}
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
