import express, { Request, Response } from "express";
import { authFirebase } from "../middlewares/authFirebase.js";
import { AuthService } from "../services/auth.service.js";
import { Usuario } from "@prisma/client";

const router = express.Router();
const authService = new AuthService();

interface AuthenticatedRequest extends Request {
  user?: Usuario;
}

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

export default router;
