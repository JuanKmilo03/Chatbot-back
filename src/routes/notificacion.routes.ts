/**
 * Rutas de notificaciones
 * Define los endpoints para gestionar notificaciones
 */

import { Router } from 'express';
import {
  obtenerMisNotificaciones,
  obtenerConteoNotificacionesNoLeidas,
  marcarNotificacionComoLeida,
  marcarTodasNotificacionesComoLeidas,
  eliminarNotificacionController,
  ejecutarVerificacionConvenios,
} from '../controllers/notificacion.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Sistema de notificaciones en tiempo real con WebSocket
 */

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     summary: Obtiene las notificaciones del usuario autenticado
 *     description: Retorna las notificaciones con filtros opcionales y paginación
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [CONVENIO_PROXIMO_VENCER, CONVENIO_VENCIDO, NUEVA_SOLICITUD_VACANTE, VACANTE_APROBADA, VACANTE_RECHAZADA]
 *         description: Filtrar por tipo de notificación
 *       - in: query
 *         name: leida
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de lectura
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, URGENTE]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de notificaciones por página
 *     responses:
 *       200:
 *         description: Notificaciones obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tipo:
 *                         type: string
 *                       titulo:
 *                         type: string
 *                       mensaje:
 *                         type: string
 *                       prioridad:
 *                         type: string
 *                       leida:
 *                         type: boolean
 *                       data:
 *                         type: object
 *                       creadaEn:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 noLeidas:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/', verifyToken, obtenerMisNotificaciones);

/**
 * @swagger
 * /api/notificaciones/no-leidas/conteo:
 *   get:
 *     summary: Obtiene el conteo de notificaciones no leídas
 *     description: Retorna el número de notificaciones no leídas del usuario
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 noLeidas:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: No autorizado
 */
router.get('/no-leidas/conteo', verifyToken, obtenerConteoNotificacionesNoLeidas);

/**
 * @swagger
 * /api/notificaciones/{id}/leer:
 *   patch:
 *     summary: Marca una notificación como leída
 *     description: Actualiza el estado de una notificación a leída
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para modificar esta notificación
 *       404:
 *         description: Notificación no encontrada
 */
router.patch('/:id/leer', verifyToken, marcarNotificacionComoLeida);

/**
 * @swagger
 * /api/notificaciones/leer-todas:
 *   patch:
 *     summary: Marca todas las notificaciones como leídas
 *     description: Actualiza todas las notificaciones del usuario a leídas
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las notificaciones marcadas como leídas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cantidadActualizada:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */
router.patch('/leer-todas', verifyToken, marcarTodasNotificacionesComoLeidas);

/**
 * @swagger
 * /api/notificaciones/{id}:
 *   delete:
 *     summary: Elimina una notificación
 *     description: Elimina permanentemente una notificación del usuario
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación eliminada correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para eliminar esta notificación
 *       404:
 *         description: Notificación no encontrada
 */
router.delete('/:id', verifyToken, eliminarNotificacionController);

/**
 * @swagger
 * /api/notificaciones/verificar-convenios:
 *   post:
 *     summary: Ejecuta manualmente la verificación de convenios próximos a vencer
 *     description: Solo directores y administradores pueden ejecutar esta acción manualmente
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verificación ejecutada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 resultado:
 *                   type: object
 *                   properties:
 *                     verificados:
 *                       type: integer
 *                     notificados:
 *                       type: integer
 *                     vencidos:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para ejecutar esta acción
 */
router.post(
  '/verificar-convenios',
  verifyToken,
  authorizeRoles('DIRECTOR', 'ADMIN'),
  ejecutarVerificacionConvenios
);

export default router;
