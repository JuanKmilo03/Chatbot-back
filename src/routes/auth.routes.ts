import { Router } from "express";
import { login, refreshSession, registrarUsuario } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", registrarUsuario);

/**
 * @swagger
 * /auth/refresh:
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

export default router;
