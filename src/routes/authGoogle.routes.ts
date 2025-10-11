import express from "express";
import { authFirebase } from "../middlewares/authFirebase.js";

const router = express.Router();

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Inicio de sesión con Google
 *     description: |
 *       Permite a los usuarios iniciar sesión con su cuenta de Google **institucional (UFPS)**.  
 *       Verifica el `idToken` de Firebase, valida el dominio, crea el usuario si no existe,  
 *       y devuelve un token JWT para autenticación interna.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Token de autenticación de Google obtenido en el frontend.
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU..."
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Inicio de sesión exitoso
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
 *                       example: juan.perez@ufps.edu.co
 *                     rol:
 *                       type: string
 *                       example: ESTUDIANTE
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI..."
 *       400:
 *         description: Token de Google requerido o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token de Google requerido
 *       403:
 *         description: Correo no pertenece al dominio UFPS
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Debe usar un correo institucional UFPS
 *       500:
 *         description: Error interno al autenticar con Google
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error al autenticar con Google
 */

router.post("/google", authFirebase, async (req, res) => {
  try {
    const usuario = (req as any).user;
    res.status(200).json({
      message: "Inicio de sesión exitoso con Google",
      usuario,
    });
  } catch (error) {
    console.error("Error en /auth/google:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
