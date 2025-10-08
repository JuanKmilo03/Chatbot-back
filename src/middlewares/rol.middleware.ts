import { Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';
import { AuthRequest } from './auth.middleware.js';

export const verificarRol = (rolesPermitidos: Rol[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};