import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { Rol } from '@prisma/client';

export const registrarUsuario = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol, habilidades, perfil } = req.body;

    // Validar campos básicos
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Verificar que el rol sea válido
    if (![Rol.DIRECTOR, Rol.ESTUDIANTE].includes(rol)) {
      return res.status(400).json({ error: "Rol no válido. Solo DIRECTOR o ESTUDIANTE" });
    }

    // Registrar usuario según su rol
    const usuario = await authService.register({
      nombre,
      email,
      password,
      rol,
      habilidades,
      perfil
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      usuario
    });
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar campos obligatorios
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email y password son obligatorios'
      });
    }

    const usuario = await authService.login(email, password);

    return res.status(200).json({
      message: 'Login exitoso',
      data: usuario
    });
  } catch (error: any) {
    console.error('Error al hacer login:', error);

    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

