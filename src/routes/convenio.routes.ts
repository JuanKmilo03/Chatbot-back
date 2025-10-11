import { Router } from "express";
import {
  crearConvenio,
  listarConvenios,
  obtenerConvenioPorId,
  actualizarConvenio,
  eliminarConvenio,
  listarConveniosPorDirector,
  listarConveniosVigentes,
} from "../controllers/convenio.controller.js";

import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Convenios
 *   description: Gestión de convenios entre empresas y directores
 */

/**
 * @swagger
 * /api/convenios:
 *   post:
 *     summary: Crear un nuevo convenio
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - empresaId
 *               - directorId
 *             properties:
 *               nombre:
 *                 type: string
 *               empresaId:
 *                 type: integer
 *               directorId:
 *                 type: integer
 *               estado:
 *                 type: string
 *                 enum: [ACTIVO, INACTIVO]
 *               archivoUrl:
 *                 type: string
 *             example:
 *               nombre: Convenio Energía Solar
 *               empresaId: 2
 *               directorId: 1
 *               estado: ACTIVO
 *     responses:
 *       201:
 *         description: Convenio creado correctamente
 *       400:
 *         description: Datos incompletos o inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post("/", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), crearConvenio);

/**
 * @swagger
 * /api/convenios:
 *   get:
 *     summary: Listar todos los convenios
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de convenios obtenida correctamente
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Rol no autorizado
 */
router.get("/", verifyToken, authorizeRoles("ADMIN", "DIRECTOR", "EMPRESA"), listarConvenios);

/**
 * @swagger
 * /api/convenios/{id}:
 *   get:
 *     summary: Obtener un convenio por su ID
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del convenio
 *     responses:
 *       200:
 *         description: Convenio encontrado
 *       404:
 *         description: Convenio no encontrado
 */
router.get("/:id", verifyToken, authorizeRoles("ADMIN", "DIRECTOR", "EMPRESA"), obtenerConvenioPorId);

/**
 * @swagger
 * /api/convenios/{id}:
 *   put:
 *     summary: Actualizar un convenio existente
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del convenio a actualizar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               estado:
 *                 type: string
 *               archivoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Convenio actualizado correctamente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Convenio no encontrado
 */
router.put("/:id", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), actualizarConvenio);

/**
 * @swagger
 * /api/convenios/{id}:
 *   delete:
 *     summary: Eliminar un convenio
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del convenio a eliminar
 *     responses:
 *       200:
 *         description: Convenio eliminado correctamente
 *       404:
 *         description: Convenio no encontrado
 */
router.delete("/:id", verifyToken, authorizeRoles("ADMIN"), eliminarConvenio);

/**
 * @swagger
 * /api/convenios/director/{directorId}:
 *   get:
 *     summary: Listar convenios de un director específico
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: directorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del director
 *     responses:
 *       200:
 *         description: Lista de convenios del director
 *       404:
 *         description: No hay convenios para este director
 */
router.get("/director/:directorId", verifyToken, authorizeRoles("DIRECTOR"), listarConveniosPorDirector);

/**
 * @swagger
 * /api/convenios/vigentes/mios:
 *   get:
 *     summary: Listar convenios vigentes del director autenticado
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de convenios vigentes
 *       403:
 *         description: El usuario no tiene rol DIRECTOR
 */
router.get("/vigentes/mios", verifyToken, authorizeRoles("DIRECTOR"), listarConveniosVigentes);

export default router;

