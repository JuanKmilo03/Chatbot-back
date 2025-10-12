import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    const result = await authService.register(nombre, email, password, rol);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: error.message || "Error interno del servidor" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

