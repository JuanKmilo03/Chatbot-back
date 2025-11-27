import { PrismaClient, Rol, Modalidad, EstadoGeneral, EstadoEmpresa, EstadoConvenio, EstadoPractica, TipoConvenio, TipoActividad, PrioridadNotificacion, TipoNotificacion } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

const programas = await Promise.all([
    prisma.programa.upsert({
      where: { nombre: "Ingeniería de Sistemas" },
      update: {},
      create: {
        nombre: "Ingeniería de Sistemas",
        facultad: "Facultad de Ingeniería",
      },
    }),
    prisma.programa.upsert({
      where: { nombre: "Ingeniería Industrial" },
      update: {},
      create: {
        nombre: "Ingeniería Industrial",
        facultad: "Facultad de Ingeniería",
      },
    }),
    prisma.programa.upsert({
      where: { nombre: "Ingeniería Civil" },
      update: {},
      create: {
        nombre: "Ingeniería Civil",
        facultad: "Facultad de Ingeniería",
      },
    }),
  ]);

  const [progSis, progInd, progCiv] = programas;

 const directorPassword = await bcrypt.hash("director1234", 10);

  const directorUsuarios = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "adrianamilenaal@ufps.edu.co" },
      update: {},
      create: {
        nombre: "Directora Sistemas",
        email: "adrianamilenaal@ufps.edu.co",
        password: directorPassword,
        rol: Rol.DIRECTOR,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "director2@ufps.edu.co" },
      update: {},
      create: {
        nombre: "Director Industrial",
        email: "director2@ufps.edu.co",
        password: directorPassword,
        rol: Rol.DIRECTOR,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "director3@ufps.edu.co" },
      update: {},
      create: {
        nombre: "Director Civil",
        email: "director3@ufps.edu.co",
        password: directorPassword,
        rol: Rol.DIRECTOR,
      },
    }),
  ]);

  const [uDir1, uDir2, uDir3] = directorUsuarios;

  const directores = await Promise.all([
    prisma.director.upsert({
      where: { usuarioId: uDir1.id },
      update: {},
      create: {
        usuarioId: uDir1.id,
        programaId: progSis.id,
        Facultad: progSis.facultad,
      },
    }),
    prisma.director.upsert({
      where: { usuarioId: uDir2.id },
      update: {},
      create: {
        usuarioId: uDir2.id,
        programaId: progInd.id,
        Facultad: progInd.facultad,
      },
    }),
    prisma.director.upsert({
      where: { usuarioId: uDir3.id },
      update: {},
      create: {
        usuarioId: uDir3.id,
        programaId: progCiv.id,
        Facultad: progCiv.facultad,
      },
    }),
  ]);

  const [dirSis, dirInd, dirCiv] = directores;

 const adminPassword = await bcrypt.hash("admin1234", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@ufps.edu.co" },
    update: {},
    create: {
      nombre: "Administrador General",
      email: "admin@ufps.edu.co",
      password: adminPassword,
      rol: Rol.ADMIN,
    },
  });

 const empresaPassword = await bcrypt.hash("empresa1234", 10);

  const usuariosEmpresas = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "empresa1@demo.com" },
      update: {},
      create: {
        nombre: "TechSolutions S.A.S.",
        email: "empresa1@demo.com",
        password: empresaPassword,
        rol: Rol.EMPRESA,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "empresa2@demo.com" },
      update: {},
      create: {
        nombre: "InnovaTech Ltda.",
        email: "empresa2@demo.com",
        password: empresaPassword,
        rol: Rol.EMPRESA,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "empresa3@demo.com" },
      update: {},
      create: {
        nombre: "DevGroup Colombia",
        email: "empresa3@demo.com",
        password: empresaPassword,
        rol: Rol.EMPRESA,
      },
    }),
  ]);

  const [uEmp1, uEmp2, uEmp3] = usuariosEmpresas;

  const empresas = await Promise.all([
    prisma.empresa.upsert({
      where: { nit: "9001234567" },
      update: {},
      create: {
        usuarioId: uEmp1.id,
        nit: "9001234567",
        telefono: "3001112233",
        direccion: "Calle 45 #12-34, Cúcuta",
        sector: "Tecnología",
        descripcion: "Empresa especializada en desarrollo de software.",
        estado: EstadoEmpresa.APROBADA,
        habilitada: true,
        directorId: dirSis.id,
      },
    }),
    prisma.empresa.upsert({
      where: { nit: "9007654321" },
      update: {},
      create: {
        usuarioId: uEmp2.id,
        nit: "9007654321",
        telefono: "3112223344",
        direccion: "Av. Libertadores #23-45, Cúcuta",
        sector: "Consultoría TI",
        descripcion: "Consultoría e innovación tecnológica.",
        estado: EstadoEmpresa.APROBADA,
        habilitada: true,
        directorId: dirInd.id,
      },
    }),
    prisma.empresa.upsert({
      where: { nit: "9008887777" },
      update: {},
      create: {
        usuarioId: uEmp3.id,
        nit: "9008887777",
        telefono: "3203334455",
        direccion: "Centro Empresarial Torre 3, Piso 5, Cúcuta",
        sector: "Desarrollo Web",
        descripcion: "Agencia de desarrollo web y aplicaciones móviles.",
        estado: EstadoEmpresa.APROBADA,
        habilitada: true,
        directorId: dirCiv.id,
      },
    }),
  ]);

  const [empresa1, empresa2, empresa3] = empresas;

  await Promise.all([
    prisma.representanteLegal.upsert({
      where: { empresaId: empresa1.id },
      update: {},
      create: {
        empresaId: empresa1.id,
        nombreCompleto: "Juan Pérez González",
        tipoDocumento: "CC",
        numeroDocumento: "1010101010",
        email: "legal1@demo.com",
        telefono: "3102223344",
      },
    }),
    prisma.representanteLegal.upsert({
      where: { empresaId: empresa2.id },
      update: {},
      create: {
        empresaId: empresa2.id,
        nombreCompleto: "María López Ramírez",
        tipoDocumento: "CC",
        numeroDocumento: "1020202020",
        email: "legal2@demo.com",
        telefono: "3113334455",
      },
    }),
    prisma.representanteLegal.upsert({
      where: { empresaId: empresa3.id },
      update: {},
      create: {
        empresaId: empresa3.id,
        nombreCompleto: "Carlos Rodríguez Martínez",
        tipoDocumento: "CC",
        numeroDocumento: "1030303030",
        email: "legal3@demo.com",
        telefono: "3204445566",
      },
    }),
  ]);

 const estudiantePassword = await bcrypt.hash("estudiante1234", 10);

  const usuariosEstudiantes = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "estudiante1@ufps.edu.co" },
      update: {},
      create: {
        nombre: "Ana María Gómez",
        email: "estudiante1@ufps.edu.co",
        password: estudiantePassword,
        rol: Rol.ESTUDIANTE,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "estudiante2@ufps.edu.co" },
      update: {},
      create: {
        nombre: "Carlos Andrés Torres",
        email: "estudiante2@ufps.edu.co",
        password: estudiantePassword,
        rol: Rol.ESTUDIANTE,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "estudiante3@ufps.edu.co" },
      update: {},
      create: {
        nombre: "Laura Sofía Méndez",
        email: "estudiante3@ufps.edu.co",
        password: estudiantePassword,
        rol: Rol.ESTUDIANTE,
      },
    }),
  ]);

  const [uEst1, uEst2, uEst3] = usuariosEstudiantes;

  const estudiantes = await Promise.all([
    prisma.estudiante.upsert({
      where: { usuarioId: uEst1.id },
      update: {},
      create: {
        usuarioId: uEst1.id,
        codigo: "2025001",
        telefono: "3003334455",
        documento: "123456789",
        programaAcademico: "Ingeniería de Sistemas",
        semestre: 8,
        perfil: "Estudiante interesada en desarrollo backend y APIs.",
        habilidadesTecnicas: ["Node.js", "TypeScript", "PostgreSQL"],
        habilidadesBlandas: ["Comunicación", "Trabajo en equipo"],
        experiencia: "Proyectos académicos y freelance.",
        area: "Desarrollo Web",
        perfilCompleto: true,
        estadoProceso: EstadoPractica.EN_PROCESO,
        hojaDeVidaUrl: "https://example.com/cv-estudiante1.pdf",
      },
    }),
    prisma.estudiante.upsert({
      where: { usuarioId: uEst2.id },
      update: {},
      create: {
        usuarioId: uEst2.id,
        codigo: "2025002",
        telefono: "3104445566",
        documento: "987654321",
        programaAcademico: "Ingeniería Industrial",
        semestre: 7,
        perfil: "Estudiante enfocado en optimización de procesos y análisis de datos.",
        habilidadesTecnicas: ["Python", "Excel", "Power BI"],
        habilidadesBlandas: ["Liderazgo", "Análisis crítico"],
        experiencia: "Pasantías en empresas locales.",
        area: "Analítica de Datos",
        perfilCompleto: true,
        estadoProceso: EstadoPractica.EN_PROCESO,
        hojaDeVidaUrl: "https://example.com/cv-estudiante2.pdf",
      },
    }),
    prisma.estudiante.upsert({
      where: { usuarioId: uEst3.id },
      update: {},
      create: {
        usuarioId: uEst3.id,
        codigo: "2025003",
        telefono: "3205556677",
        documento: "456789123",
        programaAcademico: "Ingeniería Civil",
        semestre: 9,
        perfil: "Estudiante interesada en diseño estructural y BIM.",
        habilidadesTecnicas: ["AutoCAD", "Revit", "SAP2000"],
        habilidadesBlandas: ["Organización", "Resolución de problemas"],
        experiencia: "Proyectos de diseño arquitectónico.",
        area: "Diseño Estructural",
        perfilCompleto: true,
        estadoProceso: EstadoPractica.EN_PROCESO,
        hojaDeVidaUrl: "https://example.com/cv-estudiante3.pdf",
      },
    }),
  ]);

  const [estudiante1, estudiante2, estudiante3] = estudiantes;

 let convenio = await prisma.convenio.findFirst({
    where: {
      nombre: "Convenio Marco 2025",
      empresaId: empresa1.id
    }
  });

  if (!convenio) {
    convenio = await prisma.convenio.create({
      data: {
        empresaId: empresa1.id,
        directorId: dirSis.id,
        nombre: "Convenio Marco 2025",
        descripcion: "Convenio general para prácticas profesionales 2025.",
        tipo: TipoConvenio.MACRO,
        fechaInicio: new Date("2025-01-01"),
        fechaFin: new Date("2025-12-31"),
        estado: EstadoConvenio.APROBADO,
        archivoUrl: "https://example.com/convenio-marco-2025.pdf",
      },
    });
  }

  let vacante = await prisma.vacante.findFirst({
    where: {
      titulo: "Practicante Backend Node.js",
      empresaId: empresa1.id
    }
  });

  if (!vacante) {
    vacante = await prisma.vacante.create({
      data: {
        empresaId: empresa1.id,
        convenioId: convenio.id,
        directorValidaId: dirSis.id,
        titulo: "Practicante Backend Node.js",
        modalidad: Modalidad.HIBRIDO,
        descripcion: "Asistencia en APIs con Node.js, Prisma y PostgreSQL.",
        area: "Desarrollo de Software",
        ciudad: "Cúcuta",
        habilidadesTecnicas: ["Node.js", "SQL", "TypeScript"],
        habilidadesBlandas: ["Comunicación", "Responsabilidad"],
        estado: EstadoGeneral.APROBADA,
      },
    });
  }

 let postulacion = await prisma.postulacion.findFirst({
    where: {
      estudianteId: estudiante1.id,
      vacanteId: vacante.id,
    }
  });

  if (!postulacion) {
    postulacion = await prisma.postulacion.create({
      data: {
        estudianteId: estudiante1.id,
        vacanteId: vacante.id,
        estado: "EN_REVISION",
        comentario: "Interesada en la vacante de backend",
      },
    });
  }
let practica = await prisma.practica.findFirst({
    where: {
      estudianteId: estudiante1.id,
      vacanteId: vacante.id,
    }
  });

  if (!practica) {
    practica = await prisma.practica.create({
      data: {
        estudianteId: estudiante1.id,
        vacanteId: vacante.id,
        estado: EstadoPractica.EN_PROCESO,
        inicio: new Date("2025-02-01"),
        fin: new Date("2025-07-31"),
      },
    });
  }

  const cronograma = await prisma.cronograma.upsert({
    where: {
      programaId_semestre: {
        programaId: progSis.id,
        semestre: "2025-1",
      },
    },
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
    where: {
      cronogramaId: cronograma.id,
      nombre: "Revisión de hojas de vida"
    }
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

  // ─────────────────────────────────────────────────────────────
  // CONVERSACIÓN + MENSAJE
  // ─────────────────────────────────────────────────────────────
  const conversacion = await prisma.conversacion.upsert({
    where: {
      empresaId_directorId: {
        empresaId: empresa1.id,
        directorId: dirSis.id,
      },
    },
    update: {},
    create: {
      empresaId: empresa1.id,
      directorId: dirSis.id,
      titulo: "Contacto inicial de prácticas",
    },
  });

  let mensaje = await prisma.mensaje.findFirst({
    where: {
      conversacionId: conversacion.id,
      remitenteId: uEmp1.id
    }
  });

  if (!mensaje) {
    mensaje = await prisma.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        remitenteId: uEmp1.id,
        remitenteRol: Rol.EMPRESA,
        contenido: "Buenas tardes, deseamos iniciar el proceso de prácticas.",
      },
    });
  }

   let notificacion = await prisma.notificacion.findFirst({
    where: {
      id: 1
    }
  });

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

  console.log("✅ Seed completado correctamente.");
  console.log(`📊 Datos creados:
  - Programas: ${programas.length}
  - Directores: ${directores.length}
  - Empresas: ${empresas.length}
  - Estudiantes: ${estudiantes.length}
  - Convenios: 1
  - Vacantes: 1
  - Postulaciones: 1
  - Prácticas: 1
  - Cronogramas: 1
  - Actividades: 1
  - Conversaciones: 1
  - Mensajes: 1
  - Notificaciones: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });