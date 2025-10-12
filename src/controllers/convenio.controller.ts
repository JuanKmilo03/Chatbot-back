import { Request, Response } from "express";
import { PrismaClient, EstadoConvenio } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/authFirebase.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";

const prisma = new PrismaClient();

export const solicitarConvenio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario || usuario.rol !== "ESTUDIANTE") {
      return res.status(403).json({ message: "Solo estudiantes pueden solicitar convenios" });
    }

    const { nombre, empresaId, directorId } = req.body;
    const archivo = req.file;

    if (!archivo) {
      return res.status(400).json({ message: "Se debe subir un archivo para el convenio" });
    }

    const result = await cloudinary.uploader.upload(archivo.path, {
      folder: "ConveniosPracticas",
      resource_type: "auto"
    });
    const convenio = await prisma.convenio.create({
      data: {
        nombre,
        empresaId: Number(empresaId),
        directorId: Number(directorId),
        estado: EstadoConvenio.PENDIENTE,
        archivoUrl: result.secure_url,
      },
    });

    fs.unlinkSync(archivo.path);

    res.status(201).json({ message: "Convenio solicitado", convenio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al solicitar convenio" });
  }
};


export const listarConvenios = async (_req: Request, res: Response) => {
  try {
    const convenios = await prisma.convenio.findMany({
      include: { director: true, empresa: true },
    });
    res.status(200).json(convenios);
  } catch (error) {
    res.status(500).json({ message: "Error al listar convenios" });
  }
};


export const actualizarConvenio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, estado } = req.body;
    const usuario = req.user;
    const archivo = req.file;

    const convenio = await prisma.convenio.findUnique({ where: { id: Number(id) } });
    if (!convenio) return res.status(404).json({ message: "Convenio no encontrado" });

    if (usuario?.rol !== "DIRECTOR" && usuario?.rol !== "ADMIN") {
      return res.status(403).json({ message: "No autorizado para actualizar convenios" });
    }

    let archivoUrl = convenio.archivoUrl;
    if (archivo) {
      const result = await cloudinary.uploader.upload(archivo.path, {
        folder: "ConveniosPracticas",
        resource_type: "auto"
      });
      archivoUrl = result.secure_url;
      fs.unlinkSync(archivo.path);
    }

    const convenioActualizado = await prisma.convenio.update({
      where: { id: Number(id) },
      data: { nombre, estado, archivoUrl },
    });

    res.status(200).json(convenioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar convenio" });
  }
};

export const obtenerConvenioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const convenio = await prisma.convenio.findUnique({
      where: { id: Number(id) },
      include: { director: true, empresa: true },
    });

    if (!convenio) return res.status(404).json({ message: "Convenio no encontrado" });

    res.status(200).json(convenio);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener convenio" });
  }
};


export const eliminarConvenio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuario = req.user;

    if (usuario?.rol !== "ADMIN") {
      return res.status(403).json({ message: "Solo los administradores pueden eliminar convenios" });
    }

    await prisma.convenio.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Convenio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar convenio" });
  }
};


export const listarConveniosPorDirector = async (req: Request, res: Response) => {
  try {
    const { directorId } = req.params;
    const convenios = await prisma.convenio.findMany({
      where: { directorId: Number(directorId) },
      include: {
        empresa: {
          select: { nit: true },
        },
      },
      orderBy: { actualizadoEn: "desc" },
    });

    if (!convenios.length) return res.status(404).json({ message: "No hay convenios para este director" });
    res.status(200).json(convenios);
  } catch (error) {
    res.status(500).json({ message: "Error al listar convenios del director" });
  }
};


export const listarConveniosVigentes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario || usuario.rol !== "DIRECTOR") return res.status(403).json({ message: "Acceso denegado" });

    const director = await prisma.director.findFirst({ where: { usuarioId: usuario.id } });
    if (!director) return res.status(404).json({ message: "Director no encontrado" });

    const convenios = await prisma.convenio.findMany({
      where: { directorId: director.id, estado: "ACTIVO" },
      include: { empresa: { select: { id: true, nit: true } } },
      orderBy: { actualizadoEn: "desc" },
    });

    res.status(200).json(convenios);
  } catch (error) {
    res.status(500).json({ message: "Error al listar convenios vigentes" });
  }
};


export const listarConveniosPendientes = async (req: Request, res: Response) => {
  try {
    const { directorId } = req.params;

    const convenios = await prisma.convenio.findMany({
      where: { directorId: Number(directorId), estado: EstadoConvenio.PENDIENTE },
      include: { empresa: true },
    });

    res.status(200).json(convenios);
  } catch (error) {
    res.status(500).json({ message: "Error al listar convenios pendientes" });
  }
};

export const aceptarConvenio = async (req: Request, res: Response) => {
  try {
    const { convenioId } = req.params;

    const convenio = await prisma.convenio.update({
      where: { id: Number(convenioId) },
      data: { estado: EstadoConvenio.ACTIVO },
      include: { director: true, empresa: true },
    });

    res.status(200).json({ message: "Convenio aceptado", convenio });
  } catch (error) {
    res.status(500).json({ message: "Error al aceptar convenio" });
  }
};


export const rechazarConvenio = async (req: Request, res: Response) => {
  try {
    const { convenioId } = req.params;

    const convenio = await prisma.convenio.update({
      where: { id: Number(convenioId) },
      data: { estado: EstadoConvenio.RECHAZADO },
      include: { director: true, empresa: true },
    });

    res.status(200).json({ message: "Convenio rechazado", convenio });
  } catch (error) {
    res.status(500).json({ message: "Error al rechazar convenio" });
  }
};


export const marcarConvenioCancelado = async (req: Request, res: Response) => {
  try {
    const { convenioId } = req.params;

    const convenio = await prisma.convenio.update({
      where: { id: Number(convenioId) },
      data: { estado: EstadoConvenio.CANCELADO },
      include: { director: true, empresa: true },
    });

    res.status(200).json({ message: "Convenio marcado como cancelado", convenio });
  } catch (error) {
    res.status(500).json({ message: "Error al marcar convenio como cancelado" });
  }
};