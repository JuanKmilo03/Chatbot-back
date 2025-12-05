import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const crearDirector = async (req: Request, res: Response) => {
  try {
    const { usuarioId, programaId, Facultad } = req.body;

    if (!usuarioId || !programaId) {
      return res.status(400).json({ message: "usuarioId y programaId son obligatorios" });
    }

    const nuevoDirector = await prisma.director.create({
      data: {
        usuarioId: Number(usuarioId),
        programaId: Number(programaId),
        Facultad: Facultad || null,
      },
      include: {
        usuario: true,
        programa: true,
      },
    });

    res.status(201).json({
      message: "Director creado exitosamente",
      data: nuevoDirector,
    });
  } catch (error) {
    console.error("Error al crear director:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const listarDirectores = async (req: Request, res: Response) => {
  try {
    const directores = await prisma.director.findMany({
      include: {
        usuario: true,
        programa: true,
      },
    });

    res.status(200).json(directores);
  } catch (error) {
    console.error("Error al listar directores:", error);
    res.status(500).json({ message: "Error al obtener los directores" });
  }
};
