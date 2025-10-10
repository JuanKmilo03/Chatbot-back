import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { Rol } from '@prisma/client';

export const register = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol, nit, nombreEmpresa, habilidades, perfil } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: nombre, email, password, rol'
      });
    }

    // Validar que el rol sea válido
    if (!Object.values(Rol).includes(rol)) {
      return res.status(400).json({
        message: 'Rol inválido. Debe ser: EMPRESA, DIRECTOR o ESTUDIANTE'
      });
    }

    // Validaciones específicas por rol
    if (rol === Rol.EMPRESA && (!nit || !nombreEmpresa)) {
      return res.status(400).json({
        message: 'Para registrar una empresa, se requiere: nit y nombreEmpresa'
      });
    }

    const usuario = await authService.register({
      nombre,
      email,
      password,
      rol,
      nit,
      nombreEmpresa,
      habilidades,
      perfil
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      data: usuario
    });
  } catch (error: any) {
    console.error('Error al registrar usuario:', error);

    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({
        message: error.message
      });
    }

    if (
      error.message.includes('se requiere') ||
      error.message === 'Rol no válido'
    ) {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Error al registrar el usuario',
      error: error.message
    });
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