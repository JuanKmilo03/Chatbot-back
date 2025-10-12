import { Router } from "express";
import { login, registrarUsuario } from "../controllers/auth.controller.js";

const router = Router();

// Rutas de autenticación
router.post("/login", login);
router.post("/register", registrarUsuario);

export default router;
