import { Request, Response } from 'express';
import * as vacanteService from '../services/vacante.service.js';
import * as empresaService from "../services/empresa.service";

import { AuthRequest } from '../middlewares/auth.middleware.js';

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

export const getVacanteById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const vacante = await vacanteService.getVacanteByIdService(Number(id));

        if (!vacante) {
            return res.status(404).json({ message: "Vacante no encontrada" });
        }

        return res.json({data:vacante});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener la vacante" });
    }
};

export const listarVacantesPendientes = async (req: Request, res: Response) => {
  try {
    const vacantes = await vacanteService.listarVacantesPendientes();

    return res.status(200).json({
      message: 'Vacantes pendientes obtenidas correctamente',
      data: vacantes,
      total: vacantes.length
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
    const vacantes = await vacanteService.listarVacantesAprobadas();

    return res.status(200).json({
      message: 'Vacantes aprobadas obtenidas correctamente',
      data: vacantes,
      total: vacantes.length
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