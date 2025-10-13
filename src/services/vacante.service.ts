import { PrismaClient, EstadoGeneral, Vacante } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Crea una nueva vacante asociada a una empresa.
 */
export const crearVacante = async (data: {
  empresaId: number;
  titulo: string;
  descripcion: string;
  area: string;
  requisitos?: string;
}) => {
  const { empresaId, titulo, descripcion, area, requisitos } = data;

  // 🔍 Validar que la empresa exista
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (!empresa) {
    throw new Error('La empresa especificada no existe.');
  }

  // Crear la vacante (estado pendiente por defecto)
  const nuevaVacante = await prisma.vacante.create({
    data: {
      empresaId,
      titulo,
      descripcion,
      area,
      requisitos: requisitos || null,
      estado: EstadoGeneral.PENDIENTE,
    },
    include: {
      empresa: {
        select: {
          id: true,
          usuario: {
            select: { nombre: true, email: true },
          },
        },
      },
    },
  });

  return nuevaVacante;
};

export const getVacanteByIdService = async (id: number): Promise<Vacante | null> => {
    return prisma.vacante.findUnique({
        where: { id },
        include: {
            empresa: true,         
            directorValida: true, 
            practicas: true        
        }
    });
};

/**
 * Lista todas las vacantes pendientes de aprobación.
 */
export const listarVacantesPendientes = async () => {
  const vacantes = await prisma.vacante.findMany({
    where: {
      estado: EstadoGeneral.PENDIENTE,
    },
    include: {
      empresa: {
        select: {
          id: true,
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
          nit: true,
        },
      },
    },
    orderBy: { creadaEn: 'desc' },
  });

  return vacantes;
};

/**
 * Lista todas las vacantes aprobadas.
 */
export const listarVacantesAprobadas = async () => {
  const vacantes = await prisma.vacante.findMany({
    where: {
      estado: EstadoGeneral.APROBADA,
    },
    include: {
      empresa: {
        select: {
          id: true,
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
          nit: true,
        },
      },
    },
    orderBy: { creadaEn: 'desc' },
  });

  return vacantes;
};

/**
 * Aprueba una vacante pendiente por parte de un director.
 */
export const aprobarVacante = async (vacanteId: number, directorId: number) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });
  if (!vacante) throw new Error('Vacante no encontrada.');
  if (vacante.estado !== EstadoGeneral.PENDIENTE)
    throw new Error('Solo se pueden aprobar vacantes pendientes.');

  const director = await prisma.director.findUnique({ where: { id: directorId } });
  if (!director) throw new Error('Director no encontrado.');

  return await prisma.vacante.update({
    where: { id: vacanteId },
    data: {
      estado: EstadoGeneral.APROBADA,
      directorValidaId: directorId,
    },
    include: {
      empresa: { select: { id: true, usuario: { select: { nombre: true, email: true } } } },
      directorValida: { select: { id: true, usuario: { select: { nombre: true, email: true } } } },
    },
  });
};

/**
 * Rechaza una vacante pendiente por parte de un director.
 */
export const rechazarVacante = async (vacanteId: number, directorId: number) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });
  if (!vacante) throw new Error('Vacante no encontrada.');
  if (vacante.estado !== EstadoGeneral.PENDIENTE)
    throw new Error('Solo se pueden rechazar vacantes pendientes.');

  const director = await prisma.director.findUnique({ where: { id: directorId } });
  if (!director) throw new Error('Director no encontrado.');

  return await prisma.vacante.update({
    where: { id: vacanteId },
    data: {
      estado: EstadoGeneral.RECHAZADA,
      directorValidaId: directorId,
    },
    include: {
      empresa: { select: { id: true, usuario: { select: { nombre: true, email: true } } } },
      directorValida: { select: { id: true, usuario: { select: { nombre: true, email: true } } } },
    },
  });
};

