import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { PrismaClient, EstadoConvenio } from '@prisma/client';


const prisma = new PrismaClient();

export const crearConvenio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, empresaId, directorId, estado, archivoUrl } = req.body;

    if (!nombre || !empresaId || !directorId) {
      res.status(400).json({ error: 'Los campos nombre, empresaId y directorId son obligatorios' });
      return;
    }

    const nuevoConvenio = await prisma.convenio.create({
      data: {
        nombre,
        empresaId: Number(empresaId),
        directorId: Number(directorId),
        estado: estado && estado in EstadoConvenio ? estado : EstadoConvenio.ACTIVO,
        archivoUrl: archivoUrl || null,
      },
      include: {
        empresa: true,
        director: true,
      },
    });

    res.status(201).json(nuevoConvenio);
  } catch (error) {
    console.error('Error al crear convenio:', error);
    res.status(500).json({ error: 'Error al crear el convenio' });
  }
};

export const listarConvenios = async (req: Request, res: Response): Promise<void> => {
  try {
    const convenios = await prisma.convenio.findMany({
      include: {
        empresa: true,
        director: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    res.json(convenios);
  } catch (error) {
    console.error('Error al listar convenios:', error);
    res.status(500).json({ error: 'Error al listar convenios' });
  }
};

export const obtenerConvenioPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const convenio = await prisma.convenio.findUnique({
      where: { id: Number(id) },
      include: {
        empresa: true,
        director: true,
      },
    });

    if (!convenio) {
      res.status(404).json({ error: 'Convenio no encontrado' });
      return;
    }

    res.json(convenio);
  } catch (error) {
    console.error('Error al obtener convenio:', error);
    res.status(500).json({ error: 'Error al obtener convenio' });
  }
};

export const actualizarConvenio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, estado, archivoUrl } = req.body;

    if (!id) {
      return res.status(400).json({ error: "El ID del convenio es obligatorio" });
    }

    const convenioExistente = await prisma.convenio.findUnique({
      where: { id: Number(id) },
    });

    if (!convenioExistente) {
      return res.status(404).json({ error: "Convenio no encontrado" });
    }

    const convenioActualizado = await prisma.convenio.update({
      where: { id: Number(id) },
      data: {
        nombre: nombre || convenioExistente.nombre,
        estado: estado || convenioExistente.estado,
        archivoUrl: archivoUrl || convenioExistente.archivoUrl,
      },
    });

    res.status(200).json({
      mensaje: "Convenio actualizado correctamente",
      convenio: convenioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar convenio:", error);
    res.status(500).json({ error: "Error al actualizar convenio" });
  }
};

export const eliminarConvenio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.convenio.delete({
      where: { id: Number(id) },
    });

    res.json({ mensaje: 'Convenio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar convenio:', error);
    res.status(500).json({ error: 'Error al eliminar convenio' });
  }
};

export const listarConveniosPorDirector = async (req: Request, res: Response) => {
  try {
    const { directorId } = req.params;

    if (!directorId) {
      return res.status(400).json({ error: "El directorId es obligatorio" });
    }

    const convenios = await prisma.convenio.findMany({
      where: { directorId: Number(directorId) },
      include: {
        empresa: {
          select: { nombre: true, nit: true },
        },
      },
      orderBy: { actualizadoEn: "desc" },
    });

    if (convenios.length === 0) {
      return res.status(404).json({ mensaje: "No hay convenios registrados para este director" });
    }

    const conveniosLocal = convenios.map(c => ({
      ...c,
      actualizadoEn: new Date(c.actualizadoEn).toLocaleString("es-CO", {
        timeZone: "America/Bogota",
      }),
    }));

    res.status(200).json(conveniosLocal);
  } catch (error) {
    console.error("Error al listar convenios:", error);
    res.status(500).json({ error: "Error al obtener convenios" });
  }
};


export const listarConveniosVigentes = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const director = await prisma.director.findUnique({
      where: { usuarioId },
    });

    if (!director) {
      return res.status(403).json({ error: 'El usuario no tiene rol DIRECTOR' });
    }

    const convenios = await prisma.convenio.findMany({
      where: {
        directorId: director.id,
        estado: 'ACTIVO', 
      },
      include: {
        empresa: { select: { id: true, nombre: true, nit: true } },
      },
      orderBy: { actualizadoEn: 'desc' },
    });

    res.status(200).json({ total: convenios.length, convenios });

  } catch (error) {
    console.error('Error al listar convenios vigentes:', error);
    res.status(500).json({ error: 'Error al obtener convenios vigentes' });
  }
};


// sin auth pa probar


export const listarConveniosVigentes2 = async (req: Request, res: Response) => {
  try {
    const { directorId } = req.query;

    if (!directorId) {
      return res.status(400).json({ error: 'El directorId es obligatorio' });
    }

    const convenios = await prisma.convenio.findMany({
      where: {
        directorId: Number(directorId),
        estado: 'ACTIVO',
      },
      include: {
        empresa: { select: { id: true, nombre: true, nit: true } },
      },
      orderBy: { actualizadoEn: 'desc' },
    });

    res.status(200).json({ total: convenios.length, convenios });

  } catch (error) {
    console.error('Error al listar convenios vigentes:', error);
    res.status(500).json({ error: 'Error al obtener convenios vigentes' });
  }
};