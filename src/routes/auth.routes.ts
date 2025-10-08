import { Router } from "express";
import { login } from "../controllers/auth.controller.js";

const router = Router();

// Ruta para inicio de sesión
router.post("/login", login);

export default router;
