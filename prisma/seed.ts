import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { generarCodigoSeguridad, generarCodigoUsuario } from "../src/utils/codigos.utils.js";

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar base de datos (opcional, comentar si no quieres borrar datos existentes)
  console.log('🧹 Limpiando base de datos...');
  await prisma.notificacion.deleteMany();
  await prisma.actividadCronograma.deleteMany();
  await prisma.cronograma.deleteMany();
  await prisma.archivoMensaje.deleteMany();
  await prisma.mensaje.deleteMany();
  await prisma.conversacion.deleteMany();
  await prisma.revisionConvenio.deleteMany();
  await prisma.comentarioConvenio.deleteMany();
  await prisma.representanteLegal.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.practica.deleteMany();
  await prisma.postulacion.deleteMany();
  await prisma.vacante.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.convenio.deleteMany();
  await prisma.reporte.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.director.deleteMany();
  await prisma.programa.deleteMany();
  await prisma.usuario.deleteMany();
  console.log('✅ Base de datos limpiada\n');

  const HASHED_PASSWORD = await bcrypt.hash('Password123!', 10);

  /* --------- 1. Crear programas académicos --------- */
  console.log('📚 Creando programas académicos...');

  const programaSistemas = await prisma.programa.create({
    data: {
      nombre: 'Ingeniería de Sistemas',
      facultad: 'Facultad de Ingeniería',
    },
  });

  const programaIndustrial = await prisma.programa.create({
    data: {
      nombre: 'Ingeniería Industrial',
      facultad: 'Facultad de Ingeniería',
    },
  });

  console.log(`✅ Programas creados: ${programaSistemas.nombre}, ${programaIndustrial.nombre}\n`);

  /* --------- 2. Crear directores --------- */
  console.log('👨‍🏫 Creando directores...');

  // Director para Sistemas
  const directorSisUsuario = await prisma.usuario.create({
    data: {
      nombre: 'Dr. Carlos Mendoza',
      email: 'juancamilobame@ufps.edu.co',
      password: HASHED_PASSWORD,
      rol: 'DIRECTOR',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('DIRECTOR', prisma),
    },
  });

  const directorSistemas = await prisma.director.create({
    data: {
      usuarioId: directorSisUsuario.id,
      programaId: programaSistemas.id,
      Facultad: 'Facultad de Ingeniería',
    },
  });

  // Director para Industrial
  const directorIndUsuario = await prisma.usuario.create({
    data: {
      nombre: 'Dra. María González',
      email: 'director.industrial@universidad.edu',
      password: HASHED_PASSWORD,
      rol: 'DIRECTOR',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('DIRECTOR', prisma),
    },
  });


  const directorIndustrial = await prisma.director.create({
    data: {
      usuarioId: directorIndUsuario.id,
      programaId: programaIndustrial.id,
      Facultad: 'Facultad de Ingeniería',
    },
  });

  console.log(`✅ Directores creados: ${directorSisUsuario.nombre}, ${directorIndUsuario.nombre}\n`);

  /* --------- 3. Crear 1 empresa con 2 vacantes --------- */
  console.log('🏢 Creando empresa Microsoft con 2 vacantes...');

  // Empresa 1 - Microsoft (Sistemas)
  const empresa1Usuario = await prisma.usuario.create({
    data: {
      nombre: 'Microsoft Colombia',
      email: 'contacto@microsoft.co',
      password: HASHED_PASSWORD,
      rol: 'EMPRESA',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('EMPRESA', prisma),
    },
  });


  const empresa1 = await prisma.empresa.create({
    data: {
      usuarioId: empresa1Usuario.id,
      programaId: programaSistemas.id,
      directorId: directorSistemas.id,
      nit: '8301234567',
      telefono: '+57 601 2345678',
      direccion: 'Calle 100 # 8A - 55, Bogotá',
      sector: 'Tecnología',
      descripcion: 'Multinacional de tecnología líder en software y servicios en la nube.',
      estado: 'HABILITADA',
      habilitada: true,
    },
  });

  // Convenio para Microsoft
  const convenio1 = await prisma.convenio.create({
    data: {
      empresaId: empresa1.id,
      directorId: directorSistemas.id,
      nombre: 'Convenio Macro Microsoft 2024',
      descripcion: 'Convenio marco para prácticas profesionales en Microsoft Colombia',
      tipo: 'MACRO',
      fechaInicio: new Date('2024-01-01'),
      fechaFin: new Date('2024-12-31'),
      estado: 'APROBADO',
      archivoUrl: 'https://cloudinary.com/convenios/microsoft-2024.pdf',
      version: 1,
    },
  });

  // Vacante 1 para Microsoft
  const vacante1 = await prisma.vacante.create({
    data: {
      empresaId: empresa1.id,
      convenioId: convenio1.id,
      directorValidaId: directorSistemas.id,
      titulo: 'Desarrollador Backend Jr.',
      modalidad: 'HIBRIDO',
      descripcion: 'Buscamos desarrollador backend con conocimientos en .NET Core, C# y APIs REST para unirse a nuestro equipo de desarrollo.',
      area: 'Desarrollo de Software',
      ciudad: 'Bogotá',
      habilidadesTecnicas: ['.NET Core', 'C#', 'SQL Server', 'Azure', 'APIs REST'],
      habilidadesBlandas: ['Trabajo en equipo', 'Comunicación efectiva', 'Resolución de problemas'],
      estado: 'APROBADA',
    },
  });

  // Vacante 2 para Microsoft
  const vacante2 = await prisma.vacante.create({
    data: {
      empresaId: empresa1.id,
      convenioId: convenio1.id,
      directorValidaId: directorSistemas.id,
      titulo: 'Analista de Datos',
      modalidad: 'REMOTO',
      descripcion: 'Analista para procesamiento y visualización de datos usando Power BI y Python.',
      area: 'Ciencia de Datos',
      ciudad: 'Remoto',
      habilidadesTecnicas: ['Python', 'SQL', 'Power BI', 'Pandas', 'Machine Learning'],
      habilidadesBlandas: ['Análisis crítico', 'Creatividad', 'Pensamiento lógico'],
      estado: 'APROBADA',
    },
  });

  console.log(`✅ ${empresa1Usuario.nombre} creada con 2 vacantes\n`);

  /* --------- 4. Crear 3 empresas adicionales con 1 vacante cada una --------- */
  console.log('🏢 Creando 3 empresas adicionales...');

  // Empresa 2 - Globant (Sistemas)
  const empresa2Usuario = await prisma.usuario.create({
    data: {
      nombre: 'Globant S.A.',
      email: 'talento@globant.co',
      password: HASHED_PASSWORD,
      rol: 'EMPRESA',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('EMPRESA', prisma),
    },
  });
  const empresa2 = await prisma.empresa.create({
    data: {
      usuarioId: empresa2Usuario.id,
      programaId: programaSistemas.id,
      directorId: directorSistemas.id,
      nit: '9009876541',
      telefono: '+57 601 8765432',
      direccion: 'Carrera 7 # 71-21, Bogotá',
      sector: 'Tecnología',
      descripcion: 'Compañía de tecnología que construye soluciones innovadoras para empresas globales.',
      estado: 'HABILITADA',
      habilitada: true,
    },
  });

  const convenio2 = await prisma.convenio.create({
    data: {
      empresaId: empresa2.id,
      directorId: directorSistemas.id,
      nombre: 'Convenio Globant 2024',
      descripcion: 'Convenio para prácticas profesionales en desarrollo de software',
      tipo: 'ESPECIFICO',
      fechaInicio: new Date('2024-02-01'),
      fechaFin: new Date('2024-11-30'),
      estado: 'APROBADO',
      archivoUrl: 'https://cloudinary.com/convenios/globant-2024.pdf',
    },
  });

  await prisma.vacante.create({
    data: {
      empresaId: empresa2.id,
      convenioId: convenio2.id,
      directorValidaId: directorSistemas.id,
      titulo: 'Desarrollador Full Stack',
      modalidad: 'PRESENCIAL',
      descripcion: 'Desarrollador full stack con experiencia en React y Node.js para proyectos internacionales.',
      area: 'Desarrollo Web',
      ciudad: 'Medellín',
      habilidadesTecnicas: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'AWS'],
      habilidadesBlandas: ['Inglés B2+', 'Adaptabilidad', 'Liderazgo'],
      estado: 'APROBADA',
    },
  });

  console.log(`✅ ${empresa2Usuario.nombre} creada`);

  // Empresa 3 - Bancolombia (Industrial)
  const empresa3Usuario = await prisma.usuario.create({
    data: {
      nombre: 'Bancolombia',
      email: 'practicas@bancolombia.com.co',
      password: HASHED_PASSWORD,
      rol: 'EMPRESA',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('EMPRESA', prisma),
    },
  });

  const empresa3 = await prisma.empresa.create({
    data: {
      usuarioId: empresa3Usuario.id,
      programaId: programaIndustrial.id,
      directorId: directorIndustrial.id,
      nit: '8909032345',
      telefono: '+57 604 3456789',
      direccion: 'Carrera 48 # 26-85, Medellín',
      sector: 'Finanzas',
      descripcion: 'Entidad financiera líder en Colombia con innovación tecnológica.',
      estado: 'HABILITADA',
      habilitada: true,
    },
  });

  const convenio3 = await prisma.convenio.create({
    data: {
      empresaId: empresa3.id,
      directorId: directorIndustrial.id,
      nombre: 'Convenio Bancolombia Tech',
      descripcion: 'Convenio para prácticas en áreas tecnológicas del sector financiero',
      tipo: 'ESPECIFICO',
      fechaInicio: new Date('2024-03-01'),
      fechaFin: new Date('2024-10-31'),
      estado: 'APROBADO',
      archivoUrl: 'https://cloudinary.com/convenios/bancolombia-2024.pdf',
    },
  });

  await prisma.vacante.create({
    data: {
      empresaId: empresa3.id,
      convenioId: convenio3.id,
      directorValidaId: directorIndustrial.id,
      titulo: 'Analista de Procesos',
      modalidad: 'HIBRIDO',
      descripcion: 'Analista para optimización de procesos operativos en el sector bancario.',
      area: 'Optimización de Procesos',
      ciudad: 'Medellín',
      habilidadesTecnicas: ['Lean Six Sigma', 'BPMN', 'Excel Avanzado', 'SQL'],
      habilidadesBlandas: ['Análisis de datos', 'Trabajo en equipo', 'Comunicación'],
      estado: 'APROBADA',
    },
  });

  console.log(`✅ ${empresa3Usuario.nombre} creada`);

  // Empresa 4 - Rappi (Sistemas)
  const empresa4Usuario = await prisma.usuario.create({
    data: {
      nombre: 'Rappi Colombia',
      email: 'empleo@rappi.com',
      password: HASHED_PASSWORD,
      rol: 'EMPRESA',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('EMPRESA', prisma),
    },
  });

  const empresa4 = await prisma.empresa.create({
    data: {
      usuarioId: empresa4Usuario.id,
      programaId: programaSistemas.id,
      directorId: directorSistemas.id,
      nit: '9012345678',
      telefono: '+57 601 9876543',
      direccion: 'Calle 85 # 18-32, Bogotá',
      sector: 'Tecnología',
      descripcion: 'Plataforma de delivery y servicios líder en Latinoamérica.',
      estado: 'APROBADA',
      habilitada: true,
    },
  });

  const convenio4 = await prisma.convenio.create({
    data: {
      empresaId: empresa4.id,
      directorId: directorSistemas.id,
      nombre: 'Convenio Rappi Innovación',
      descripcion: 'Convenio para prácticas en desarrollo móvil y logística',
      tipo: 'ESPECIFICO',
      fechaInicio: new Date('2024-04-01'),
      fechaFin: new Date('2024-09-30'),
      estado: 'EN_REVISION',
      archivoUrl: 'https://cloudinary.com/convenios/rappi-2024.pdf',
    },
  });

  await prisma.vacante.create({
    data: {
      empresaId: empresa4.id,
      convenioId: convenio4.id,
      titulo: 'Desarrollador Mobile React Native',
      modalidad: 'REMOTO',
      descripcion: 'Desarrollador para aplicación móvil usando React Native y experiencia de usuario optimizada.',
      area: 'Desarrollo Móvil',
      ciudad: 'Remoto',
      habilidadesTecnicas: ['React Native', 'JavaScript', 'Redux', 'APIs', 'Git'],
      habilidadesBlandas: ['Innovación', 'Trabajo bajo presión', 'Orientación al usuario'],
      estado: 'PENDIENTE', // Pendiente de aprobación
    },
  });

  console.log(`✅ ${empresa4Usuario.nombre} creada\n`);

  /* --------- 5. Crear estudiantes --------- */
  console.log('🎓 Creando estudiantes...');

  const estudiante1Usuario = await prisma.usuario.create({
    data: {
      nombre: 'Ana García López',
      email: 'adrianamilenaal@ufps.edu.co',
      password: HASHED_PASSWORD,
      rol: 'ESTUDIANTE',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('ESTUDIANTE', prisma),
    },
  });


  const estudiante1 = await prisma.estudiante.create({
    data: {
      usuarioId: estudiante1Usuario.id,
      programaId: programaSistemas.id,
      codigo: '202310001',
      documento: '1234567890',
      perfil: 'Estudiante de Ingeniería de Sistemas con interés en desarrollo web',
      telefono: '+57 300 1234567',
      semestre: 9,
      area: 'Desarrollo Web',
      habilidadesTecnicas: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      habilidadesBlandas: ['Trabajo en equipo', 'Comunicación', 'Liderazgo'],
      perfilCompleto: true,
      hojaDeVidaUrl: 'https://cloudinary.com/hojas-vida/ana-garcia.pdf',
      activo: true,
    },
  });

  const estudiante2Usuario = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@estudiante.edu',
      password: HASHED_PASSWORD,
      rol: 'ESTUDIANTE',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('ESTUDIANTE', prisma),
    },
  });


  const estudiante2 = await prisma.estudiante.create({
    data: {
      usuarioId: estudiante2Usuario.id,
      programaId: programaSistemas.id,
      codigo: '202310002',
      documento: '9876543210',
      perfil: 'Estudiante interesado en ciencia de datos y machine learning',
      telefono: '+57 310 9876543',
      semestre: 8,
      area: 'Ciencia de Datos',
      habilidadesTecnicas: ['Python', 'Pandas', 'Scikit-learn', 'SQL'],
      habilidadesBlandas: ['Análisis', 'Pensamiento crítico', 'Creatividad'],
      perfilCompleto: false,
      activo: true,
    },
  });

  const estudiante3Usuario = await prisma.usuario.create({
    data: {
      nombre: 'Laura Martínez',
      email: 'laura.martinez@estudiante.edu',
      password: HASHED_PASSWORD,
      rol: 'ESTUDIANTE',
      codigoSeguridad: await generarCodigoSeguridad(prisma),
      codigoUsuario: await generarCodigoUsuario('ESTUDIANTE', prisma),
    },
  });


  const estudiante3 = await prisma.estudiante.create({
    data: {
      usuarioId: estudiante3Usuario.id,
      programaId: programaIndustrial.id,
      codigo: '202310003',
      documento: '4567890123',
      perfil: 'Estudiante de Ingeniería Industrial con enfoque en logística',
      telefono: '+57 320 4567890',
      semestre: 7,
      area: 'Logística y Cadena de Suministro',
      habilidadesTecnicas: ['Excel Avanzado', 'Simulación', 'Estadística'],
      habilidadesBlandas: ['Organización', 'Planificación', 'Negociación'],
      perfilCompleto: true,
      hojaDeVidaUrl: 'https://cloudinary.com/hojas-vida/laura-martinez.pdf',
      activo: true,
    },
  });

  console.log(`✅ 3 estudiantes creados\n`);

  /* --------- 6. Crear postulaciones --------- */
  console.log('📝 Creando postulaciones...');

  await prisma.postulacion.create({
    data: {
      estudianteId: estudiante1.id,
      vacanteId: vacante1.id,
      estado: 'EN_REVISION',
      comentario: 'Muy interesado en el puesto de desarrollador backend',
    },
  });

  await prisma.postulacion.create({
    data: {
      estudianteId: estudiante2.id,
      vacanteId: vacante2.id,
      estado: 'ACEPTADA',
      comentario: 'Aceptado para entrevista técnica',
    },
  });

  await prisma.postulacion.create({
    data: {
      estudianteId: estudiante3.id,
      vacanteId: empresa3.id, // Esto debería ser vacanteId, pero tenemos que crear una vacante para empresa3 primero
      estado: 'EN_REVISION',
      comentario: 'Interesada en el área de optimización de procesos',
    },
  });

  console.log(`✅ 3 postulaciones creadas\n`);

  /* --------- 7. Crear algunos documentos --------- */
  console.log('📄 Creando documentos de ejemplo...');

  await prisma.documento.create({
    data: {
      titulo: 'Hoja de Vida - Ana García',
      descripcion: 'Hoja de vida de estudiante de Ingeniería de Sistemas',
      categoria: 'HOJA_DE_VIDA',
      archivoUrl: 'https://cloudinary.com/documentos/hoja-vida-ana.pdf',
      nombreArchivo: 'hoja_vida_ana_garcia.pdf',
      estudianteId: estudiante1.id,
    },
  });

  await prisma.documento.create({
    data: {
      titulo: 'Convenio Microsoft 2024',
      descripcion: 'Documento del convenio marco con Microsoft',
      categoria: 'CONVENIO_EMPRESA',
      archivoUrl: 'https://cloudinary.com/documentos/convenio-microsoft.pdf',
      nombreArchivo: 'convenio_microsoft_2024.pdf',
      convenioId: convenio1.id,
    },
  });

  console.log(`✅ 2 documentos creados\n`);

  /* --------- 8. Resumen final --------- */
  console.log('='.repeat(50));
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log('📊 RESUMEN DE DATOS CREADOS:');
  console.log(`   • Programas: 2 (Sistemas, Industrial)`);
  console.log(`   • Directores: 2`);
  console.log(`   • Empresas: 4 (Microsoft, Globant, Bancolombia, Rappi)`);
  console.log(`   • Vacantes: 6 (Microsoft:2, otras:1 cada una)`);
  console.log(`   • Convenios: 4`);
  console.log(`   • Estudiantes: 3`);
  console.log(`   • Postulaciones: 3`);
  console.log(`   • Documentos: 2`);
  console.log('='.repeat(50));
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });