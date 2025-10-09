import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";

const router = Router();

// Rutas de autenticación
router.post("/login", login);
router.post("/register", register);

export default router;
