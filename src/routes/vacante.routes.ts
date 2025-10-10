import { Router } from 'express';
import * as vacanteController from '../controllers/vacante.controller.js';

const router = Router();

/**
 * POST /api/vacantes/crear
 * Crea una nueva vacante (empresa)
 * Body: { empresaId, titulo, descripcion, area, requisitos? }
 */
router.post('/crear', vacanteController.crearVacante);

/**
 * GET /api/vacantes/pendientes
 * Lista todas las vacantes pendientes (director)
 */
router.get('/pendientes', vacanteController.listarVacantesPendientes);

/**
 * PATCH /api/vacantes/:id/aprobar
 * Aprueba una vacante pendiente (director)
 * Body: { directorId }
 */
router.patch('/:id/aprobar', vacanteController.aprobarVacante);

/**
 * PATCH /api/vacantes/:id/rechazar
 * Rechaza una vacante pendiente (director)
 * Body: { directorId }
 */
router.patch('/:id/rechazar', vacanteController.rechazarVacante);

export default router;