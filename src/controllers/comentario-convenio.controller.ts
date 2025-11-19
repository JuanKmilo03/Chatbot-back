/**
 * Controlador para gestionar comentarios en convenios
 */

import { Request, Response } from 'express';
import {
  crearComentario,
  obtenerComentariosPorConvenio,
  actualizarComentario,
  eliminarComentario,
} from '../services/comentario-convenio.service.js';
import {
  CrearComentarioDTO,
  ActualizarComentarioDTO,
  ObtenerComentariosQuery,
} from '../types/comentario-convenio.types.js';

/**
 * POST /api/convenios/:convenioId/comentarios
 * Crear un nuevo comentario en un convenio
 */
export const crearComentarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const convenioId = parseInt(req.params.convenioId);
    const { contenido } = req.body;
    const usuario = (req as any).user; // CORREGIDO: usar 'user' en lugar de 'usuario'

    if (!contenido || contenido.trim() === '') {
      res.status(400).json({ error: 'El contenido del comentario es requerido' });
      return;
    }

    if (!usuario) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Determinar el rol y el ID según el usuario autenticado
    let autorId: number;
    let autorRol: 'EMPRESA' | 'DIRECTOR';

    if (usuario.rol === 'EMPRESA') {
      // Obtener el ID de la empresa asociada al usuario
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const empresa = await prisma.empresa.findUnique({
        where: { usuarioId: usuario.id },
      });
      if (!empresa) {
        res.status(403).json({ error: 'No se encontró empresa asociada' });
        return;
      }
      autorId = empresa.id;
      autorRol = 'EMPRESA';
    } else if (usuario.rol === 'DIRECTOR') {
      // Obtener el ID del director asociado al usuario
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const director = await prisma.director.findUnique({
        where: { usuarioId: usuario.id },
      });
      if (!director) {
        res.status(403).json({ error: 'No se encontró director asociado' });
        return;
      }
      autorId = director.id;
      autorRol = 'DIRECTOR';
    } else {
      res.status(403).json({ error: 'Solo empresas y directores pueden comentar' });
      return;
    }

    const dto: CrearComentarioDTO = {
      convenioId,
      autorId,
      autorRol,
      contenido: contenido.trim(),
    };

    const comentario = await crearComentario(dto);
    res.status(201).json(comentario);
  } catch (error: any) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: error.message || 'Error al crear comentario' });
  }
};

/**
 * GET /api/convenios/:convenioId/comentarios
 * Obtener todos los comentarios de un convenio
 */
export const obtenerComentariosController = async (req: Request, res: Response): Promise<void> => {
  try {
    const convenioId = parseInt(req.params.convenioId);
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const ordenar = (req.query.ordenar as 'ASC' | 'DESC') || 'ASC';

    const query: ObtenerComentariosQuery = {
      page,
      limit,
      ordenar,
    };

    const resultado = await obtenerComentariosPorConvenio(convenioId, query);
    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: error.message || 'Error al obtener comentarios' });
  }
};

/**
 * PATCH /api/convenios/:convenioId/comentarios/:comentarioId
 * Actualizar un comentario
 */
export const actualizarComentarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const comentarioId = parseInt(req.params.comentarioId);
    const { contenido } = req.body;
    const usuario = (req as any).user; // CORREGIDO: usar 'user' en lugar de 'usuario'

    if (!contenido || contenido.trim() === '') {
      res.status(400).json({ error: 'El contenido del comentario es requerido' });
      return;
    }

    if (!usuario) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Determinar el ID del autor según el rol
    let autorId: number;
    if (usuario.rol === 'EMPRESA') {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const empresa = await prisma.empresa.findUnique({
        where: { usuarioId: usuario.id },
      });
      if (!empresa) {
        res.status(403).json({ error: 'No se encontró empresa asociada' });
        return;
      }
      autorId = empresa.id;
    } else if (usuario.rol === 'DIRECTOR') {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const director = await prisma.director.findUnique({
        where: { usuarioId: usuario.id },
      });
      if (!director) {
        res.status(403).json({ error: 'No se encontró director asociado' });
        return;
      }
      autorId = director.id;
    } else {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    const dto: ActualizarComentarioDTO = {
      contenido: contenido.trim(),
    };

    const comentario = await actualizarComentario(comentarioId, autorId, dto);
    res.status(200).json(comentario);
  } catch (error: any) {
    console.error('Error al actualizar comentario:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar comentario' });
  }
};

/**
 * DELETE /api/convenios/:convenioId/comentarios/:comentarioId
 * Eliminar un comentario
 */
export const eliminarComentarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const comentarioId = parseInt(req.params.comentarioId);
    const usuario = (req as any).user; // CORREGIDO: usar 'user' en lugar de 'usuario'

    if (!usuario) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Determinar el ID del autor según el rol
    let autorId: number;
    if (usuario.rol === 'EMPRESA') {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const empresa = await prisma.empresa.findUnique({
        where: { usuarioId: usuario.id },
      });
      if (!empresa) {
        res.status(403).json({ error: 'No se encontró empresa asociada' });
        return;
      }
      autorId = empresa.id;
    } else if (usuario.rol === 'DIRECTOR') {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const director = await prisma.director.findUnique({
        where: { usuarioId: usuario.id },
      });
      if (!director) {
        res.status(403).json({ error: 'No se encontró director asociado' });
        return;
      }
      autorId = director.id;
    } else {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    await eliminarComentario(comentarioId, autorId);
    res.status(200).json({ message: 'Comentario eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar comentario' });
  }
};
