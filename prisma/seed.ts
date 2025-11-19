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
      where: { email: "director1@ufps.edu.co" },
      update: {},
      create: {
        nombre: "Directora Sistemas",
        email: "director1@ufps.edu.co",
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

  const usuarioEmpresa = await prisma.usuario.upsert({
    where: { email: "empresa@demo.com" },
    update: {},
    create: {
      nombre: "Empresa Demo S.A.",
      email: "empresa@demo.com",
      password: empresaPassword,
      rol: Rol.EMPRESA,
    },
  });

  const empresa = await prisma.empresa.upsert({
    where: { nit: "9001234567" },
    update: {},
    create: {
      usuarioId: usuarioEmpresa.id,
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

 const estudiantePassword = await bcrypt.hash("estudiante1234", 10);

  const usuarioEst = await prisma.usuario.upsert({
    where: { email: "estudiante1@ufps.edu.co" },
    update: {},
    create: {
      nombre: "Estudiante Demostración",
      email: "estudiante1@ufps.edu.co",
      password: estudiantePassword,
      rol: Rol.ESTUDIANTE,
    },
  });

  const estudiante = await prisma.estudiante.upsert({
    where: { usuarioId: usuarioEst.id },
    update: {},
    create: {
      usuarioId: usuarioEst.id,
      codigo: "2025001",
      telefono: "3003334455",
      documento: "123456789",
      programaAcademico: "Ingeniería de Sistemas",
      semestre: 8,
      perfil: "Estudiante interesado en desarrollo backend.",
      habilidadesTecnicas: ["Node.js", "TypeScript"],
      habilidadesBlandas: ["Comunicación", "Trabajo en equipo"],
      experiencia: "Proyectos académicos y freelance.",
      area: "Desarrollo Web",
      perfilCompleto: true,
      estadoProceso: EstadoPractica.EN_PROCESO,
      hojaDeVidaUrl: "https://example.com/cv-estudiante1.pdf",
    },
  });

 let convenio = await prisma.convenio.findFirst({
    where: {
      nombre: "Convenio Marco 2025",
      empresaId: empresa.id
    }
  });

  if (!convenio) {
    convenio = await prisma.convenio.create({
      data: {
        empresaId: empresa.id,
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
      empresaId: empresa.id
    }
  });

  if (!vacante) {
    vacante = await prisma.vacante.create({
      data: {
        empresaId: empresa.id,
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
      estudianteId: estudiante.id,
      vacanteId: vacante.id,
    }
  });

  if (!postulacion) {
    postulacion = await prisma.postulacion.create({
      data: {
        estudianteId: estudiante.id,
        vacanteId: vacante.id,
        estado: "EN_REVISION",
        comentario: "Interesado en la vacante de backend",
      },
    });
  }
let practica = await prisma.practica.findFirst({
    where: {
      estudianteId: estudiante.id,
      vacanteId: vacante.id,
    }
  });

  if (!practica) {
    practica = await prisma.practica.create({
      data: {
        estudianteId: estudiante.id,
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
        empresaId: empresa.id,
        directorId: dirSis.id,
      },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      directorId: dirSis.id,
      titulo: "Contacto inicial de prácticas",
    },
  });

  let mensaje = await prisma.mensaje.findFirst({
    where: {
      conversacionId: conversacion.id,
      remitenteId: usuarioEmpresa.id
    }
  });

  if (!mensaje) {
    mensaje = await prisma.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        remitenteId: usuarioEmpresa.id,
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
  - Empresas: 1
  - Estudiantes: 1
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