import { PrismaClient, Rol, Modalidad, EstadoGeneral, TipoConvenio, EstadoEmpresa, EstadoConvenio, TipoDocumento } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  const programa = await prisma.programa.upsert({
    where: { nombre: 'Ingeniería de Sistemas' },
    update: {},
    create: { nombre: 'Ingeniería de Sistemas', facultad: 'Facultad de Ingeniería' },
  });

  const directorUsuario = await prisma.usuario.upsert({
    where: { email: 'wilhenferneygp2@ufps.edu.co' },
    update: {},
    create: { nombre: 'Wilhen Ferney Gutiérrez Pabón', email: 'wilhenferneygp@ufps.edu.co', password: null, rol: Rol.DIRECTOR },
  });

  const director = await prisma.director.upsert({
    where: { programaId: programa.id },
    update: { usuarioId: directorUsuario.id },
    create: { usuarioId: directorUsuario.id, programaId: programa.id, Facultad: programa.facultad },
  });

  await prisma.documento.create({
    data: {
      titulo: "Plantilla Inicial de Convenio",
      descripcion: "Documento base del convenio utilizado como plantilla para nuevos acuerdos empresariales.",
      categoria: TipoDocumento.CONVENIO_PLANTILLA,
      archivoUrl: "https://res.cloudinary.com/dqwxyv3zc/image/upload/v1762804320/DocumentosPracticas/yxqto6t2io7djka0w5j6.pdf",
      publicId: "DocumentosPracticas/yxqto6t2io7djka0w5j6",
      directorId: director.id,
    },
  });

  const empresasData = [
    { nombre: 'Empresa Habilitada S.A.', email: 'habilitada@ejemplo.com', nit: '9000000001', habilitada: true, estado: EstadoEmpresa.APROBADA },
    { nombre: 'Empresa Activa 1', email: 'activa1@ejemplo.com', nit: '9000000002', habilitada: false, estado: EstadoEmpresa.APROBADA },
    { nombre: 'Empresa Activa 2', email: 'activa2@ejemplo.com', nit: '9000000003', habilitada: false, estado: EstadoEmpresa.APROBADA },
    { nombre: 'Empresa Pendiente 1', email: 'pendiente1@ejemplo.com', nit: '9000000004', habilitada: false, estado: EstadoEmpresa.PENDIENTE },
    { nombre: 'Empresa Pendiente 2', email: 'pendiente2@ejemplo.com', nit: '9000000005', habilitada: false, estado: EstadoEmpresa.PENDIENTE },
  ];

  const empresas = [];
  for (const e of empresasData) {
    const password = await bcrypt.hash('empresa1234', 10);
    const usuario = await prisma.usuario.upsert({
      where: { email: e.email },
      update: {},
      create: { nombre: e.nombre, email: e.email, password, rol: Rol.EMPRESA },
    });

    const empresa = await prisma.empresa.upsert({
      where: { nit: e.nit },
      update: { usuarioId: usuario.id, habilitada: e.habilitada, estado: e.estado, directorId: director.id },
      create: { usuarioId: usuario.id, nit: e.nit, telefono: '555-1234', direccion: 'Calle Falsa 123', sector: 'Tecnología', descripcion: `Empresa ${e.nombre} para pruebas`, estado: e.estado, habilitada: e.habilitada, directorId: director.id },
    });

    await prisma.representanteLegal.upsert({
      where: { empresaId: empresa.id },
      update: {},
      create: { empresaId: empresa.id, nombreCompleto: 'Juan Representante', tipoDocumento: 'CC', numeroDocumento: `${empresa.nit}RL`, email: `legal-${empresa.nit}@ejemplo.com`, telefono: '3200000000' },
    });

    empresas.push(empresa);
  }

  const convenio = await prisma.convenio.create({
    data: { empresaId: empresas[0].id, directorId: director.id, nombre: "Convenio Habilitada 2025", descripcion: "Convenio aprobado para pruebas", tipo: TipoConvenio.MACRO, fechaInicio: new Date("2025-01-01"), fechaFin: new Date("2025-12-31"), estado: EstadoConvenio.APROBADO, version: 1, archivoUrl: "https://res.cloudinary.com/dqwxyv3zc/image/upload/v1762804320/DocumentosPracticas/yxqto6t2io7djka0w5j6.pdf" },
  });

  const vacantesData = [
    { titulo: 'Practicante Backend', area: 'Desarrollo Backend', habilidadesTecnicas: ['Node.js', 'TypeScript'], habilidadesBlandas: ['Proactividad'] },
    { titulo: 'Practicante Frontend', area: 'Desarrollo Frontend', habilidadesTecnicas: ['React', 'CSS'], habilidadesBlandas: ['Trabajo en equipo'] },
    { titulo: 'Practicante QA', area: 'Calidad de Software', habilidadesTecnicas: ['Testing', 'Jest'], habilidadesBlandas: ['Detallista'] },
  ];

  for (const v of vacantesData) {
    await prisma.vacante.create({
      data: { empresaId: empresas[0].id, convenioId: convenio.id, directorValidaId: director.id, titulo: v.titulo, modalidad: Modalidad.HIBRIDO, descripcion: `Vacante para ${v.titulo}`, area: v.area, ciudad: 'Cúcuta', habilidadesTecnicas: v.habilidadesTecnicas, habilidadesBlandas: v.habilidadesBlandas, estado: EstadoGeneral.PENDIENTE },
    });
  }

  const estudiantesData = [
    { nombre: 'Wilhen Ferney Gutierrez Pabon', email: 'wilhenferneygp2@ufps.edu.co', codigo: '1151667', documento: '1193288582', telefono: '+573022976372', area: 'Desarrollo Web', habilidadesTecnicas: ['TypeScript', 'React'], habilidadesBlandas: ['Comunicación', 'Trabajo en equipo'], experiencia: 'Proyectos universitarios', perfilCompleto: true, activo: true },
    { nombre: 'Estudiante Incompleto', email: 'estudiante2@ufps.edu.co', codigo: '2025002', documento: '987654321', telefono: '3019876543', area: 'QA', habilidadesTecnicas: [], habilidadesBlandas: [], perfilCompleto: false, activo: true },
  ];

  for (const s of estudiantesData) {
    const usuario = await prisma.usuario.upsert({ where: { email: s.email }, update: {}, create: { nombre: s.nombre, email: s.email, password: null, rol: Rol.ESTUDIANTE } });
    await prisma.estudiante.upsert({ where: { usuarioId: usuario.id }, update: {}, create: { usuarioId: usuario.id, documento: s.documento, codigo: s.codigo, telefono: s.telefono, area: s.area, habilidadesTecnicas: s.habilidadesTecnicas, habilidadesBlandas: s.habilidadesBlandas, experiencia: s.experiencia ?? '', perfilCompleto: s.perfilCompleto, activo: s.activo } });
  }

  console.log('✅ Seed ejecutado correctamente');
}

main()
  .catch((e) => console.error('❌ Error en el seed:', e))
  .finally(async () => await prisma.$disconnect());
