import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";

const prisma = new PrismaClient();

export class AuthService {
  async register(nombre: string, email: string, password: string, rol: string) {
    // Verificar si ya existe el usuario
    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("El usuario ya existe");
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol.toUpperCase() as any,
      },
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) return null;

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return null;

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token };
  }
}
