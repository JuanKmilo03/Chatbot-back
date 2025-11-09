import { PrismaClient, Rol, EstadoConvenio, EstadoPractica, EstadoGeneral, TipoConvenio } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ─── Hash de contraseñas ───────────────────────────────────────────────
  const hashedDirectorPass = await bcrypt.hash('123456', 10);
  const hashedEmpresaPass = await bcrypt.hash('empresa123', 10);
  const hashedEmpresa2Pass = await bcrypt.hash('empresa456', 10);
  const hashedEstudiantePass = await bcrypt.hash('estudiante123', 10);

  // ─── Usuarios ───────────────────────────────────────────────
  const directorUser = await prisma.usuario.create({
    data: {
      nombre: 'Wilhen Gutierrez',
      email: 'wilhenferneygp@ufps.edu.co',
      password: hashedDirectorPass,
      rol: Rol.DIRECTOR,
    },
  });

  const empresaUser = await prisma.usuario.create({
    data: {
      nombre: 'Tech Solutions S.A.S',
      email: 'contacto@techsolutions.com',
      password: hashedEmpresaPass,
      rol: Rol.EMPRESA,
    },
  });

  const empresaUser2 = await prisma.usuario.create({
    data: {
      nombre: 'InnovaTech Group',
      email: 'info@innovatech.com',
      password: hashedEmpresa2Pass,
      rol: Rol.EMPRESA,
    },
  });

  const estudianteUser = await prisma.usuario.create({
    data: {
      nombre: 'Laura González',
      email: 'laura.gonzalez@correo.ufps.edu.co',
      password: hashedEstudiantePass,
      rol: Rol.ESTUDIANTE,
    },
  });

  // ─── Programa ───────────────────────────────────────────────
  const programa = await prisma.programa.create({
    data: {
      nombre: 'Ingeniería de Sistemas',
      facultad: 'Facultad de Ingenierías',
    },
  });

  // ─── Director ───────────────────────────────────────────────
  const director = await prisma.director.create({
    data: {
      usuarioId: directorUser.id,
      programaId: programa.id,
      Facultad: 'Facultad de Ingenierías',
    },
  });

  // ─── Empresas ────────────────────────────────────────────────
  const empresa1 = await prisma.empresa.create({
    data: {
      usuarioId: empresaUser.id,
      nit: '901234567-8',
      telefono: '3104567890',
      direccion: 'Av. 4 #12-45, Cúcuta',
      sector: 'Tecnología',
      descripcion: 'Empresa dedicada al desarrollo de software empresarial.',
      estado: EstadoGeneral.APROBADA,
      directorId: director.id,
      habilitada: true,
    },
  });

  const empresa2 = await prisma.empresa.create({
    data: {
      usuarioId: empresaUser2.id,
      nit: '901765432-1',
      telefono: '3119876543',
      direccion: 'Cra. 10 #45-23, Bucaramanga',
      sector: 'Consultoría TI',
      descripcion: 'Consultora en transformación digital y soluciones empresariales.',
      estado: EstadoGeneral.PENDIENTE,
      directorId: director.id,
    },
  });

  // ─── Convenios ───────────────────────────────────────────────
  await prisma.convenio.createMany({
    data: [
      {
        nombre: 'Convenio Prácticas UFPS 2025',
        empresaId: empresa1.id,
        directorId: director.id,
        estado: EstadoConvenio.APROBADO,
        tipo: TipoConvenio.MACRO,
        fechaInicio: new Date('2025-02-01'),
        fechaFin: new Date('2026-02-28'),
        archivoUrl: 'https://ufps.edu.co/docs/convenio2025.pdf',
      },
      {
        nombre: 'Convenio Desarrollo Web',
        empresaId: empresa1.id,
        directorId: director.id,
        estado: EstadoConvenio.APROBADO,
        tipo: TipoConvenio.ESPECIFICO,
        fechaInicio: new Date('2025-02-01'),
        fechaFin: new Date('2026-02-28'),
        archivoUrl: 'https://ufps.edu.co/docs/convenio_web.pdf',
      },
      {
        nombre: 'Convenio Innovación 2025',
        empresaId: empresa2.id,
        directorId: director.id,
        estado: EstadoConvenio.EN_REVISION,
        tipo: TipoConvenio.MACRO,
        archivoUrl: 'https://ufps.edu.co/docs/convenio_innova.pdf',
      },
    ],
  });

  // ─── Vacantes ───────────────────────────────────────────────
  await prisma.vacante.createMany({
  data: [
    // Aprobadas (6)
    {
      empresaId: empresa1.id,
      titulo: 'Desarrollador Frontend React',
      descripcion: 'Apoyar el desarrollo de interfaces en React.',
      area: 'Desarrollo Web',
      modalidad: 'HIBRIDO',
      habilidadesTecnicas: 'React, Tailwind, REST APIs',
      habilidadesBlandas: 'Comunicación, trabajo en equipo, adaptabilidad',
      estado: EstadoGeneral.APROBADA,
      directorValidaId: director.id,
    },
    {
      empresaId: empresa1.id,
      titulo: 'Backend Developer Node.js',
      descripcion: 'Implementar microservicios con Node.js y Express.',
      area: 'Desarrollo Backend',
      modalidad: 'REMOTO',
      habilidadesTecnicas: 'Node.js, PostgreSQL, Prisma',
      habilidadesBlandas: 'Pensamiento crítico, resolución de problemas',
      estado: EstadoGeneral.APROBADA,
      directorValidaId: director.id,
    },
    {
      empresaId: empresa1.id,
      titulo: 'Data Analyst',
      descripcion: 'Analizar datos y generar reportes con Power BI.',
      area: 'Analítica',
      modalidad: 'PRESENCIAL',
      habilidadesTecnicas: 'SQL, Power BI, Python',
      habilidadesBlandas: 'Atención al detalle, comunicación efectiva',
      estado: EstadoGeneral.APROBADA,
      directorValidaId: director.id,
    },
    {
      empresaId: empresa1.id,
      titulo: 'DevOps Intern',
      descripcion: 'Apoyar la automatización e infraestructura.',
      area: 'DevOps',
      modalidad: 'REMOTO',
      habilidadesTecnicas: 'Docker, AWS, GitHub Actions',
      habilidadesBlandas: 'Responsabilidad, trabajo colaborativo',
      estado: EstadoGeneral.APROBADA,
      directorValidaId: director.id,
    },
    {
      empresaId: empresa2.id,
      titulo: 'Mobile Developer Flutter',
      descripcion: 'Desarrollar apps móviles multiplataforma.',
      area: 'Desarrollo Móvil',
      modalidad: 'HIBRIDO',
      habilidadesTecnicas: 'Flutter, Firebase, Clean Architecture',
      habilidadesBlandas: 'Creatividad, proactividad, aprendizaje rápido',
      estado: EstadoGeneral.APROBADA,
      directorValidaId: director.id,
    },
    {
      empresaId: empresa2.id,
      titulo: 'Fullstack Developer Junior',
      descripcion: 'Apoyar el desarrollo de aplicaciones web completas.',
      area: 'Desarrollo Web',
      modalidad: 'PRESENCIAL',
      habilidadesTecnicas: 'React, Node.js, MongoDB',
      habilidadesBlandas: 'Colaboración, autogestión',
      estado: EstadoGeneral.APROBADA,
      directorValidaId: director.id,
    },
    // Pendientes (3)
    {
      empresaId: empresa1.id,
      titulo: 'Diseñador UI/UX',
      descripcion: 'Diseñar interfaces atractivas para web y móvil.',
      area: 'Diseño',
      modalidad: 'HIBRIDO',
      habilidadesTecnicas: 'Figma, UX Research, Design Systems',
      habilidadesBlandas: 'Empatía, pensamiento creativo',
      estado: EstadoGeneral.PENDIENTE,
    },
    {
      empresaId: empresa2.id,
      titulo: 'Analista QA Junior',
      descripcion: 'Ejecutar pruebas y reportar bugs.',
      area: 'Calidad de Software',
      modalidad: 'PRESENCIAL',
      habilidadesTecnicas: 'Cypress, Jest, Postman',
      habilidadesBlandas: 'Atención al detalle, comunicación',
      estado: EstadoGeneral.PENDIENTE,
    },
    {
      empresaId: empresa2.id,
      titulo: 'Soporte Técnico',
      descripcion: 'Brindar soporte técnico y mantenimiento a sistemas internos.',
      area: 'Soporte',
      modalidad: 'REMOTO',
      habilidadesTecnicas: 'Linux, Redes, Atención al usuario',
      habilidadesBlandas: 'Paciencia, empatía, responsabilidad',
      estado: EstadoGeneral.PENDIENTE,
    },
  ],
});

  // ─── Estudiante ─────────────────────────────────────────────
  const estudiante = await prisma.estudiante.create({
    data: {
      usuarioId: estudianteUser.id,
      habilidades: 'React, Node.js, SQL',
      perfil: 'Estudiante de Ingeniería de Sistemas apasionada por el desarrollo web.',
    },
  });

  // ─── Práctica ───────────────────────────────────────────────
  const vacanteFrontend = await prisma.vacante.findFirst({
    where: { titulo: 'Desarrollador Frontend React' },
  });

  if (vacanteFrontend) {
    const practica = await prisma.practica.create({
      data: {
        estudianteId: estudiante.id,
        vacanteId: vacanteFrontend.id,
        estado: EstadoPractica.EN_PROCESO,
        inicio: new Date('2025-02-10'),
      },
    });

    // ─── Evaluación ─────────────────────────────────────────────
    await prisma.evaluacion.create({
      data: {
        practicaId: practica.id,
        empresaId: empresa1.id,
        calificacion: 9,
        observacion: 'Excelente desempeño y compromiso.',
      },
    });
  }

  // ─── Reportes ───────────────────────────────────────────────
  await prisma.reporte.createMany({
    data: [
      {
        directorId: director.id,
        titulo: 'Seguimiento Prácticas Febrero 2025',
        descripcion: 'Reporte mensual del avance de los estudiantes en práctica.',
      },
      {
        directorId: director.id,
        titulo: 'Informe Convenios Activos',
        descripcion: 'Listado actualizado de convenios vigentes con empresas asociadas.',
      },
    ],
  });

  console.log('✅ Seed ejecutado correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
