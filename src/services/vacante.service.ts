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

/**
 * Solicitar eliminación de una vacante (la empresa lo solicita, no la elimina directamente)
 */
export const solicitarEliminacionVacante = async (vacanteId: number, empresaId: number) => {
  const vacante = await prisma.vacante.findUnique({
    where: { id: vacanteId },
  });

  if (!vacante) throw new Error("Vacante no encontrada.");
  if (vacante.empresaId !== empresaId)
    throw new Error("No tienes permiso para solicitar eliminación de esta vacante.");

  // Solo se puede solicitar eliminación si no está ya inactiva
  if (vacante.estado === EstadoGeneral.INACTIVA)
    throw new Error("La vacante ya está inactiva o eliminada.");

  // Aquí podrías implementar una notificación o marcar una columna especial si quisieras.
  // Por ahora devolvemos una confirmación de solicitud.
  return {
    message: "Solicitud de eliminación enviada. Un director revisará la solicitud.",
    vacanteId,
    estadoActual: vacante.estado,
  };
};

/**
 * Eliminar definitivamente (solo admin o director)
 */
export const eliminarVacanteDefinitiva = async (vacanteId: number) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });

  if (!vacante) throw new Error("Vacante no encontrada.");

  await prisma.vacante.delete({
    where: { id: vacanteId },
  });

  return { message: "Vacante eliminada permanentemente.", vacanteId };
};

/**
 * Soft delete (solo inactiva la vacante)
 */
export const inactivarVacante = async (vacanteId: number, empresaId: number) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });

  if (!vacante) throw new Error("Vacante no encontrada.");
  if (vacante.empresaId !== empresaId)
    throw new Error("No tienes permiso para modificar esta vacante.");

  if (vacante.estado === EstadoGeneral.INACTIVA)
    throw new Error("La vacante ya se encuentra inactiva.");

  const vacanteInactiva = await prisma.vacante.update({
    where: { id: vacanteId },
    data: { estado: EstadoGeneral.INACTIVA },
  });

  return vacanteInactiva;
};
