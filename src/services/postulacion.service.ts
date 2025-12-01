import { PrismaClient, EstadoPostulacion, EstadoGeneral, Prisma, PrioridadNotificacion, TipoNotificacion } from '@prisma/client';
import {
  CrearPostulacionDTO,
  FiltrosPostulacion,
  ResultadoPaginado,
  POSTULACION_INCLUDE,
  POSTULACION_ESTUDIANTE_INCLUDE,
  POSTULACION_EMPRESA_INCLUDE,
} from '../types/postulacion.types.js';
import { crearNotificacion } from './notificacion.service.js';

const prisma = new PrismaClient();

// Constantes
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const ESTADOS_POSTULACION_ACTIVA = [EstadoPostulacion.EN_REVISION, EstadoPostulacion.ACEPTADA];

// Mensajes de error
const ERROR_MESSAGES = {
  ESTUDIANTE_NO_ENCONTRADO: 'Estudiante no encontrado.',
  VACANTE_NO_ENCONTRADA: 'Vacante no encontrada.',
  SOLO_VACANTES_APROBADAS: 'Solo se puede aplicar a vacantes aprobadas.',
  POSTULACION_EXISTENTE: 'Ya has aplicado a esta vacante.',
  POSTULACION_NO_ENCONTRADA: 'Postulación no encontrada.',
  SIN_PERMISO_CANCELAR: 'No tienes permiso para cancelar esta postulación.',
  SOLO_CANCELAR_EN_REVISION: 'Solo se pueden cancelar postulaciones en revisión.',
} as const;

/**
 * Valida que un estudiante exista
 */
const validarEstudiante = async (estudianteId: number): Promise<void> => {
  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
  });

  if (!estudiante) {
    throw new Error(ERROR_MESSAGES.ESTUDIANTE_NO_ENCONTRADO);
  }
};

/**
 * Valida que una vacante exista y esté aprobada
 */
const validarVacante = async (vacanteId: number): Promise<void> => {
  const vacante = await prisma.vacante.findUnique({
    where: { id: vacanteId },
  });

  if (!vacante) {
    throw new Error(ERROR_MESSAGES.VACANTE_NO_ENCONTRADA);
  }

  if (vacante.estado !== EstadoGeneral.APROBADA) {
    throw new Error(ERROR_MESSAGES.SOLO_VACANTES_APROBADAS);
  }
};

/**
 * Verifica si ya existe una postulación activa
 */
const verificarPostulacionExistente = async (
  estudianteId: number,
  vacanteId: number
): Promise<void> => {
  const postulacionExistente = await prisma.postulacion.findFirst({
    where: {
      estudianteId,
      vacanteId,
      estado: { in: ESTADOS_POSTULACION_ACTIVA },
    },
  });

  if (postulacionExistente) {
    throw new Error(ERROR_MESSAGES.POSTULACION_EXISTENTE);
  }
};

/**
 * Construye filtros de paginación
 */
const construirFiltrosPaginacion = (filtros?: FiltrosPostulacion) => {
  const page = filtros?.page || DEFAULT_PAGE;
  const limit = filtros?.limit || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Construye respuesta paginada
 */
const construirRespuestaPaginada = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ResultadoPaginado<T> => ({
  data,
  total,
  page,
  pageSize: limit,
  totalPages: Math.ceil(total / limit),
});

/**
 * Crea una nueva postulación de un estudiante a una vacante
 */
export const crearPostulacion = async (data: CrearPostulacionDTO) => {
  const { estudianteId, vacanteId, comentario } = data;

  // Validaciones
  await validarEstudiante(estudianteId);
  await validarVacante(vacanteId);
  await verificarPostulacionExistente(estudianteId, vacanteId);

  // Crear la postulación
  const nuevaPostulacion = await prisma.postulacion.create({
    data: {
      estudianteId,
      vacanteId,
      comentario: comentario || null,
      estado: EstadoPostulacion.EN_REVISION,
    },
    include: POSTULACION_INCLUDE,
  });

  await crearNotificacion({
      tipo: TipoNotificacion.NUEVA_POSTULACION,
      titulo: "Nueva Postulación",
      mensaje: `Se ha creado una nueva postulación a la vacante ${nuevaPostulacion.vacante.titulo}.`,
      prioridad: PrioridadNotificacion.MEDIA,
      destinatarioId: nuevaPostulacion.vacante.empresa.usuarioId,
      destinatarioRol: "ESTUDIANTE",
      data: { vacanteId: nuevaPostulacion.id }
    });

  return nuevaPostulacion;
};

export const postularMultiples = async (vacanteId: number, estudianteIds: number[]) => {
  const resultados = [];
  const yaPostulados: number[] = [];
  const creados: number[] = [];

  for (const estudianteId of estudianteIds) {
    try {
      const postulacion = await crearPostulacion({
        estudianteId,
        vacanteId,
      });

      creados.push(estudianteId);
      resultados.push(postulacion);

    } catch (error: any) {
      if (error.message.includes("ya existe una postulación")) {
        yaPostulados.push(estudianteId);
        continue;
      }
      throw new Error(`Error con estudiante ${estudianteId}: ${error.message}`);
    }
  }

  return {
    totalRecibidos: estudianteIds.length,
    creados,
    yaPostulados,
    detalle: resultados,
  };
}

/**
 * Obtiene las postulaciones de un estudiante
 */
export const obtenerPostulacionesPorEstudiante = async (
  estudianteId: number,
  filtros?: FiltrosPostulacion
): Promise<ResultadoPaginado<any>> => {
  const { page, limit, skip } = construirFiltrosPaginacion(filtros);

  const where: Prisma.PostulacionWhereInput = {
    estudianteId,
    ...(filtros?.estado && { estado: filtros.estado }),
  };

  const [postulaciones, total] = await Promise.all([
    prisma.postulacion.findMany({
      where,
      include: POSTULACION_ESTUDIANTE_INCLUDE,
      orderBy: { fechaPostula: 'desc' },
      skip,
      take: limit,
    }),
    prisma.postulacion.count({ where }),
  ]);

  return construirRespuestaPaginada(postulaciones, total, page, limit);
};

/**
 * Obtiene las postulaciones de una vacante específica
 */
export const obtenerPostulacionesPorVacante = async (
  vacanteId: number,
  filtros?: FiltrosPostulacion
): Promise<ResultadoPaginado<any>> => {
  const { page, limit, skip } = construirFiltrosPaginacion(filtros);

  const where: Prisma.PostulacionWhereInput = {
    vacanteId,
    ...(filtros?.estado && { estado: filtros.estado }),
  };

  const [postulaciones, total] = await Promise.all([
    prisma.postulacion.findMany({
      where,
      include: {
        estudiante: {
          include: {
            usuario: {
              select: { id: true, nombre: true, email: true },
            },
          },
        },
      },
      orderBy: { fechaPostula: 'desc' },
      skip,
      take: limit,
    }),
    prisma.postulacion.count({ where }),
  ]);

  return construirRespuestaPaginada(postulaciones, total, page, limit);
};

/**
 * Obtiene una postulación específica por ID
 */
export const obtenerPostulacionPorId = async (postulacionId: number) => {
  const postulacion = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
    include: POSTULACION_INCLUDE,
  });

  if (!postulacion) {
    throw new Error(ERROR_MESSAGES.POSTULACION_NO_ENCONTRADA);
  }

  return postulacion;
};

/**
 * Actualiza el estado de una postulación
 */
export const actualizarEstadoPostulacion = async (
  postulacionId: number,
  nuevoEstado: EstadoPostulacion
) => {
  return await prisma.$transaction(async (tx) => {
    const postulacion = await tx.postulacion.findUnique({
      where: { id: postulacionId },
    });

    if (!postulacion) {
      throw new Error(ERROR_MESSAGES.POSTULACION_NO_ENCONTRADA);
    }

    const postulacionActualizada = await tx.postulacion.update({
      where: { id: postulacionId },
      data: { estado: nuevoEstado },
      include: POSTULACION_INCLUDE,
    });

    if (nuevoEstado === "ACEPTADA") {
      const estudianteId = postulacion.estudianteId;
      const vacanteId = postulacion.vacanteId;

      if (!estudianteId || !vacanteId) {
        throw new Error("La postulación no tiene estudiante o vacante asociados");
      }

      // Revisar si ya existe
      const existePractica = await tx.practica.findUnique({
        where: { estudianteId_vacanteId: { estudianteId, vacanteId } },
      });

      if (!existePractica) {
        await tx.practica.create({
          data: {
            estudianteId,
            vacanteId,
            estado: "EN_PROCESO",
            inicio: new Date(),
          },
        });
      }
    }

    return postulacionActualizada;

  });
};

/**
 * Cancela una postulación (solo si está en revisión)
 */
export const cancelarPostulacion = async (
  postulacionId: number,
  estudianteId: number
) => {
  const postulacion = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
  });

  if (!postulacion) {
    throw new Error(ERROR_MESSAGES.POSTULACION_NO_ENCONTRADA);
  }

  if (postulacion.estudianteId !== estudianteId) {
    throw new Error(ERROR_MESSAGES.SIN_PERMISO_CANCELAR);
  }

  if (postulacion.estado !== EstadoPostulacion.EN_REVISION) {
    throw new Error(ERROR_MESSAGES.SOLO_CANCELAR_EN_REVISION);
  }

  const postulacionCancelada = await prisma.postulacion.update({
    where: { id: postulacionId },
    data: { estado: EstadoPostulacion.CANCELADA },
    include: POSTULACION_INCLUDE,
  });

  return postulacionCancelada;
};

/**
 * Obtiene las postulaciones de todas las vacantes de una empresa
 */
export const obtenerPostulacionesPorEmpresa = async (
  empresaId: number,
  filtros?: FiltrosPostulacion
): Promise<ResultadoPaginado<any>> => {
  const { page, limit, skip } = construirFiltrosPaginacion(filtros);

  const where: Prisma.PostulacionWhereInput = {
    vacante: {
      empresaId,
      ...(filtros?.vacante && {
        OR: [
          { titulo: { contains: filtros.vacante, mode: 'insensitive' } },
          {
            id: isNaN(Number(filtros.vacante))
              ? undefined
              : Number(filtros.vacante),
          },
        ],
      }),
    },

    ...(filtros?.estado && { estado: filtros.estado }),

    ...(filtros?.estudiante && {
      estudiante: {
        usuario: {
          nombre: {
            contains: filtros.estudiante,
            mode: "insensitive",
          },
        },
      },
    }),
  };

  // Filtro por fechaPostula
  if (filtros?.fechaPostula) {
    const fecha = new Date(filtros.fechaPostula);

    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    where.fechaPostula = {
      gte: inicio,
      lte: fin,
    };
  }

  const [postulaciones, total] = await Promise.all([
    prisma.postulacion.findMany({
      where,
      include: {
        estudiante: {
          include: {
            usuario: true,
          },
        },
        vacante: true,
      },
      orderBy: { fechaPostula: 'desc' },
      skip,
      take: limit,
    }),
    prisma.postulacion.count({ where }),
  ]);

  return construirRespuestaPaginada(postulaciones, total, page, limit);
};
