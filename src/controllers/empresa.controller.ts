import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const EmpresaController = {
  crear: async (req: Request, res: Response) => {
    try {
      const { usuarioId, nombre, nit } = req.body;

      if (!usuarioId || !nombre || !nit) {
        return res.status(400).json({ error: 'usuarioId, nombre y nit son obligatorios' });
      }

      const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
      if (!usuario || usuario.rol !== 'EMPRESA') {
        return res.status(400).json({ error: 'El usuario no es válido o no tiene rol EMPRESA' });
      }

      const empresa = await prisma.empresa.create({
        data: { usuarioId, nombre, nit },
      });

      res.status(201).json(empresa);
    } catch (error) {
      console.error('Error al crear empresa:', error);
      res.status(500).json({ error: 'Error al crear empresa' });
    }
  },

  listar: async (_req: Request, res: Response) => {
    try {
      const empresas = await prisma.empresa.findMany({
        include: { usuario: true },
      });
      res.json(empresas);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar empresas' });
    }
  },
};
