import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const DirectorController = {
  crear: async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req.body;

      if (!usuarioId) {
        return res.status(400).json({ error: 'El usuarioId es obligatorio' });
      }

      // Validar que el usuario exista y tenga rol DIRECTOR
      const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
      if (!usuario || usuario.rol !== 'DIRECTOR') {
        return res.status(400).json({ error: 'El usuario no es válido o no tiene rol DIRECTOR' });
      }

      const director = await prisma.director.create({
        data: { usuarioId },
      });

      res.status(201).json(director);
    } catch (error) {
      console.error('Error al crear director:', error);
      res.status(500).json({ error: 'Error al crear director' });
    }
  },

  listar: async (_req: Request, res: Response) => {
    try {
      const directores = await prisma.director.findMany({
        include: { usuario: true },
      });
      res.json(directores);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar directores' });
    }
  },
};
