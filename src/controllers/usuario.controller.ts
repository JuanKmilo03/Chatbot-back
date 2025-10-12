import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const UsuarioController = {
  listar: async (_req: Request, res: Response) => {
    try {
      const usuarios = await prisma.usuario.findMany();
      res.json(usuarios);
    } catch {
      res.status(500).json({ error: "Error al listar usuarios" });
    }
  },
};
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

export const obtenerPerfilUsuario = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = req.user;

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const usuarioEnBD = await prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    if (!usuarioEnBD) {
      return res.status(404).json({ message: "Usuario no encontrado en la base de datos" });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    return res.status(200).json({
      message: "Perfil obtenido correctamente",
      usuario: usuarioEnBD,
      token, //esto se podria quitar
    });
  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    return res.status(500).json({ message: "Error al obtener el perfil del usuario" });
  }
};