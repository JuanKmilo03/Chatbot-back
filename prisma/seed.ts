import { PrismaClient, Rol, Modalidad, EstadoGeneral, TipoConvenio, EstadoEmpresa, EstadoConvenio } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // 1️⃣ Crear programa
  const programa = await prisma.programa.upsert({
    where: { nombre: 'Ingeniería de Sistemas' },
    update: {},
    create: {
      nombre: 'Ingeniería de Sistemas',
      facultad: 'Facultad de Ingeniería',
    },
  });

  const programa2 = await prisma.programa.upsert({
    where: { nombre: 'Ingeniería de Sistemas' },
    update: {},
    create: {
      nombre: 'Ingeniería de Sistemas',
      facultad: 'Facultad de Ingeniería',
    },
  });

  const programa3 = await prisma.programa.upsert({
    where: { nombre: 'Ingeniería de Sistemas' },
    update: {},
    create: {
      nombre: 'Ingeniería de Sistemas',
      facultad: 'Facultad de Ingeniería',
    },
  });

  // 2️⃣ Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const adminUsuario = await prisma.usuario.upsert({
    where: { email: 'admin@ejemplo.com' },
    update: {},
    create: {
      nombre: 'Administrador Principal',
      email: 'admin@ejemplo.com',
      password: adminPassword,
      rol: Rol.ADMIN,
    },
  });

  // 3️⃣ Crear usuario director
  const directorUsuario = await prisma.usuario.upsert({
    where: { email: 'juancamilobame@ufps.edu.co' },
    update: {},
    create: {
      nombre: 'Juan Camilo Bame',
      email: 'juancamilobame@ufps.edu.co',
      password: null, // sin contraseña
      rol: Rol.DIRECTOR,
    },
  });

  // 4️⃣ Crear director (un director por programa)
  const director = await prisma.director.upsert({
    where: { programaId: programa.id },
    update: {
      usuarioId: directorUsuario.id,
      Facultad: programa.facultad,
    },
    create: {
      usuarioId: directorUsuario.id,
      programaId: programa.id,
      Facultad: programa.facultad,
    },
  });

  const directorUsuario2 = await prisma.usuario.upsert({
    where: { email: 'ejemplo1@ufps.edu.co' },
    update: {},
    create: {
      nombre: 'ejemplo1',
      email: 'ejemplo1@ufps.edu.co',
      password: null, // sin contraseña
      rol: Rol.DIRECTOR,
    },
  });

  // 4️⃣ Crear director (un director por programa)
  const director2 = await prisma.director.upsert({
    where: { programaId: programa2.id },
    update: {
      usuarioId: directorUsuario2.id,
      Facultad: programa2.facultad,
    },
    create: {
      usuarioId: directorUsuario2.id,
      programaId: programa2.id,
      Facultad: programa2.facultad,
    },
  });

  const directorUsuario3 = await prisma.usuario.upsert({
    where: { email: 'ejemplo2@ufps.edu.co' },
    update: {},
    create: {
      nombre: 'ejemplo2',
      email: 'ejemplo2@ufps.edu.co',
      password: null, // sin contraseña
      rol: Rol.DIRECTOR,
    },
  });

  // 4️⃣ Crear director (un director por programa)
  const director3 = await prisma.director.upsert({
    where: { programaId: programa3.id },
    update: {
      usuarioId: directorUsuario3.id,
      Facultad: programa3.facultad,
    },
    create: {
      usuarioId: directorUsuario3.id,
      programaId: programa3.id,
      Facultad: programa3.facultad,
    },
  });

  // 5️⃣ Crear empresa
  const empresaPassword = await bcrypt.hash('empresa1234', 10);
  const empresaUsuario = await prisma.usuario.upsert({
    where: { email: 'empresa@ejemplo.com' },
    update: {},
    create: {
      nombre: 'Empresa Demo S.A.',
      email: 'empresa@ejemplo.com',
      password: empresaPassword,
      rol: Rol.EMPRESA,
    },
  });

  const empresa = await prisma.empresa.upsert({
    where: { nit: '9001234567' },
    update: {
      usuarioId: empresaUsuario.id,
      estado: EstadoEmpresa.APROBADA,
      habilitada: true,
      directorId: director.id,
    },
    create: {
      usuarioId: empresaUsuario.id,
      nit: '9001234567',
      telefono: '555-1234',
      direccion: 'Calle Falsa 123',
      sector: 'Tecnología',
      descripcion: 'Empresa demostrativa para pruebas',
      estado: EstadoEmpresa.APROBADA,
      habilitada: true,
      directorId: director.id,
    },
  });

  // 6️⃣ Crear usuario estudiante
  const estudianteUsuario = await prisma.usuario.upsert({
    where: { email: 'adrianamilenaal@ufps.edu.co' },
    update: {},
    create: {
      nombre: 'Adriana Milena Al',
      email: 'adrianamilenaal@ufps.edu.co',
      password: null,
      rol: Rol.ESTUDIANTE,
    },
  });

  // 7️⃣ Crear estudiante
  const estudiante = await prisma.estudiante.upsert({
    where: { usuarioId: estudianteUsuario.id },
    update: {},
    create: {
      usuarioId: estudianteUsuario.id,
      codigo: '2025001',
      cedula: '123456789',
      telefono: '3001234567',
      area: 'Desarrollo Web',
      habilidadesTecnicas: ['TypeScript', 'Node.js', 'React'],
      habilidadesBlandas: ['Trabajo en equipo', 'Comunicación'],
      experiencia: 'Proyectos universitarios y prácticas',
      perfilCompleto: true,
      activo: true,
    },
  });

  // 8️⃣ Crear convenio
  const convenio = await prisma.convenio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      empresaId: empresa.id,
      directorId: director.id,
      nombre: 'Convenio de Prácticas 2025',
      descripcion: 'Convenio marco para estudiantes 2025',
      tipo: TipoConvenio.MACRO,
      fechaInicio: new Date('2025-01-01'),
      fechaFin: new Date('2025-12-31'),
      estado: EstadoConvenio.EN_REVISION,
      version: 1,
    },
  });

  // 9️⃣ Crear vacante
  await prisma.vacante.upsert({
    where: { id: 1 },
    update: {},
    create: {
      empresaId: empresa.id,
      convenioId: convenio.id,
      directorValidaId: director.id,
      titulo: 'Practicante de Desarrollo Backend',
      modalidad: Modalidad.HIBRIDO,
      descripcion: 'Vacante para desarrollo con Node.js y bases de datos',
      area: 'Desarrollo de Software',
      ciudad: 'Cúcuta',
      habilidadesTecnicas: ['Node.js', 'TypeScript', 'PostgreSQL'],
      habilidadesBlandas: ['Responsabilidad', 'Proactividad'],
      estado: EstadoGeneral.PENDIENTE,
    },
  });

  console.log('✅ Seed ejecutado correctamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
