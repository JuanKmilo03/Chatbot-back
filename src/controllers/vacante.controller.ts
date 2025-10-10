import { Request, Response } from 'express';
import * as vacanteService from '../services/vacante.service.js';

export const crearVacante = async (req: Request, res: Response) => {
  try {
    const { empresaId, titulo, descripcion, area, requisitos } = req.body;

    // Validar campos obligatorios
    if (!empresaId || !titulo || !descripcion || !area) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: empresaId, titulo, descripcion, area'
      });
    }

    // Validar que empresaId sea un número
    if (isNaN(Number(empresaId))) {
      return res.status(400).json({
        message: 'El empresaId debe ser un número válido'
      });
    }

    const vacante = await vacanteService.crearVacante({
      empresaId: Number(empresaId),
      titulo,
      descripcion,
      area,
      requisitos
    });

    return res.status(201).json({
      message: 'Vacante creada correctamente',
      data: vacante
    });
  } catch (error: any) {
    console.error('Error al crear vacante:', error);
    
    if (error.message === 'Empresa no encontrada') {
      return res.status(404).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Error al crear la vacante',
      error: error.message
    });
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

export const aprobarVacante = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { directorId } = req.body;

    // Validar que el ID de la vacante sea válido
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        message: 'ID de vacante inválido'
      });
    }

    // Validar que se proporcione el directorId
    if (!directorId || isNaN(Number(directorId))) {
      return res.status(400).json({
        message: 'El directorId es obligatorio y debe ser un número válido'
      });
    }

    const vacanteAprobada = await vacanteService.aprobarVacante(
      Number(id),
      Number(directorId)
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
      return res.status(404).json({
        message: error.message
      });
    }

    if (error.message.includes('Solo se pueden aprobar')) {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Error al aprobar la vacante',
      error: error.message
    });
  }
};

export const rechazarVacante = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { directorId } = req.body;

    // Validar que el ID de la vacante sea válido
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        message: 'ID de vacante inválido'
      });
    }

    // Validar que se proporcione el directorId
    if (!directorId || isNaN(Number(directorId))) {
      return res.status(400).json({
        message: 'El directorId es obligatorio y debe ser un número válido'
      });
    }

    const vacanteRechazada = await vacanteService.rechazarVacante(
      Number(id),
      Number(directorId)
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
      return res.status(404).json({
        message: error.message
      });
    }

    if (error.message.includes('Solo se pueden rechazar')) {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Error al rechazar la vacante',
      error: error.message
    });
  }
};