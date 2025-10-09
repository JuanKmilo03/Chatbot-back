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
