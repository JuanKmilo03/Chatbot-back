import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

//  para incluir user
export interface AuthRequest extends Request {
  user?: {
    id: number;
    rol: Rol;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_aqui') as {
      id: number;
      rol: Rol;
    };

    // Agregar usuario al request
    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};