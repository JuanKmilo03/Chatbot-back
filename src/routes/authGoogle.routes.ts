import express, { Request, Response } from "express";
import { authFirebase } from "../middlewares/authFirebase.js";
import { Usuario } from "@prisma/client";

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: Usuario;
}

/**
 * @swagger
 * tags:
 *   name: Auth Google
 *   description: Autenticación y autorización con Firebase/Google
 */

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token de Firebase
 *     description: Valida un token de Firebase y retorna la información del usuario autenticado
 *     tags: [Auth Google]
 *     security:
 *       - firebaseAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token válido
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Juan Pérez
 *                     email:
 *                       type: string
 *                       example: juan.perez@example.com
 *                     rol:
 *                       type: string
 *                       enum: [ADMIN, DIRECTOR, ESTUDIANTE, EMPRESA]
 *                       example: ESTUDIANTE
 *                     creadoEn:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *                     actualizadoEn:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *       401:
 *         description: Token inválido o usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               noAutenticado:
 *                 value:
 *                   message: Usuario no autenticado
 *               tokenInvalido:
 *                 value:
 *                   message: Token de Firebase inválido
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
router.get("/verify", authFirebase, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    res.status(200).json({
      message: "Token válido",
      usuario: req.user,
    });
  } catch (error) {
    console.error("Error en /auth/verify:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/**
 * @swagger
 * /api/auth/admin/dashboard:
 *   get:
 *     summary: Acceso al dashboard de administrador
 *     description: Endpoint protegido que solo pueden acceder usuarios con rol ADMIN
 *     tags: [Auth Google]
 *     security:
 *       - firebaseAuth: []
 *     responses:
 *       200:
 *         description: Acceso concedido al panel de administración
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenido al panel de administración
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Admin Principal
 *                     email:
 *                       type: string
 *                       example: admin@sistema.com
 *                     rol:
 *                       type: string
 *                       example: ADMIN
 *                     creadoEn:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
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
 *       403:
 *         description: Acceso denegado - No tiene rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Acceso denegado, solo administradores
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
router.get("/admin/dashboard", authFirebase, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.rol !== "ADMIN") {
      return res.status(403).json({ message: "Acceso denegado: solo administradores" });
    }

    res.status(200).json({
      message: "Bienvenido al panel de administración",
      usuario: req.user,
    });
  } catch (error) {
    console.error("Error en /auth/admin/dashboard:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/**
 * @swagger
 * /api/auth/director/dashboard:
 *   get:
 *     summary: Acceso al dashboard de director
 *     description: Endpoint protegido que solo pueden acceder usuarios con rol DIRECTOR
 *     tags: [Auth Google]
 *     security:
 *       - firebaseAuth: []
 *     responses:
 *       200:
 *         description: Acceso concedido al panel de director
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenido al panel de director
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     nombre:
 *                       type: string
 *                       example: María García
 *                     email:
 *                       type: string
 *                       example: maria.garcia@universidad.edu
 *                     rol:
 *                       type: string
 *                       example: DIRECTOR
 *                     creadoEn:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
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
 *       403:
 *         description: Acceso denegado - No tiene rol de director
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Acceso denegado, solo directores
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
router.get("/director/dashboard", authFirebase, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.rol !== "DIRECTOR") {
      return res.status(403).json({ message: "Acceso denegado: solo directores" });
    }

    res.status(200).json({
      message: "Bienvenido al panel de director",
      usuario: req.user,
    });
  } catch (error) {
    console.error("Error en /auth/director/dashboard:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     firebaseAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Token de Firebase obtenido desde el cliente (Google Sign-In)
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del usuario
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *           example: Juan Pérez
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: juan.perez@example.com
 *         rol:
 *           type: string
 *           enum: [ADMIN, DIRECTOR, ESTUDIANTE, EMPRESA]
 *           description: Rol del usuario en el sistema
 *           example: ESTUDIANTE
 *         creadoEn:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *           example: "2025-10-12T10:30:00.000Z"
 *         actualizadoEn:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2025-10-12T10:30:00.000Z"
 *     Rol:
 *       type: string
 *       enum:
 *         - ADMIN
 *         - DIRECTOR
 *         - ESTUDIANTE
 *         - EMPRESA
 *       description: Roles disponibles en el sistema
 */

export default router;