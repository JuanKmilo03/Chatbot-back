import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase.config.js";
import { PrismaClient, Usuario, Rol } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: Usuario;
}
export const authFirebase = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    const email = decodedToken.email;
    if (!email || !email.endsWith("@ufps.edu.co")) {
      return res.status(403).json({ message: "Acceso restringido: solo correos institucionales" });
    }

    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const nombre = userRecord.displayName || "Sin nombre";

    let rol: Rol = Rol.ESTUDIANTE;

    if (email === "admingeneral@ufps.edu.co") {
      rol = Rol.ADMIN;
    } else {
      const director = await prisma.director.findFirst({
        where: { usuario: { email } },
      });
      if (director) {
        rol = Rol.DIRECTOR;
      }
    }

    let usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre,
          email,
          password: "",
          rol,
        },
      });

      if (rol === Rol.ESTUDIANTE) {
        await prisma.estudiante.create({
          data: {
            usuarioId: usuario.id,
          },
        });
      }
    } else if (usuario.rol !== rol) {
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { rol },
      });
    }

    req.user = usuario;
    next();
  } catch (error) {
    console.error("Error en authFirebase:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};
