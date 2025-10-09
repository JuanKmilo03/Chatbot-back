import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase.config.js";
import { PrismaClient, Rol } from "@prisma/client";

const prisma = new PrismaClient();

export const authFirebase = async (req: Request, res: Response, next: NextFunction) => {
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

    // 🔥 obtiene el nombre real de la cuenta Google
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const nombre = userRecord.displayName || "Sin nombre";

    let usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre,
          email,
          password: "",
          rol: "ESTUDIANTE" as Rol,
        },
      });

      await prisma.estudiante.create({
        data: { usuarioId: usuario.id },
      });
    }

    (req as any).user = usuario;
    next();
  } catch (error) {
    console.error("Error en authFirebase:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};
