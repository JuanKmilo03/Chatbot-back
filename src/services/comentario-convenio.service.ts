/**
 * Servicio para gestionar comentarios en convenios
 * Funcionalidad tipo foro/issues donde directores y empresas pueden comentar
 */

import { PrismaClient } from '@prisma/client';
import { getSocketIO } from '../config/socket.config.js';
import {
  CrearComentarioDTO,
  ActualizarComentarioDTO,
  ComentarioConvenioResponse,
  ObtenerComentariosQuery,
  ResultadoPaginadoComentarios,
} from '../types/comentario-convenio.types.js';

const prisma = new PrismaClient();

/**
 * Crea un nuevo comentario en un convenio
 * @param dto Datos del comentario a crear
 * @returns Comentario creado con información del autor
 */
export const crearComentario = async (
  dto: CrearComentarioDTO
): Promise<ComentarioConvenioResponse> => {
  try {
    // Validar que el convenio existe
    const convenio = await prisma.convenio.findUnique({
      where: { id: dto.convenioId },
      include: {
        empresa: { include: { usuario: true } },
        director: { include: { usuario: true } },
      },
    });

    if (!convenio) {
      throw new Error('Convenio no encontrado');
    }

    // Validar que el autor tiene permiso para comentar en este convenio
    const tienePermiso = validarPermisoComentario(dto, convenio);
    if (!tienePermiso) {
      throw new Error('No tienes permiso para comentar en este convenio');
    }

    // Obtener nombre del autor
    const autorNombre = await obtenerNombreAutor(dto.autorId, dto.autorRol);

    // Crear el comentario
    const nuevoComentario = await prisma.comentarioConvenio.create({
      data: {
        convenioId: dto.convenioId,
        autorId: dto.autorId,
        autorRol: dto.autorRol,
        contenido: dto.contenido,
      },
    });

    const comentarioResponse: ComentarioConvenioResponse = {
      id: nuevoComentario.id,
      convenioId: nuevoComentario.convenioId,
      autorId: nuevoComentario.autorId,
      autorRol: nuevoComentario.autorRol as 'EMPRESA' | 'DIRECTOR',
      autorNombre,
      contenido: nuevoComentario.contenido,
      editado: nuevoComentario.editado,
      creadoEn: nuevoComentario.creadoEn,
      actualizadoEn: nuevoComentario.actualizadoEn,
    };

    // Enviar notificación en tiempo real por WebSocket
    await enviarNotificacionWebSocket(comentarioResponse, convenio);

    console.log(`Comentario creado en convenio ${dto.convenioId} por ${dto.autorRol}`);

    return comentarioResponse;
  } catch (error) {
    console.error('Error al crear comentario:', error);
    throw error;
  }
};

/**
 * Obtiene todos los comentarios de un convenio con paginación
 * @param convenioId ID del convenio
 * @param query Parámetros de consulta (paginación, ordenamiento)
 * @returns Lista paginada de comentarios
 */
export const obtenerComentariosPorConvenio = async (
  convenioId: number,
  query: ObtenerComentariosQuery = {}
): Promise<ResultadoPaginadoComentarios> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const ordenar = query.ordenar || 'ASC';
    const skip = (page - 1) * limit;

    // Verificar que el convenio existe
    const convenio = await prisma.convenio.findUnique({
      where: { id: convenioId },
    });

    if (!convenio) {
      throw new Error('Convenio no encontrado');
    }

    // Obtener comentarios
    const [comentarios, total] = await Promise.all([
      prisma.comentarioConvenio.findMany({
        where: { convenioId },
        orderBy: { creadoEn: ordenar === 'ASC' ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
      prisma.comentarioConvenio.count({
        where: { convenioId },
      }),
    ]);

    // Enriquecer comentarios con información del autor
    const comentariosConAutor = await Promise.all(
      comentarios.map(async (comentario) => {
        const autorNombre = await obtenerNombreAutor(
          comentario.autorId,
          comentario.autorRol as 'EMPRESA' | 'DIRECTOR'
        );

        return {
          id: comentario.id,
          convenioId: comentario.convenioId,
          autorId: comentario.autorId,
          autorRol: comentario.autorRol as 'EMPRESA' | 'DIRECTOR',
          autorNombre,
          contenido: comentario.contenido,
          editado: comentario.editado,
          creadoEn: comentario.creadoEn,
          actualizadoEn: comentario.actualizadoEn,
        };
      })
    );

    return {
      data: comentariosConAutor,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    throw error;
  }
};

/**
 * Actualiza un comentario existente
 * @param comentarioId ID del comentario
 * @param autorId ID del autor (para validar permisos)
 * @param dto Datos actualizados
 * @returns Comentario actualizado
 */
export const actualizarComentario = async (
  comentarioId: number,
  autorId: number,
  dto: ActualizarComentarioDTO
): Promise<ComentarioConvenioResponse> => {
  try {
    // Verificar que el comentario existe
    const comentarioExistente = await prisma.comentarioConvenio.findUnique({
      where: { id: comentarioId },
    });

    if (!comentarioExistente) {
      throw new Error('Comentario no encontrado');
    }

    // Validar que el autor es quien intenta editar
    if (comentarioExistente.autorId !== autorId) {
      throw new Error('No tienes permiso para editar este comentario');
    }

    // Actualizar comentario
    const comentarioActualizado = await prisma.comentarioConvenio.update({
      where: { id: comentarioId },
      data: {
        contenido: dto.contenido,
        editado: true,
      },
    });

    // Obtener nombre del autor
    const autorNombre = await obtenerNombreAutor(
      comentarioActualizado.autorId,
      comentarioActualizado.autorRol as 'EMPRESA' | 'DIRECTOR'
    );

    const comentarioResponse: ComentarioConvenioResponse = {
      id: comentarioActualizado.id,
      convenioId: comentarioActualizado.convenioId,
      autorId: comentarioActualizado.autorId,
      autorRol: comentarioActualizado.autorRol as 'EMPRESA' | 'DIRECTOR',
      autorNombre,
      contenido: comentarioActualizado.contenido,
      editado: comentarioActualizado.editado,
      creadoEn: comentarioActualizado.creadoEn,
      actualizadoEn: comentarioActualizado.actualizadoEn,
    };

    console.log(`✅ Comentario ${comentarioId} actualizado`);

    return comentarioResponse;
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    throw error;
  }
};

/**
 * Elimina un comentario
 * @param comentarioId ID del comentario
 * @param autorId ID del autor (para validar permisos)
 */
export const eliminarComentario = async (
  comentarioId: number,
  autorId: number
): Promise<void> => {
  try {
    // Verificar que el comentario existe
    const comentario = await prisma.comentarioConvenio.findUnique({
      where: { id: comentarioId },
    });

    if (!comentario) {
      throw new Error('Comentario no encontrado');
    }

    // Validar que el autor es quien intenta eliminar
    if (comentario.autorId !== autorId) {
      throw new Error('No tienes permiso para eliminar este comentario');
    }

    // Eliminar comentario
    await prisma.comentarioConvenio.delete({
      where: { id: comentarioId },
    });

    console.log(`✅ Comentario ${comentarioId} eliminado`);
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    throw error;
  }
};

/**
 * Obtiene el nombre del autor según su rol
 */
const obtenerNombreAutor = async (
  autorId: number,
  autorRol: 'EMPRESA' | 'DIRECTOR'
): Promise<string> => {
  try {
    if (autorRol === 'EMPRESA') {
      const empresa = await prisma.empresa.findUnique({
        where: { id: autorId },
        include: { usuario: true },
      });
      return empresa?.usuario.nombre || 'Empresa desconocida';
    } else if (autorRol === 'DIRECTOR') {
      const director = await prisma.director.findUnique({
        where: { id: autorId },
        include: { usuario: true },
      });
      return director?.usuario.nombre || 'Director desconocido';
    }
    return 'Usuario desconocido';
  } catch (error) {
    console.error('Error al obtener nombre del autor:', error);
    return 'Usuario desconocido';
  }
};

/**
 * Valida que el usuario tiene permiso para comentar en el convenio
 */
const validarPermisoComentario = (dto: CrearComentarioDTO, convenio: any): boolean => {
  if (dto.autorRol === 'EMPRESA') {
    // La empresa debe ser la dueña del convenio
    return convenio.empresaId === dto.autorId;
  } else if (dto.autorRol === 'DIRECTOR') {
    // El director debe estar asignado al convenio
    return convenio.directorId === dto.autorId;
  }
  return false;
};

/**
 * Envía notificación en tiempo real por WebSocket
 */
const enviarNotificacionWebSocket = async (
  comentario: ComentarioConvenioResponse,
  convenio: any
): Promise<void> => {
  try {
    const io = getSocketIO();
    if (!io) {
      console.warn('Socket.IO no está disponible');
      return;
    }

    // Notificar a la empresa si el comentario es del director
    if (comentario.autorRol === 'DIRECTOR' && convenio.empresaId) {
      io.to(`user:${convenio.empresaId}`).emit('nuevo_comentario_convenio', {
        convenioId: comentario.convenioId,
        comentario,
      });
    }

    // Notificar al director si el comentario es de la empresa
    if (comentario.autorRol === 'EMPRESA' && convenio.directorId) {
      io.to(`user:${convenio.directorId}`).emit('nuevo_comentario_convenio', {
        convenioId: comentario.convenioId,
        comentario,
      });
    }

    console.log(`📡 Notificación WebSocket enviada para comentario en convenio ${comentario.convenioId}`);
  } catch (error) {
    console.error('Error al enviar notificación WebSocket:', error);
    // No lanzamos el error para que no falle la creación del comentario
  }
};
