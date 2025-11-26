import { Request, Response } from 'express';
import * as empresaService from "../services/empresa.service.js";

import { AuthRequest } from '../middlewares/auth.middleware.js';
import { EstadoGeneral, Prisma } from '@prisma/client';
import { vacanteService } from '../services/vacante.service.js';
import { prisma } from '../config/db.js';
import { crearNotificacion } from '../services/notificacion.service.js';
import { PrioridadNotificacion, TipoNotificacion } from '../types/notificacion.types.js';

export const crearVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, descripcion, area, modalidad, habilidadesBlandas, habilidadesTecnicas, convenioId } = req.body;

    if (!titulo || !descripcion || !area || !modalidad)
      return res.status(400).json({ message: "Faltan campos obligatorios: titulo, descripcion, area o modalidad" });

    const empresa = await empresaService.obtenerEmpresaPorUsuarioId(req.user!.id);
    if (!empresa) return res.status(404).json({ message: "Empresa no encontrada" });

    // Validar convenio si viene
    let convenioConnect: any = undefined;
    if (convenioId) {
      const convenio = await prisma.convenio.findUnique({ where: { id: Number(convenioId) } });
      if (!convenio) return res.status(404).json({ message: "Convenio no encontrado." });
      convenioConnect = { connect: { id: Number(convenioId) } };
    }

    const vacante = await vacanteService.create({
      titulo,
      descripcion,
      area,
      modalidad,
      habilidadesBlandas: Array.isArray(habilidadesBlandas) ? habilidadesBlandas : [],
      habilidadesTecnicas: Array.isArray(habilidadesTecnicas) ? habilidadesTecnicas : [],
      empresa: { connect: { id: empresa.id } },
      ...(convenioConnect && { convenio: convenioConnect }),
    });

    return res.status(201).json({ message: "Vacante creada correctamente", data: vacante });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear la vacante", error: error.message });
  }
};

export const registrarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, descripcion, area, modalidad, habilidadesBlandas, habilidadesTecnicas, empresaId, convenioId } = req.body;

    if (!titulo || !descripcion || !area || !empresaId || !modalidad)
      return res.status(400).json({ message: "Faltan campos obligatorios: titulo, descripcion, area, empresaId o modalidad" });

    const empresa = await empresaService.obtenerEmpresaPorUsuarioId(empresaId);
    if (!empresa) return res.status(404).json({ message: "Empresa no encontrada." });

    const directorId = req.user!.id;

    let convenioConnect: any = undefined;
    if (convenioId) {
      const convenio = await prisma.convenio.findUnique({ where: { id: Number(convenioId) } });
      if (!convenio) return res.status(404).json({ message: "Convenio no encontrado." });
      convenioConnect = { connect: { id: Number(convenioId) } };
    }

    const vacante = await vacanteService.create({
      titulo,
      descripcion,
      area,
      modalidad,
      habilidadesBlandas: Array.isArray(habilidadesBlandas) ? habilidadesBlandas : [],
      habilidadesTecnicas: Array.isArray(habilidadesTecnicas) ? habilidadesTecnicas : [],
      estado: EstadoGeneral.APROBADA,
      empresa: { connect: { id: empresaId } },
      directorValida: { connect: { id: directorId } },
      ...(convenioConnect && { convenio: convenioConnect }),
    });

    await crearNotificacion({
      tipo: TipoNotificacion.VACANTE_APROBADA,
      titulo: "Vacante creada y aprobada",
      mensaje: `Tu vacante "${vacante.titulo}" ha sido creada y aprobada por el director.`,
      prioridad: PrioridadNotificacion.ALTA,
      destinatarioId: empresa.usuarioId,
      destinatarioRol: "EMPRESA",
      data: { vacanteId: vacante.id }
    });

    return res.status(201).json({ message: "Vacante creada y aprobada correctamente", data: vacante });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear vacante aprobada", error: error.message });
  }
};

export const getVacanteById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const vacante = await vacanteService.getAll({ id });
    if (!vacante || vacante.length === 0) return res.status(404).json({ message: "Vacante no encontrada" });

    return res.json({ data: vacante[0] });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la vacante", error: error.message });
  }
};

const construirFiltroVacantes = (query: any) => {
  const where: any = {};

  if (query.titulo) {
    where.titulo = {
      contains: query.titulo,
      mode: "insensitive"
    };
  }

  if (query.empresa) {
    where.empresa = {
      nombre: {
        contains: query.empresa,
        mode: "insensitive"
      }
    };
  }

  if (query.modalidad) {
    where.modalidad = query.modalidad;
  }

  if (query.area) {
    where.area = {
      contains: query.area,
      mode: "insensitive"
    };
  }

  if (query.habilidadesTecnicas) {
    where.habilidadesTecnicas = { has: String(query.habilidadesTecnicas) };
  }

  if (query.creadaEn) {
    const fecha = new Date(query.creadaEn);
    const start = new Date(fecha);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(fecha);
    end.setUTCHours(23, 59, 59, 999);

    where.creadaEn = { gte: start, lte: end };
  }

  return where;
};

export const listarVacantesPendientes = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const where = construirFiltroVacantes(req.query);
    where.estado = EstadoGeneral.PENDIENTE;

    const { data, total, totalPages } = await vacanteService.getPaginate({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where,
    });

    return res.status(200).json({ message: "Vacantes pendientes obtenidas correctamente", data, total, page: Number(page), totalPages });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al listar vacantes pendientes", error: error.message });
  }
};

export const listarVacantesAprobadas = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, estado } = req.query;

    const where = construirFiltroVacantes(req.query);
    if (estado) {
      const estadoUpper = String(estado).toUpperCase();
      if (["APROBADA", "RECHAZADA", "INACTIVA"].includes(estadoUpper)) {
        where.estado = estadoUpper;
      } else {
        return res.status(400).json({
          message: "Estado no permitido en este endpoint."
        });
      }

    } else {
      where.estado = { not: EstadoGeneral.PENDIENTE };
    }
    const { data, total, totalPages } = await vacanteService.getPaginate({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where,
    });

    return res.status(200).json({ message: "Vacantes aprobadas obtenidas correctamente", data, total, page: Number(page), totalPages });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al listar vacantes aprobadas", error: error.message });
  }
};

export const listarVacantesPersonalizadas = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Aquí asumimos que ya tienes middleware de auth y req.user.id es el estudiante logueado
    const usuarioId = req.user?.id;

    const estudiante = await prisma.estudiante.findUnique({
      where: { usuarioId },
      select: {
        area: true,
        habilidadesTecnicas: true
      }
    });

    if (!estudiante) {
      return res.status(404).json({ message: "Estudiante no encontrado" });
    }

    // Construimos el filtro
    const where: Prisma.VacanteWhereInput = {
      estado: EstadoGeneral.APROBADA,
      OR: [
        { area: estudiante.area || undefined },
        { habilidadesTecnicas: { hasSome: estudiante.habilidadesTecnicas } }
      ]
    };

    const { data, total, totalPages } = await vacanteService.getPaginate({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where,
    });

    return res.status(200).json({
      message: "Vacantes personalizadas obtenidas correctamente",
      data,
      total,
      page: Number(page),
      totalPages
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al listar vacantes personalizadas", error: error.message });
  }
};

export const aprobarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const vacante = await vacanteService.update(id, { estado: EstadoGeneral.APROBADA });
    
    const empresa = await prisma.empresa.findUnique({
      where: { id: vacante.empresaId },
      include: { usuario: true }
    });
    if (!empresa) throw new Error("Empresa no encontrada");

    await crearNotificacion({
      tipo: TipoNotificacion.VACANTE_APROBADA,
      titulo: "Vacante aprobada",
      mensaje: `Tu vacante "${vacante.titulo}" ha sido aprobada.`,
      prioridad: PrioridadNotificacion.ALTA,
      destinatarioId: empresa.usuarioId,
      destinatarioRol: "EMPRESA",
      data: {
        vacanteId: vacante.id
      }
    });
    return res.status(200).json({ message: "Vacante aprobada correctamente", data: vacante });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al aprobar la vacante", error: error.message });
  }
};

export const rechazarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const vacante = await vacanteService.update(id, { estado: EstadoGeneral.RECHAZADA });
    const empresa = await prisma.empresa.findUnique({
      where: { id: vacante.empresaId }
    });
    if (!empresa) throw new Error("Empresa no encontrada");

    await crearNotificacion({
      tipo: TipoNotificacion.VACANTE_RECHAZADA,
      titulo: "Vacante rechazada",
      mensaje: `Tu vacante "${vacante.titulo}" ha sido rechazada.`,
      prioridad: PrioridadNotificacion.ALTA,
      destinatarioId: empresa.usuarioId,
      destinatarioRol: "EMPRESA",
      data: {
        vacanteId: vacante.id
      }
    });
    return res.status(200).json({ message: "Vacante rechazada correctamente", data: vacante });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al rechazar la vacante", error: error.message });
  }
};


export const solicitarEliminacionVacante = async (req: AuthRequest, res: Response) => {
  try {
    const vacanteId = Number(req.params.id);
    const empresa = await empresaService.obtenerEmpresaPorUsuarioId(req.user!.id);

    if (!empresa) return res.status(404).json({ message: "Empresa no encontrada." });

    const vacante = await vacanteService.getAll({ id: vacanteId, empresa: { id: empresa.id } });
    if (!vacante || vacante.length === 0) return res.status(403).json({ message: "No tienes permiso para solicitar eliminación de esta vacante." });
    if (vacante[0].estado === EstadoGeneral.INACTIVA) return res.status(400).json({ message: "La vacante ya está inactiva o eliminada." });

    return res.status(200).json({
      message: "Solicitud de eliminación enviada. Un director revisará la solicitud.",
      vacanteId,
      estadoActual: vacante[0].estado,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};


export const eliminarVacanteDefinitiva = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (req.user!.rol !== "DIRECTOR" && req.user!.rol !== "ADMIN") return res.status(403).json({ message: "No tienes permisos para eliminar vacantes." });

    await vacanteService.update(id, { estado: EstadoGeneral.INACTIVA });
    return res.status(200).json({ message: "Vacante eliminada correctamente" });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

export const inactivarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const vacante = await vacanteService.update(id, { estado: EstadoGeneral.INACTIVA });
    return res.status(200).json({ message: "Vacante marcada como inactiva correctamente", data: vacante });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

/**
 * Reactivar una vacante inactiva
 */
export const activarVacante = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const vacante = await vacanteService.update(id, { estado: EstadoGeneral.APROBADA });
    return res.status(200).json({ message: "Vacante reactivada correctamente", data: vacante });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

/**
 * Actualiza una vacante (solo ADMIN o DIRECTOR)
 */
export const actualizarVacanteAdminDirector = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "El ID de la vacante es obligatorio." });

    const data = req.body;
    if (data.habilidadesBlandas && !Array.isArray(data.habilidadesBlandas)) data.habilidadesBlandas = [];
    if (data.habilidadesTecnicas && !Array.isArray(data.habilidadesTecnicas)) data.habilidadesTecnicas = [];

    // Conectar relaciones si vienen
    if (data.empresaId) data.empresa = { connect: { id: data.empresaId } };
    if (data.directorValidaId) data.directorValida = { connect: { id: data.directorValidaId } };
    if (data.convenioId) data.convenio = { connect: { id: data.convenioId } };

    const vacante = await vacanteService.update(Number(id), data);
    return res.status(200).json({ message: "Vacante actualizada correctamente", data: vacante });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

export const listarVacantesEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(401).json({ message: "No autorizado" });

    const { page = 1, limit = 10, titulo, estado, area } = req.query;
    const where: any = { empresa: { usuarioId: companyId } };
    if (titulo) where.titulo = { contains: String(titulo) };
    if (estado) where.estado = String(estado).toUpperCase();
    if (area) where.area = String(area);

    const { data, total, totalPages } = await vacanteService.getPaginate({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where,
    });

    return res.json({ data, total, page: Number(page), totalPages });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener vacantes de la empresa", error: error.message });
  }
};