/**
 * Servicio de gestión de notificaciones
 * Maneja la lógica de negocio para crear, leer y gestionar notificaciones
 */

import { prisma } from '../config/db.js';
import {
  CrearNotificacionDTO,
  FiltrosNotificacion,
  ResultadoPaginadoNotificaciones,
} from '../types/notificacion.types.js';
import { PrioridadNotificacion, Rol, TipoNotificacion } from '@prisma/client';
import { getSocketIO } from '../config/socket.config.js';
import { sendMailWithTemplate } from '../utils/mailer.js';

/**
 * Crea una nueva notificación en la base de datos y la envía por WebSocket
 */
export const crearNotificacion = async (
  dto: CrearNotificacionDTO
): Promise<any> => {
  try {
    // Validar que el destinatario existe según su rol
    await validarDestinatario(dto.destinatarioId, dto.destinatarioRol);

    // Crear la notificación en la base de datos
    const notificacion = await prisma.notificacion.create({
      data: {
        tipo: dto.tipo,
        titulo: dto.titulo,
        mensaje: dto.mensaje,
        prioridad: dto.prioridad,
        destinatarioId: dto.destinatarioId,
        destinatarioRol: dto.destinatarioRol,
        data: dto.data || {},
        leida: false,
      },
    });

    // Enviar notificación en tiempo real por WebSocket
    await enviarNotificacionWebSocket(notificacion);

    // Enviar correo si el destinatario es un director
    if (dto.destinatarioRol === 'DIRECTOR') {
      await enviarCorreoNotificacion(notificacion);
    }

    return notificacion;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

/**
 * Envía una notificación por WebSocket al destinatario
 */
const enviarNotificacionWebSocket = async (notificacion: any): Promise<void> => {
  try {
    const io = getSocketIO();
    if (!io) {
      console.warn('Socket.IO no está disponible');
      return;
    }

    // Emitir al usuario específico
    // El socket.config.ts debe tener lógica para unir usuarios a rooms por su ID
    const roomName = `user:${notificacion.destinatarioId}`;

    io.to(roomName).emit('nueva-notificacion', {
      id: notificacion.id,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      prioridad: notificacion.prioridad,
      data: notificacion.data,
      leida: notificacion.leida,
      creadaEn: notificacion.creadaEn,
    });

    console.log(`✅ Notificación enviada a usuario ${notificacion.destinatarioId} (${notificacion.tipo})`);
  } catch (error) {
    console.error('Error al enviar notificación por WebSocket:', error);
    // No lanzamos el error para que no falle la creación de la notificación
  }
};

/**
 * Envía un correo electrónico con la notificación al director
 */
const enviarCorreoNotificacion = async (notificacion: any): Promise<void> => {
  try {
    // Obtener información del director (incluyendo su email)
    const director = await prisma.director.findUnique({
      where: { id: notificacion.destinatarioId },
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!director || !director.usuario.email) {
      console.warn(`No se pudo obtener email del director ${notificacion.destinatarioId}`);
      return;
    }

    // Obtener el template ID según el tipo de notificación
    const templateId = obtenerTemplateIdPorTipo(notificacion.tipo);

    if (!templateId) {
      console.warn(`No hay template configurado para tipo: ${notificacion.tipo}`);
      return;
    }

    // Preparar datos dinámicos para la plantilla de SendGrid
    const dynamicTemplateData = {
      nombre: director.usuario.nombre,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      prioridad: notificacion.prioridad,
      tipo: notificacion.tipo,
      fecha: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      ...notificacion.data, // Datos adicionales específicos del tipo
    };

    // Enviar correo usando SendGrid
    await sendMailWithTemplate(
      director.usuario.email,
      templateId,
      dynamicTemplateData
    );

    console.log(`📧 Correo de notificación enviado a ${director.usuario.email} (${notificacion.tipo})`);
  } catch (error) {
    console.error('Error al enviar correo de notificación:', error);
    // No lanzamos el error para que no falle la creación de la notificación
  }
};

/**
 * Obtiene el ID de la plantilla de SendGrid según el tipo de notificación
 * IMPORTANTE: Debes crear estas plantillas en tu cuenta de SendGrid y actualizar estos IDs
 */
const obtenerTemplateIdPorTipo = (tipo: string): string | null => {
  // TODO: Reemplazar estos IDs con los de tus plantillas reales de SendGrid
  const templates: Record<string, string> = {
    CONVENIO_PROXIMO_VENCER: process.env.SENDGRID_TEMPLATE_CONVENIO_VENCER || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    CONVENIO_VENCIDO: process.env.SENDGRID_TEMPLATE_CONVENIO_VENCIDO || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    NUEVA_SOLICITUD_VACANTE: process.env.SENDGRID_TEMPLATE_NUEVA_VACANTE || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  };

  return templates[tipo] || null;
};

/**
 * Valida que el destinatario existe según su rol
 */
const validarDestinatario = async (
  destinatarioId: number,
  rol: string
): Promise<void> => {
  let existe = false;

  existe = !!(await prisma.usuario.findUnique({
    where: { id: destinatarioId }
  }));

  // switch (rol) {
  //   case 'DIRECTOR':
  //     existe = !!(await prisma.director.findUnique({
  //       where: { id: destinatarioId }
  //     }));
  //     break;
  //   case 'EMPRESA':
  //     existe = !!(await prisma.empresa.findUnique({
  //       where: { id: destinatarioId }
  //     }));
  //     break;
  //   case 'ESTUDIANTE':
  //     existe = !!(await prisma.estudiante.findUnique({
  //       where: { id: destinatarioId }
  //     }));
  //     break;
  //   default:
  //     throw new Error(`Rol desconocido: ${rol}`);
  // }

  if (!existe) {
    throw new Error(`Destinatario no encontrado: ${rol} con ID ${destinatarioId}`);
  }
};

/**
 * Obtiene notificaciones con filtros y paginación
 */
export const obtenerNotificaciones = async (
  filtros: FiltrosNotificacion
): Promise<ResultadoPaginadoNotificaciones> => {
  const page = filtros.page || 1;
  const limit = filtros.limit || 20;
  const skip = (page - 1) * limit;

  // Construir el where de Prisma
  const where: any = {};

  if (filtros.destinatarioId) {
    where.destinatarioId = filtros.destinatarioId;
  }

  if (filtros.tipo) {
    where.tipo = filtros.tipo;
  }

  if (filtros.leida !== undefined) {
    where.leida = filtros.leida;
  }

  if (filtros.prioridad) {
    where.prioridad = filtros.prioridad;
  }

  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.creadaEn = {};
    if (filtros.fechaDesde) {
      where.creadaEn.gte = filtros.fechaDesde;
    }
    if (filtros.fechaHasta) {
      where.creadaEn.lte = filtros.fechaHasta;
    }
  }

  // Consultas en paralelo para optimizar rendimiento
  const [notificaciones, total, noLeidas] = await Promise.all([
    prisma.notificacion.findMany({
      where,
      orderBy: { creadaEn: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notificacion.count({ where }),
    prisma.notificacion.count({
      where: { ...where, leida: false },
    }),
  ]);

  return {
    data: notificaciones as any[],
    total,
    noLeidas,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Marca una notificación como leída
 */
export const marcarComoLeida = async (
  notificacionId: number,
  usuarioId: number
): Promise<any> => {
  // Verificar que la notificación pertenece al usuario
  const notificacion = await prisma.notificacion.findUnique({
    where: { id: notificacionId },
  });

  if (!notificacion) {
    throw new Error('Notificación no encontrada');
  }

  if (notificacion.destinatarioId !== usuarioId) {
    throw new Error('No tienes permisos para marcar esta notificación');
  }

  return await prisma.notificacion.update({
    where: { id: notificacionId },
    data: { leida: true },
  });
};

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export const marcarTodasComoLeidas = async (
  destinatarioId: number
): Promise<number> => {
  const result = await prisma.notificacion.updateMany({
    where: {
      destinatarioId,
      leida: false,
    },
    data: { leida: true },
  });

  return result.count;
};

/**
 * Elimina una notificación
 */
export const eliminarNotificacion = async (
  notificacionId: number,
  usuarioId: number
): Promise<void> => {
  // Verificar que la notificación pertenece al usuario
  const notificacion = await prisma.notificacion.findUnique({
    where: { id: notificacionId },
  });

  if (!notificacion) {
    throw new Error('Notificación no encontrada');
  }

  if (notificacion.destinatarioId !== usuarioId) {
    throw new Error('No tienes permisos para eliminar esta notificación');
  }

  await prisma.notificacion.delete({
    where: { id: notificacionId },
  });
};

/**
 * Notifica a todos los directores sobre un evento
 * Útil para notificar a todos los directores simultáneamente
 */
export const notificarATodosLosDirectores = async (
  tipo: TipoNotificacion,
  titulo: string,
  mensaje: string,
  prioridad: PrioridadNotificacion,
  data: Record<string, any>
): Promise<number> => {
  try {
    // Obtener todos los directores
    const directores = await prisma.director.findMany({
      select: { id: true },
    });

    if (directores.length === 0) {
      console.warn('No hay directores para notificar');
      return 0;
    }

    // Crear notificaciones para todos los directores en paralelo
    const promesas = directores.map(director =>
      crearNotificacion({
        tipo,
        titulo,
        mensaje,
        prioridad,
        destinatarioId: director.id,
        destinatarioRol: 'DIRECTOR',
        data,
      })
    );

    await Promise.all(promesas);

    return directores.length;
  } catch (error) {
    console.error('Error al notificar a directores:', error);
    throw error;
  }
};

/**
 * Obtiene el conteo de notificaciones no leídas de un usuario
 */
export const obtenerConteoNoLeidas = async (
  destinatarioId: number
): Promise<number> => {
  return await prisma.notificacion.count({
    where: {
      destinatarioId,
      leida: false,
    },
  });
};
