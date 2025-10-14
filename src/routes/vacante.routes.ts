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
 * /api/vacantes/{id}:
 *   get:
 *     summary: Obtiene una vacante por su ID
 *     tags: [Vacantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante a obtener
 *     responses:
 *       200:
 *         description: Vacante encontrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 titulo:
 *                   type: string
 *                   example: Desarrollador Backend
 *                 descripcion:
 *                   type: string
 *                   example: Desarrollo de servicios en Node.js
 *                 area:
 *                   type: string
 *                   example: Tecnología
 *                 requisitos:
 *                   type: string
 *                   example: Experiencia en Express y Prisma
 *                 estado:
 *                   type: string
 *                   example: PENDIENTE
 *                 creadaEn:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-10-12T21:00:00.000Z
 *                 empresa:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Empresa XYZ
 *                 directorValida:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     nombre:
 *                       type: string
 *                       example: Juan Pérez
 *                 practicas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       titulo:
 *                         type: string
 *                         example: Práctica en Desarrollo Web
 *       404:
 *         description: Vacante no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vacante no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", vacanteController.getVacanteById);

/**
 * @swagger
 * /api/vacantes/{id}/aprobar:
 *   patch:
 *     summary: Aprueba una vacante pendiente (solo director)
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []   # Indica que requiere token JWT
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante a aprobar
 *     responses:
 *       200:
 *         description: Vacante aprobada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vacante aprobada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Vacante'  # Suponiendo que tienes schema de Vacante
 *       400:
 *         description: ID inválido o vacante no pendiente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Usuario no autorizado (no es director)
 *       404:
 *         description: Vacante o director no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/aprobar', verifyToken, authorizeRoles('DIRECTOR'), vacanteController.aprobarVacante);

/**
 * @swagger
 * /api/vacantes/{id}/rechazar:
 *   patch:
 *     summary: Rechaza una vacante pendiente (solo director)
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []   # Requiere token JWT
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante a rechazar
 *     responses:
 *       200:
 *         description: Vacante rechazada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vacante rechazada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Vacante'
 *       400:
 *         description: ID inválido o vacante no pendiente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Usuario no autorizado (no es director)
 *       404:
 *         description: Vacante o director no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/rechazar', verifyToken, authorizeRoles('DIRECTOR'),vacanteController.rechazarVacante);

export default router;