import { Router } from 'express';
import * as postulacionController from '../controllers/postulacion.controller.js';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Postulaciones
 *   description: Gestión de postulaciones de estudiantes a vacantes de prácticas
 */

/**
 * @swagger
 * /api/postulaciones/crear:
 *   post:
 *     summary: Crea una nueva postulación a una vacante (estudiante)
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vacanteId
 *             properties:
 *               vacanteId:
 *                 type: integer
 *                 example: 1
 *               comentario:
 *                 type: string
 *                 example: Tengo experiencia en desarrollo backend y me interesa esta oportunidad.
 *     responses:
 *       201:
 *         description: Postulación creada correctamente
 *       400:
 *         description: Datos inválidos o ya existe una postulación activa
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Estudiante o vacante no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/crear',
  verifyToken,
  authorizeRoles('ESTUDIANTE'),
  postulacionController.crearPostulacion
);

/**
 * @swagger
 * /api/postulaciones/mis-postulaciones:
 *   get:
 *     summary: Obtiene todas las postulaciones del estudiante autenticado
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [EN_REVISION, ACEPTADA, RECHAZADA, CANCELADA]
 *         description: Filtrar por estado de la postulación
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
 *           default: 10
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Postulaciones obtenidas correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Estudiante no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/mis-postulaciones',
  verifyToken,
  authorizeRoles('ESTUDIANTE'),
  postulacionController.obtenerMisPostulaciones
);

/**
 * @swagger
 * /api/postulaciones/vacante/{vacanteId}:
 *   get:
 *     summary: Obtiene todas las postulaciones de una vacante específica
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vacanteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [EN_REVISION, ACEPTADA, RECHAZADA, CANCELADA]
 *         description: Filtrar por estado de la postulación
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
 *           default: 10
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Postulaciones obtenidas correctamente
 *       400:
 *         description: ID de vacante inválido
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/vacante/:vacanteId',
  verifyToken,
  authorizeRoles('EMPRESA', 'DIRECTOR', 'ADMIN'),
  postulacionController.obtenerPostulacionesPorVacante
);

/**
 * @swagger
 * /api/postulaciones/empresa:
 *   get:
 *     summary: Obtiene todas las postulaciones de las vacantes de la empresa autenticada
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [EN_REVISION, ACEPTADA, RECHAZADA, CANCELADA]
 *         description: Filtrar por estado de la postulación
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
 *           default: 10
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Postulaciones obtenidas correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Empresa no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/empresa',
  verifyToken,
  authorizeRoles('EMPRESA'),
  postulacionController.obtenerPostulacionesEmpresa
);

/**
 * @swagger
 * /api/postulaciones/{id}:
 *   get:
 *     summary: Obtiene una postulación específica por su ID
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la postulación
 *     responses:
 *       200:
 *         description: Postulación obtenida correctamente
 *       400:
 *         description: ID de postulación inválido
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Postulación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('ESTUDIANTE', 'EMPRESA', 'DIRECTOR', 'ADMIN'),
  postulacionController.obtenerPostulacionPorId
);

/**
 * @swagger
 * /api/postulaciones/{id}/estado:
 *   patch:
 *     summary: Actualiza el estado de una postulación (empresa o director)
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la postulación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [EN_REVISION, ACEPTADA, RECHAZADA, CANCELADA]
 *                 example: ACEPTADA
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Postulación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
  '/:id/estado',
  verifyToken,
  authorizeRoles('EMPRESA', 'DIRECTOR', 'ADMIN'),
  postulacionController.actualizarEstadoPostulacion
);

/**
 * @swagger
 * /api/postulaciones/{id}/cancelar:
 *   patch:
 *     summary: Cancela una postulación (solo estudiante)
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la postulación a cancelar
 *     responses:
 *       200:
 *         description: Postulación cancelada correctamente
 *       400:
 *         description: ID inválido o no se puede cancelar
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Postulación no encontrada o sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
  '/:id/cancelar',
  verifyToken,
  authorizeRoles('ESTUDIANTE'),
  postulacionController.cancelarPostulacion
);

export default router;
