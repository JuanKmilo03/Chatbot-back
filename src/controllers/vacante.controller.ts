import { Request, Response } from 'express';
import * as vacanteService from '../services/vacante.service.js';
import * as empresaService from "../services/empresa.service.js";

import { AuthRequest } from '../middlewares/auth.middleware.js';
import { EstadoGeneral } from '@prisma/client';

export const crearVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, descripcion, area, requisitos } = req.body;

    // Validar campos obligatorios
    if (!titulo || !descripcion || !area) {
      return res.status(400).json({
        message: "Faltan campos obligatorios: titulo, descripcion, area",
      });
    }

    // Buscar empresa asociada al usuario autenticado
    const empresa = await empresaService.obtenerEmpresaPorUsuarioId(req.user!.id);
    if (!empresa) {
      return res.status(404).json({
        message: "Empresa no encontrada para el usuario autenticado",
      });
    }

    // Crear la vacante
    const vacante = await vacanteService.crearVacante({
      empresaId: empresa.id,
      titulo,
      descripcion,
      area,
      requisitos,
    });

    return res.status(201).json({
      message: "Vacante creada correctamente",
      data: vacante,
    });
  } catch (error: any) {
    console.error("Error al crear vacante:", error);

    return res.status(500).json({
      message: "Error al crear la vacante",
      error: error.message,
    });
  }
};

export const registrarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, descripcion, area, requisitos, empresaId } = req.body;

    if (!titulo || !descripcion || !area || !empresaId) {
      return res.status(400).json({ message: "Faltan campos obligatorios: titulo, descripcion, area, empresaId" });
    }

    const vacante = await vacanteService.crearVacanteAprobada({
      titulo,
      descripcion,
      area,
      requisitos,
      empresaId,
      directorId: req.user!.id
    });

    return res.status(201).json({
      message: "Vacante creada y aprobada correctamente",
      data: vacante
    });
  } catch (error: any) {
    console.error("Error al crear vacante aprobada:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getVacanteById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const vacante = await vacanteService.getVacanteByIdService(Number(id));

    if (!vacante) {
      return res.status(404).json({ message: "Vacante no encontrada" });
    }

    return res.json({ data: vacante });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la vacante" });
  }
};

export const listarVacantesPendientes = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, titulo, empresa, estado, modalidad } = req.query;
    const filters = {
      titulo: req.query.titulo ? String(req.query.titulo) : undefined,
      empresa: req.query.empresa ? String(req.query.empresa) : undefined,
      modalidad: req.query.modalidad ? String(req.query.modalidad) : undefined,
    };

    const { data, total } = await vacanteService.listarVacantesPendientes({
      page: Number(page),
      limit: Number(limit),
      filters
    });

    return res.status(200).json({
      message: 'Vacantes pendientes obtenidas correctamente',
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    console.error('Error al listar vacantes pendientes:', error);
    return res.status(500).json({
      message: 'Error al obtener las vacantes pendientes',
      error: error.message
    });
  }
};

export const listarVacantesAprobadas = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, titulo, empresa, estado, modalidad } = req.query;
    const filters = {
      titulo: req.query.titulo ? String(req.query.titulo) : undefined,
      empresa: req.query.empresa ? String(req.query.empresa) : undefined,
      estado: req.query.estado
        ? (req.query.estado.toString().toUpperCase() as EstadoGeneral)
        : undefined,
      area: req.query.area ? String(req.query.area) : undefined,
    };
    const { data, total } = await vacanteService.listarVacantesAprobadas({
      page: Number(page),
      limit: Number(limit),
      filters
    });

    return res.status(200).json({
      message: 'Vacantes aprobadas obtenidas correctamente',
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    console.error('Error al listar vacantes aprobadas:', error);
    return res.status(500).json({
      message: 'Error al obtener las vacantes aprobadas',
      error: error.message
    });
  }
};

export const aprobarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validar que el ID de la vacante sea válido
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: 'ID de vacante inválido' });
    }

    const vacanteAprobada = await vacanteService.aprobarVacante(
      Number(id),
      req.user!.id
    );

    return res.status(200).json({
      message: 'Vacante aprobada correctamente',
      data: vacanteAprobada
    });
  } catch (error: any) {
    console.error('Error al aprobar vacante:', error);

    if (
      error.message === 'Vacante no encontrada' ||
      error.message === 'Director no encontrado'
    ) {
      return res.status(404).json({ message: error.message });
    }

    if (error.message.includes('Solo se pueden aprobar')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Error al aprobar la vacante', error: error.message });
  }
};

export const rechazarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: 'ID de vacante inválido' });
    }

    const vacanteRechazada = await vacanteService.rechazarVacante(
      Number(id),
      req.user!.id
    );

    return res.status(200).json({
      message: 'Vacante rechazada correctamente',
      data: vacanteRechazada
    });

  } catch (error: any) {
    console.error('Error al rechazar vacante:', error);

    if (
      error.message === 'Vacante no encontrada' ||
      error.message === 'Director no encontrado'
    ) {
      return res.status(404).json({ message: error.message });
    }

    if (error.message.includes('Solo se pueden rechazar')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Error al rechazar la vacante', error: error.message });
  }
};


export const solicitarEliminacionVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const empresa = await empresaService.obtenerEmpresaPorUsuarioId(req.user!.id);

    if (!empresa)
      return res.status(404).json({ message: "Empresa no encontrada para el usuario autenticado." });

    const resultado = await vacanteService.solicitarEliminacionVacante(Number(id), empresa.id);

    return res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Error al solicitar eliminación:", error);
    return res.status(400).json({ message: error.message });
  }
};


export const eliminarVacanteDefinitiva = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user!.rol !== "DIRECTOR" && req.user!.rol !== "ADMIN") {
      return res.status(403).json({ message: "No tienes permisos para eliminar vacantes." });
    }

    const resultado = await vacanteService.eliminarVacanteDefinitiva(Number(id));
    return res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Error al eliminar vacante:", error);
    return res.status(400).json({ message: error.message });
  }
};


export const inactivarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const empresa = await empresaService.obtenerEmpresaPorUsuarioId(req.user!.id);

    if (!empresa)
      return res.status(404).json({ message: "Empresa no encontrada para el usuario autenticado." });

    const vacanteInactiva = await vacanteService.inactivarVacante(Number(id), empresa.id);

    return res.status(200).json({
      message: "Vacante marcada como inactiva correctamente.",
      data: vacanteInactiva,
    });
  } catch (error: any) {
    console.error("Error al inactivar vacante:", error);
    return res.status(400).json({ message: error.message });
  }
};
