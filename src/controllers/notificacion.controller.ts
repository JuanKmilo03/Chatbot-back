/**
 * Controlador de notificaciones
 * Maneja las peticiones HTTP relacionadas con notificaciones
 */

import { Request, Response } from 'express';
import {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  obtenerConteoNoLeidas,
} from '../services/notificacion.service.js';
import { verificarConveniosProximosAVencer } from '../services/convenio-vencimiento.service.js';
import { FiltrosNotificacion, TipoNotificacion, PrioridadNotificacion } from '../types/notificacion.types.js';

/**
 * Interfaz extendida del Request para incluir el usuario autenticado
 */
interface AuthRequest extends Request {
  user?: {
    id: number;
    rol: string;
  };
}

/**
 * GET /api/notificaciones
 * Obtiene las notificaciones del usuario autenticado con filtros opcionales
 */
export const obtenerMisNotificaciones = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Obtener filtros desde query params
    const filtros: FiltrosNotificacion = {
      destinatarioId: usuarioId,
      tipo: req.query.tipo as TipoNotificacion | undefined,
      leida: req.query.leida === 'true' ? true : req.query.leida === 'false' ? false : undefined,
      prioridad: req.query.prioridad as PrioridadNotificacion | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const resultado = await obtenerNotificaciones(filtros);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({
      message: 'Error al obtener notificaciones',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * GET /api/notificaciones/no-leidas/conteo
 * Obtiene el conteo de notificaciones no leídas del usuario
 */
export const obtenerConteoNotificacionesNoLeidas = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const conteo = await obtenerConteoNoLeidas(usuarioId);

    return res.status(200).json({ noLeidas: conteo });
  } catch (error) {
    console.error('Error al obtener conteo de notificaciones:', error);
    return res.status(500).json({
      message: 'Error al obtener conteo',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * PATCH /api/notificaciones/:id/leer
 * Marca una notificación como leída
 */
export const marcarNotificacionComoLeida = async (req: AuthRequest, res: Response) => {
  try {
    const notificacionId = parseInt(req.params.id);
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (isNaN(notificacionId)) {
      return res.status(400).json({ message: 'ID de notificación inválido' });
    }

    const notificacion = await marcarComoLeida(notificacionId, usuarioId);

    return res.status(200).json({
      message: 'Notificación marcada como leída',
      data: notificacion,
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);

    if (error instanceof Error && error.message.includes('No tienes permisos')) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof Error && error.message.includes('no encontrada')) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({
      message: 'Error al marcar notificación como leída',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * PATCH /api/notificaciones/leer-todas
 * Marca todas las notificaciones del usuario como leídas
 */
export const marcarTodasNotificacionesComoLeidas = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const cantidadActualizada = await marcarTodasComoLeidas(usuarioId);

    return res.status(200).json({
      message: 'Todas las notificaciones marcadas como leídas',
      cantidadActualizada,
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return res.status(500).json({
      message: 'Error al marcar todas las notificaciones como leídas',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * DELETE /api/notificaciones/:id
 * Elimina una notificación
 */
export const eliminarNotificacionController = async (req: AuthRequest, res: Response) => {
  try {
    const notificacionId = parseInt(req.params.id);
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (isNaN(notificacionId)) {
      return res.status(400).json({ message: 'ID de notificación inválido' });
    }

    await eliminarNotificacion(notificacionId, usuarioId);

    return res.status(200).json({
      message: 'Notificación eliminada correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);

    if (error instanceof Error && error.message.includes('No tienes permisos')) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof Error && error.message.includes('no encontrada')) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({
      message: 'Error al eliminar notificación',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * POST /api/notificaciones/verificar-convenios (Solo DIRECTOR/ADMIN)
 * Ejecuta manualmente la verificación de convenios próximos a vencer
 */
export const ejecutarVerificacionConvenios = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioRol = req.user?.rol;

    // Solo directores y admins pueden ejecutar esta verificación manualmente
    if (usuarioRol !== 'DIRECTOR' && usuarioRol !== 'ADMIN') {
      return res.status(403).json({
        message: 'No tienes permisos para ejecutar esta acción',
      });
    }

    const resultado = await verificarConveniosProximosAVencer();

    return res.status(200).json({
      message: 'Verificación de convenios ejecutada correctamente',
      resultado,
    });
  } catch (error) {
    console.error('Error al ejecutar verificación de convenios:', error);
    return res.status(500).json({
      message: 'Error al ejecutar verificación de convenios',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
