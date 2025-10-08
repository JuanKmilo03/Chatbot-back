import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";

const prisma = new PrismaClient();

export class AuthService {
  async login(email: string, password: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        director: true,
        estudiante: true,
        empresa: true,
      },
    });

    if (!usuario) return null;

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) return null;

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      env.JWT_SECRET || "supersecret",
      { expiresIn: "8h" }
    );

    // Elimina el password antes de enviar
    const { password: _, ...usuarioSinPassword } = usuario;

    return {
      token,
      usuario: usuarioSinPassword,
    };
  }
}
