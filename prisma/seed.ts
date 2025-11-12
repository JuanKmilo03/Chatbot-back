import { PrismaClient, Rol, EstadoConvenio, EstadoPractica, EstadoGeneral, TipoConvenio, TipoDocumento } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ─── Hash de contraseñas ───────────────────────────────────────────────
  const hashedDirectorPass = await bcrypt.hash('123456', 10);
  const hashedEmpresaPass = await bcrypt.hash('empresa123', 10);
  const hashedEmpresa2Pass = await bcrypt.hash('empresa456', 10);
  const hashedEmpresa3Pass = await bcrypt.hash('software123', 10);
  const hashedEmpresa4Pass = await bcrypt.hash('codewave123', 10);
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

  const empresaUser3 = await prisma.usuario.create({
    data: {
      nombre: 'SoftWareHouse S.A.S',
      email: 'contact@softwarehouse.com',
      password: hashedEmpresa3Pass,
      rol: Rol.EMPRESA,
    },
  });

  const empresaUser4 = await prisma.usuario.create({
    data: {
      nombre: 'CodeWave Ltda.',
      email: 'info@codewave.com',
      password: hashedEmpresa4Pass,
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

  await prisma.documento.create({
    data: {
      titulo: 'Plantilla Inicial de Convenio',
      descripcion: 'Documento base del convenio utilizado como plantilla para nuevos acuerdos empresariales.',
      categoria: TipoDocumento.CONVENIO_PLANTILLA,
      archivoUrl: 'https://res.cloudinary.com/dqwxyv3zc/image/upload/v1762804320/DocumentosPracticas/yxqto6t2io7djka0w5j6.pdf',
      publicId: 'DocumentosPracticas/yxqto6t2io7djka0w5j6',
      directorId: director.id,
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
      estado: EstadoGeneral.APROBADA, // 🔹 Antes estaba PENDIENTE
      directorId: director.id,
      habilitada: true,
    },
  });

  const empresa3 = await prisma.empresa.create({
    data: {
      usuarioId: empresaUser3.id,
      nit: '900123987-2',
      telefono: '3206547890',
      direccion: 'Calle 15 #8-20, Cúcuta',
      sector: 'Desarrollo Web',
      descripcion: 'Agencia de desarrollo web con enfoque en startups y PYMEs.',
      estado: EstadoGeneral.PENDIENTE,
      directorId: director.id,
      habilitada: true,
    },
  });

  const empresa4 = await prisma.empresa.create({
    data: {
      usuarioId: empresaUser4.id,
      nit: '901998877-3',
      telefono: '3014561122',
      direccion: 'Av. Libertadores #20-50, Cúcuta',
      sector: 'Software Factory',
      descripcion: 'Empresa enfocada en soluciones SaaS para educación y salud.',
      estado: EstadoGeneral.APROBADA,
      directorId: director.id,
      habilitada: true,
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
    ],
  });

  console.log('✅ Seed ejecutado correctamente con 2 nuevas empresas activas sin convenios.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
