import { Request, Response } from "express";
import { PrismaClient, Rol } from "@prisma/client";
import admin from "../config/firebase.config.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";

const prisma = new PrismaClient();

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Token de Google requerido" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    if (!email) {
      return res.status(400).json({ message: "Correo no detectado" });
    }

    if (!email.endsWith("@ufps.edu.co")) {
      return res.status(403).json({ message: "Debe usar un correo institucional UFPS" });
    }

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
          nombre: decoded.name || "Usuario UFPS",
          email,
          password: "",
          rol,
        }
      });

      if (rol === Rol.ESTUDIANTE) {
        await prisma.estudiante.create({
          data: {
            usuarioId: usuario.id,
          },
        });
      }
    } else

      if (rol === Rol.DIRECTOR) {
      

      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          rol,
        }
      });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      usuario,
      token,
    });
  } catch (error: any) {
    console.error("Error en login con Google:", error);
    res.status(500).json({ message: "Error al autenticar con Google" });
  }
};
