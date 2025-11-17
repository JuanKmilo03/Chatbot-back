import { Router } from "express";
import { cambiarContrasenia, login, refreshSession } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y autorización de usuarios
 */

router.post("/login", login);

/**
 * @swagger
 * /api/auth/refresh:
 *   get:
 *     summary: Refresca la sesión del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión validada correctamente
 */
router.get("/refresh", verifyToken, refreshSession);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Cambia la contraseña del usuario autenticado
 *     description: Cambia la contraseña del usuario autenticado. Solo se puede cambiar la contraseña si tiene la contraseña actual.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual del usuario
 *                 example: 123456789
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña del usuario
 *                 example: 123456789
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contraseña actualizada correctamente
 *       400:
 *         description: Faltan campos obligatorios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Faltan campos obligatorios
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token de Firebase inválido
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error interno del servidor
 */
router.patch("/change-password", verifyToken, cambiarContrasenia )

export default router;
