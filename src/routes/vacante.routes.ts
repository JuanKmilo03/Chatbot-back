import { Router } from 'express';
import * as vacanteController from '../controllers/vacante.controller.js';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Vacantes
 *   description: Gestión de vacantes creadas por empresas y validadas por directores
 */

/**
 * @swagger
 * /api/vacantes/crear:
 *   post:
 *     summary: Crea una nueva vacante (empresa)
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *               - area
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Desarrollador Backend
 *               descripcion:
 *                 type: string
 *                 example: Desarrollo de servicios en Node.js con Prisma y PostgreSQL.
 *               area:
 *                 type: string
 *                 example: Tecnología
 *               requisitos:
 *                 type: string
 *                 example: Experiencia en Express y JWT.
 *     responses:
 *       201:
 *         description: Vacante creada correctamente
 *       400:
 *         description: Datos inválidos o incompletos
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Empresa no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/crear', verifyToken, authorizeRoles('EMPRESA'), vacanteController.crearVacante);


/**
 * @swagger
 * /api/vacantes/pendientes:
 *   get:
 *     summary: Lista todas las vacantes pendientes (director)
 *     tags: [Vacantes]
 *     responses:
 *       200:
 *         description: Lista de vacantes pendientes
 *       500:
 *         description: Error interno del servidor
 */
router.get('/pendientes', vacanteController.listarVacantesPendientes);

/**
 * @swagger
 * /api/vacantes/aprobadas:
 *   get:
 *     summary: Lista todas las vacantes aprobadas (director)
 *     tags: [Vacantes]
 *     responses:
 *       200:
 *         description: Lista de vacantes aprobadas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/aprobadas', vacanteController.listarVacantesAprobadas);

/**
 * @swagger
 * /api/vacantes/{id}/aprobar:
 *   patch:
 *     summary: Aprueba una vacante pendiente (director)
 *     tags: [Vacantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - directorId
 *             properties:
 *               directorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Vacante aprobada correctamente
 *       400:
 *         description: ID inválido o datos faltantes
 *       404:
 *         description: Vacante o director no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/aprobar', vacanteController.aprobarVacante);

/**
 * @swagger
 * /api/vacantes/{id}/rechazar:
 *   patch:
 *     summary: Rechaza una vacante pendiente (director)
 *     tags: [Vacantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - directorId
 *             properties:
 *               directorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Vacante rechazada correctamente
 *       400:
 *         description: ID inválido o datos faltantes
 *       404:
 *         description: Vacante o director no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/rechazar', vacanteController.rechazarVacante);

export default router;