import { PrismaClient, Rol } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtiene o crea una conversación entre una empresa y un director
 */
export const obtenerOCrearConversacion = async (empresaId: number, directorId: number) => {
  // Verificar que la empresa exista
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: { usuario: { select: { nombre: true } } },
  });
  if (!empresa) throw new Error("Empresa no encontrada");

  // Verificar que el director exista
  const director = await prisma.director.findUnique({
    where: { id: directorId },
    include: { usuario: { select: { nombre: true } } },
  });
  if (!director) throw new Error("Director no encontrado");

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
  if (!conversacion) throw new Error("Conversación no encontrada");

  // Validar que el remitente pertenece a la conversación
  if (remitenteRol === 'EMPRESA') {
    const empresa = await prisma.empresa.findFirst({
      where: { id: remitenteId, usuarioId: remitenteId },
    });
    if (!empresa || empresa.id !== conversacion.empresaId) {
      throw new Error("No tienes permiso para enviar mensajes en esta conversación");
    }
  } else if (remitenteRol === 'DIRECTOR') {
    const director = await prisma.director.findFirst({
      where: { id: remitenteId, usuarioId: remitenteId },
    });
    if (!director || director.id !== conversacion.directorId) {
      throw new Error("No tienes permiso para enviar mensajes en esta conversación");
    }
  }

  // Validar que hay contenido o archivos
  if (!contenido && (!archivos || archivos.length === 0)) {
    throw new Error("Debes proporcionar contenido o archivos");
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

  if (!conversacion) throw new Error("Conversación no encontrada");

  // Verificar permisos
  if (rol === 'EMPRESA') {
    const empresa = await prisma.empresa.findFirst({
      where: { usuarioId },
    });
    if (!empresa || empresa.id !== conversacion.empresaId) {
      throw new Error("No tienes permiso para ver esta conversación");
    }
  } else if (rol === 'DIRECTOR') {
    const director = await prisma.director.findFirst({
      where: { usuarioId },
    });
    if (!director || director.id !== conversacion.directorId) {
      throw new Error("No tienes permiso para ver esta conversación");
    }
  } else {
    throw new Error("Rol no autorizado para ver conversaciones");
  }

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
  if (rol === 'EMPRESA') {
    const empresa = await prisma.empresa.findFirst({
      where: { usuarioId },
    });
    if (!empresa) throw new Error("Empresa no encontrada");

    const conversaciones = await prisma.conversacion.findMany({
      where: { empresaId: empresa.id },
      include: {
        director: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
        },
        empresa: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
        },
        mensajes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            archivos: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversaciones;
  } else if (rol === 'DIRECTOR') {
    const director = await prisma.director.findFirst({
      where: { usuarioId },
    });
    if (!director) throw new Error("Director no encontrado");

    const conversaciones = await prisma.conversacion.findMany({
      where: { directorId: director.id },
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
          include: {
            archivos: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversaciones;
  } else {
    throw new Error("Rol no autorizado para ver conversaciones");
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

  if (!conversacion) throw new Error("Conversación no encontrada");

  // Verificar permisos
  if (rol === 'EMPRESA') {
    const empresa = await prisma.empresa.findFirst({
      where: { usuarioId },
    });
    if (!empresa || empresa.id !== conversacion.empresaId) {
      throw new Error("No tienes permiso para ver esta conversación");
    }
  } else if (rol === 'DIRECTOR') {
    const director = await prisma.director.findFirst({
      where: { usuarioId },
    });
    if (!director || director.id !== conversacion.directorId) {
      throw new Error("No tienes permiso para ver esta conversación");
    }
  } else {
    throw new Error("Rol no autorizado");
  }

  return conversacion;
};
