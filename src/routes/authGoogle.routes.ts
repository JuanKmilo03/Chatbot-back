import express from "express";
import { authFirebase } from "../middlewares/authFirebase.js";

const router = express.Router();

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
