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

router.post('/registrar', verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), vacanteController.registrarVacante);


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
router.patch('/:id/aprobar', verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), vacanteController.aprobarVacante);

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
router.patch('/:id/rechazar', verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), vacanteController.rechazarVacante);

/**
 * @swagger
 * /api/vacantes/{id}/solicitar-eliminacion:
 *   post:
 *     summary: Solicitar la eliminación de una vacante
 *     description: La empresa solicita que un director elimine una vacante.
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante a eliminar
 *     responses:
 *       200:
 *         description: Solicitud de eliminación enviada correctamente
 *       400:
 *         description: Error o permisos insuficientes
 */
router.post("/:id/solicitar-eliminacion", verifyToken, authorizeRoles("EMPRESA"), vacanteController.solicitarEliminacionVacante);


/**
 * @swagger
 * /api/vacantes/{id}:
 *   delete:
 *     summary: Eliminar una vacante de forma definitiva
 *     description: Elimina completamente una vacante de la base de datos. Solo permitido para DIRECTOR o ADMIN.
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante
 *     responses:
 *       200:
 *         description: Vacante eliminada permanentemente
 *       403:
 *         description: No autorizado
 */
router.delete("/:id", verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), vacanteController.eliminarVacanteDefinitiva);

/**
 * @swagger
 * /api/vacantes/{id}/editar:
 *   put:
 *     summary: Editar una vacante (solo ADMIN o DIRECTOR)
 *     description: Permite actualizar los datos de una vacante. Solo ADMIN y DIRECTOR pueden modificar empresa o estado.
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante a editar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Desarrollador Backend Senior
 *               descripcion:
 *                 type: string
 *                 example: Desarrollo y mantenimiento de microservicios con Node.js
 *               area:
 *                 type: string
 *                 example: Tecnología
 *               requisitos:
 *                 type: string
 *                 example: Experiencia con Prisma, PostgreSQL, y JWT.
 *               estado:
 *                 type: string
 *                 enum: [PENDIENTE, APROBADA, RECHAZADA, INACTIVA]
 *               empresaId:
 *                 type: integer
 *                 example: 3
 *               directorValidaId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Vacante actualizada correctamente
 *       400:
 *         description: Error o datos inválidos
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: Usuario no autorizado
 *       404:
 *         description: Vacante o entidad no encontrada
 */
router.put("/:id/editar", verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), vacanteController.actualizarVacanteAdminDirector);

/**
 * @swagger
 * /api/vacantes/{id}/activar:
 *   patch:
 *     summary: Activa una vacante inactiva
 *     description: Cambia el estado de una vacante a ACTIVA. Puede ser usada tanto por empresas, directores o administradores.
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante a activar
 *     responses:
 *       200:
 *         description: Vacante activada correctamente
 *       400:
 *         description: Error o vacante ya activa
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: Usuario no autorizado
 *       404:
 *         description: Vacante no encontrada
 */
router.patch("/:id/activar", verifyToken, authorizeRoles("ADMIN", "DIRECTOR", "EMPRESA"), vacanteController.activarVacante);

/**
 * @swagger
 * /api/vacantes/{id}/inactivar:
 *   patch:
 *     summary: Inactiva una vacante activa
 *     description: Cambia el estado de una vacante a INACTIVA (soft delete). Puede ser usada por empresas, directores o administradores.
 *     tags: [Vacantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la vacante a inactivar
 *     responses:
 *       200:
 *         description: Vacante inactivada correctamente
 *       400:
 *         description: Error o vacante ya inactiva
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: Usuario no autorizado
 *       404:
 *         description: Vacante no encontrada
 */
router.patch("/:id/inactivar", verifyToken, authorizeRoles("ADMIN", "DIRECTOR", "EMPRESA"), vacanteController.inactivarVacante);

export default router;