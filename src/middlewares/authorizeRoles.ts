import { Request, Response, NextFunction } from "express";
import { Rol } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user?: { rol: Rol };
}

export const authorizeRole = (rolesPermitidos: Rol[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: "Acceso denegado: rol no autorizado" });
    }

    next();
  };
};
