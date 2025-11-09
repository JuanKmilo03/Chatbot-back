import { Rol } from '@prisma/client';
import { prisma } from '../config/db.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

/**
 * Obtiene el ID de la empresa basado en el usuarioId
 */
const obtenerEmpresaId = async (usuarioId: number): Promise<number> => {
  const empresa = await prisma.empresa.findFirst({
    where: { usuarioId },
    select: { id: true },
  });
  if (!empresa) throw new NotFoundError("Empresa no encontrada");
  return empresa.id;
};

/**
 * Obtiene el ID del director basado en el usuarioId
 */
const obtenerDirectorId = async (usuarioId: number): Promise<number> => {
  const director = await prisma.director.findFirst({
    where: { usuarioId },
    select: { id: true },
  });
  if (!director) throw new NotFoundError("Director no encontrado");
  return director.id;
};

/**
 * Valida que el usuario tenga permiso para acceder a una conversación
 */
const validarPermisoConversacion = async (
  conversacion: { empresaId: number; directorId: number },
  usuarioId: number,
  rol: Rol
): Promise<void> => {
  if (rol === 'EMPRESA') {
    const empresaId = await obtenerEmpresaId(usuarioId);
    if (empresaId !== conversacion.empresaId) {
      throw new ForbiddenError("No tienes permiso para acceder a esta conversación");
    }
  } else if (rol === 'DIRECTOR') {
    const directorId = await obtenerDirectorId(usuarioId);
    if (directorId !== conversacion.directorId) {
      throw new ForbiddenError("No tienes permiso para acceder a esta conversación");
    }
  } else {
    throw new ForbiddenError("Rol no autorizado");
  }
};

/**
 * Obtiene o crea una conversación entre una empresa y un director
 */
export const obtenerOCrearConversacion = async (empresaId: number, directorId: number) => {
  // Verificar que la empresa exista
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: { usuario: { select: { nombre: true } } },
  });
  if (!empresa) throw new NotFoundError("Empresa no encontrada");

  // Verificar que el director exista
  const director = await prisma.director.findUnique({
    where: { id: directorId },
    include: { usuario: { select: { nombre: true } } },
  });
  if (!director) throw new NotFoundError("Director no encontrado");

  // Buscar conversación existente
  let conversacion = await prisma.conversacion.findUnique({
    where: {
      empresaId_directorId: {
        empresaId,
        directorId,
      },
    },
    include: {
      empresa: {
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
      },
      director: {
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
      },
      mensajes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Si no existe, crear nueva conversación
  if (!conversacion) {
    conversacion = await prisma.conversacion.create({
      data: {
        empresaId,
        directorId,
        titulo: `Conversación: ${empresa.usuario.nombre} - ${director.usuario.nombre}`,
      },
      include: {
        empresa: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
        },
        director: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
        },
        mensajes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  return conversacion;
};

/**
 * Envía un mensaje en una conversación
 */
export const enviarMensaje = async (
  conversacionId: number,
  remitenteId: number,
  remitenteRol: Rol,
  contenido?: string,
  archivos?: Array<{
    nombreArchivo: string;
    archivoUrl: string;
    publicId?: string;
    mimeType?: string;
    fileSize?: number;
  }>
) => {
  // Verificar que la conversación existe
  const conversacion = await prisma.conversacion.findUnique({
    where: { id: conversacionId },
  });
  if (!conversacion) throw new NotFoundError("Conversación no encontrada");

  // Validar que el remitente pertenece a la conversación
  await validarPermisoConversacion(conversacion, remitenteId, remitenteRol);

  // Validar que hay contenido o archivos
  if (!contenido && (!archivos || archivos.length === 0)) {
    throw new BadRequestError("Debes proporcionar contenido o archivos");
  }

  // Crear mensaje
  const mensaje = await prisma.mensaje.create({
    data: {
      conversacionId,
      remitenteId,
      remitenteRol,
      contenido: contenido || null,
      archivos: archivos
        ? {
            create: archivos.map((archivo) => ({
              nombreArchivo: archivo.nombreArchivo,
              archivoUrl: archivo.archivoUrl,
              publicId: archivo.publicId,
              mimeType: archivo.mimeType,
              fileSize: archivo.fileSize,
            })),
          }
        : undefined,
    },
    include: {
      archivos: true,
    },
  });

  // Actualizar la fecha de actualización de la conversación
  await prisma.conversacion.update({
    where: { id: conversacionId },
    data: { updatedAt: new Date() },
  });

  return mensaje;
};

/**
 * Obtiene los mensajes de una conversación con paginación
 */
export const obtenerMensajes = async (
  conversacionId: number,
  usuarioId: number,
  rol: Rol,
  params: {
    page?: number;
    pageSize?: number;
  }
) => {
  const { page = 1, pageSize = 50 } = params;

  // Verificar que la conversación existe
  const conversacion = await prisma.conversacion.findUnique({
    where: { id: conversacionId },
    include: {
      empresa: true,
      director: true,
    },
  });

  if (!conversacion) throw new NotFoundError("Conversación no encontrada");

  // Verificar permisos
  await validarPermisoConversacion(conversacion, usuarioId, rol);

  // Obtener mensajes con paginación
  const [mensajes, total] = await Promise.all([
    prisma.mensaje.findMany({
      where: { conversacionId },
      include: {
        archivos: true,
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mensaje.count({
      where: { conversacionId },
    }),
  ]);

  return {
    data: mensajes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Obtiene todas las conversaciones de un usuario
 */
export const obtenerConversaciones = async (usuarioId: number, rol: Rol) => {
  const includeOptions = {
    director: {
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
    },
    empresa: {
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
    },
    mensajes: {
      orderBy: { createdAt: 'desc' } as const,
      take: 1,
      include: {
        archivos: true,
      },
    },
  };

  if (rol === 'EMPRESA') {
    const empresaId = await obtenerEmpresaId(usuarioId);
    return await prisma.conversacion.findMany({
      where: { empresaId },
      include: includeOptions,
      orderBy: { updatedAt: 'desc' },
    });
  } else if (rol === 'DIRECTOR') {
    const directorId = await obtenerDirectorId(usuarioId);
    return await prisma.conversacion.findMany({
      where: { directorId },
      include: includeOptions,
      orderBy: { updatedAt: 'desc' },
    });
  } else {
    throw new ForbiddenError("Rol no autorizado para ver conversaciones");
  }
};

/**
 * Obtiene una conversación por ID
 */
export const obtenerConversacionPorId = async (
  conversacionId: number,
  usuarioId: number,
  rol: Rol
) => {
  const conversacion = await prisma.conversacion.findUnique({
    where: { id: conversacionId },
    include: {
      empresa: {
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
      },
      director: {
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
      },
    },
  });

  if (!conversacion) throw new NotFoundError("Conversación no encontrada");

  // Verificar permisos
  await validarPermisoConversacion(conversacion, usuarioId, rol);

  return conversacion;
};
