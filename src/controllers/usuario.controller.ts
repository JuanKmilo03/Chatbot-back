import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const UsuarioController = {
  crear: async (req: Request, res: Response) => {
    try {
      const { nombre, email, password, rol } = req.body;

      if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      const usuario = await prisma.usuario.create({
        data: { nombre, email, password, rol },
      });

      res.status(201).json(usuario);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  },

  listar: async (_req: Request, res: Response) => {
    try {
      const usuarios = await prisma.usuario.findMany();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar usuarios' });
    }
  },
};
