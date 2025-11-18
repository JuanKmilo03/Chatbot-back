import { Response } from 'express';
import * as postulacionService from '../services/postulacion.service.js';
import * as empresaService from '../services/empresa.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { EstadoPostulacion } from '@prisma/client';
import { FiltrosPostulacion } from '../types/postulacion.types.js';
import { EstudianteService } from '../services/estudiante.service.js';

// Constantes para códigos de estado HTTP
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Mensajes de éxito
const SUCCESS_MESSAGES = {
  POSTULACION_CREADA: 'Postulación creada correctamente.',
  POSTULACIONES_OBTENIDAS: 'Postulaciones obtenidas correctamente.',
  POSTULACION_OBTENIDA: 'Postulación obtenida correctamente.',
  ESTADO_ACTUALIZADO: 'Estado de la postulación actualizado correctamente.',
  POSTULACION_CANCELADA: 'Postulación cancelada correctamente.',
} as const;

// Mensajes de error
const ERROR_MESSAGES = {
  VACANTE_ID_REQUERIDO: 'El ID de la vacante es obligatorio.',
  VACANTE_ID_INVALIDO: 'ID de vacante inválido.',
  POSTULACION_ID_INVALIDO: 'ID de postulación inválido.',
  ESTADO_INVALIDO: 'Estado inválido.',
  ESTUDIANTE_NO_ENCONTRADO: 'Estudiante no encontrado para el usuario autenticado.',
  EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada para el usuario autenticado.',
  ERROR_CREAR_POSTULACION: 'Error al crear la postulación.',
  ERROR_OBTENER_POSTULACIONES: 'Error al obtener las postulaciones.',
  ERROR_OBTENER_POSTULACION: 'Error al obtener la postulación.',
  ERROR_ACTUALIZAR_ESTADO: 'Error al actualizar el estado de la postulación.',
  ERROR_CANCELAR_POSTULACION: 'Error al cancelar la postulación.',
} as const;

/**
 * Extrae y valida filtros de la query
 */
const extraerFiltros = (query: any): FiltrosPostulacion => ({
  estado: query.estado as EstadoPostulacion | undefined,
  page: query.page ? Number(query.page) : undefined,
  limit: query.limit ? Number(query.limit) : undefined,
});

/**
 * Valida que un ID numérico sea válido
 */
const validarIdNumerico = (id: string | undefined, nombreCampo: string): number => {
  if (!id || isNaN(Number(id))) {
    throw new Error(`${nombreCampo} inválido.`);
  }
  return Number(id);
};

/**
 * Maneja errores comunes y envía respuesta apropiada
 */
const manejarError = (res: Response, error: any, mensajeGenerico: string) => {
  console.error(`${mensajeGenerico}:`, error);

  const erroresNotFound = [
    'no encontrado',
    'no encontrada',
  ];

  const erroresBadRequest = [
    'Solo se puede',
    'Ya has aplicado',
    'No tienes permiso',
    'obligatorio',
  ];

  const mensaje = error.message || mensajeGenerico;

  // Determinar código de estado según el mensaje de error
  if (erroresNotFound.some(e => mensaje.toLowerCase().includes(e))) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: mensaje });
  }

  if (erroresBadRequest.some(e => mensaje.includes(e))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: mensaje });
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: mensajeGenerico,
    error: mensaje,
  });
};

/**
 * Obtiene el estudiante asociado al usuario autenticado
 */
const obtenerEstudianteAutenticado = async (usuarioId: number) => {
  const [estudiante] = await EstudianteService.findMany({ usuarioId });

  if (!estudiante) {
    throw new Error(ERROR_MESSAGES.ESTUDIANTE_NO_ENCONTRADO);
  }

  return estudiante;
};

/**
 * Obtiene la empresa asociada al usuario autenticado
 */
const obtenerEmpresaAutenticada = async (usuarioId: number) => {
  const empresa = await empresaService.obtenerEmpresaPorUsuarioId(usuarioId);

  if (!empresa) {
    throw new Error(ERROR_MESSAGES.EMPRESA_NO_ENCONTRADA);
  }

  return empresa;
};

/**
 * Crear una nueva postulación (estudiante aplica a una vacante)
 */
export const crearPostulacion = async (req: AuthRequest, res: Response) => {
  try {
    const { vacanteId, comentario } = req.body;
    const usuarioId = req.user!.id;

    if (!vacanteId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: ERROR_MESSAGES.VACANTE_ID_REQUERIDO,
      });
    }

    const estudiante = await obtenerEstudianteAutenticado(usuarioId);

    const postulacion = await postulacionService.crearPostulacion({
      estudianteId: estudiante.id,
      vacanteId: Number(vacanteId),
      comentario,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.POSTULACION_CREADA,
      data: postulacion,
    });
  } catch (error: any) {
    return manejarError(res, error, ERROR_MESSAGES.ERROR_CREAR_POSTULACION);
  }
};

/**
 * Obtener todas las postulaciones del estudiante autenticado
 */
export const obtenerMisPostulaciones = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user!.id;
    const filtros = extraerFiltros(req.query);

    const estudiante = await obtenerEstudianteAutenticado(usuarioId);

    const resultado = await postulacionService.obtenerPostulacionesPorEstudiante(
      estudiante.id,
      filtros
    );

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.POSTULACIONES_OBTENIDAS,
      ...resultado,
    });
  } catch (error: any) {
    return manejarError(res, error, ERROR_MESSAGES.ERROR_OBTENER_POSTULACIONES);
  }
};

/**
 * Obtener postulaciones de una vacante específica (para empresas)
 */
export const obtenerPostulacionesPorVacante = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const vacanteId = validarIdNumerico(req.params.vacanteId, 'ID de vacante');
    const filtros = extraerFiltros(req.query);

    const resultado = await postulacionService.obtenerPostulacionesPorVacante(
      vacanteId,
      filtros
    );

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.POSTULACIONES_OBTENIDAS,
      ...resultado,
    });
  } catch (error: any) {
    return manejarError(res, error, ERROR_MESSAGES.ERROR_OBTENER_POSTULACIONES);
  }
};

/**
 * Obtener todas las postulaciones de las vacantes de la empresa autenticada
 */
export const obtenerPostulacionesEmpresa = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const usuarioId = req.user!.id;
    const filtros = extraerFiltros(req.query);

    const empresa = await obtenerEmpresaAutenticada(usuarioId);

    const resultado = await postulacionService.obtenerPostulacionesPorEmpresa(
      empresa.id,
      filtros
    );

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.POSTULACIONES_OBTENIDAS,
      ...resultado,
    });
  } catch (error: any) {
    return manejarError(res, error, ERROR_MESSAGES.ERROR_OBTENER_POSTULACIONES);
  }
};

/**
 * Obtener una postulación específica por ID
 */
export const obtenerPostulacionPorId = async (req: AuthRequest, res: Response) => {
  try {
    const postulacionId = validarIdNumerico(req.params.id, 'ID de postulación');

    const postulacion = await postulacionService.obtenerPostulacionPorId(postulacionId);

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.POSTULACION_OBTENIDA,
      data: postulacion,
    });
  } catch (error: any) {
    return manejarError(res, error, ERROR_MESSAGES.ERROR_OBTENER_POSTULACION);
  }
};

/**
 * Actualizar el estado de una postulación (para empresas o directores)
 */
export const actualizarEstadoPostulacion = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const postulacionId = validarIdNumerico(req.params.id, 'ID de postulación');
    const { estado } = req.body;

    if (!estado || !Object.values(EstadoPostulacion).includes(estado)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: ERROR_MESSAGES.ESTADO_INVALIDO
      });
    }

    const postulacion = await postulacionService.actualizarEstadoPostulacion(
      postulacionId,
      estado as EstadoPostulacion
    );

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.ESTADO_ACTUALIZADO,
      data: postulacion,
    });
  } catch (error: any) {
    return manejarError(res, error, ERROR_MESSAGES.ERROR_ACTUALIZAR_ESTADO);
  }
};

/**
 * Cancelar una postulación (solo para estudiantes)
 */
export const cancelarPostulacion = async (req: AuthRequest, res: Response) => {
  try {
    const postulacionId = validarIdNumerico(req.params.id, 'ID de postulación');
    const usuarioId = req.user!.id;

    const estudiante = await obtenerEstudianteAutenticado(usuarioId);

    const postulacion = await postulacionService.cancelarPostulacion(
      postulacionId,
      estudiante.id
    );

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.POSTULACION_CANCELADA,
      data: postulacion,
    });
  } catch (error: any) {
    return manejarError(res, error, ERROR_MESSAGES.ERROR_CANCELAR_POSTULACION);
  }
};
