// src/controllers/documento.controller.ts
import { Request, Response } from "express";
import { documentoService } from "../services/documento.service.js";
import { TipoDocumento } from "@prisma/client";
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { AppError } from '../utils/errors.js';

export const subirDocumento = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Debe subir un archivo." });

    const data = {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      categoria: req.body.categoria || TipoDocumento.GENERAL,
      convenioId: req.body.convenioId ? Number(req.body.convenioId) : undefined,
      directorId: req.user?.id,
      archivoUrl: "",
    };

    const documento = await documentoService.subirDocumento(
      file,
      data,
      "DocumentosPracticas"
    );

    res.status(201).json({
      message: "Documento subido correctamente",
      documento
    });
  } catch (error: any) {
    console.error("Error al subir documento:", error);
    res.status(500).json({ message: error.message });
  }
};

export const listarDocumentos = async (req: Request, res: Response) => {
  try {
    const filtros: any = {};

    const CATEGORIAS_VALIDAS = [ "GENERAL", "CRONOGRAMA", "CONVENIO_PLANTILLA", "DOCUMENTO_EMPRESA", "DOCUMENTO_ESTUDIANTE", ];
    filtros.categoria = { in: CATEGORIAS_VALIDAS };
    if (req.query.titulo) filtros.titulo = { contains: req.query.titulo as string, mode: "insensitive" };
    if (req.query.directorId) filtros.directorId = Number(req.query.directorId);
    if (req.query.convenioId) filtros.convenioId = Number(req.query.convenioId);

    const documentos = await documentoService.listar(filtros);

    res.status(200).json(documentos);
  } catch (error) {
    console.error("Error al listar documentos:", error);
    res.status(500).json({ message: "Error al listar documentos" });
  }
};

export const obtenerPlantillaConvenio = async (_req: Request, res: Response) => {
  try {
    const [plantilla] = await documentoService.listar({ categoria: "CONVENIO_PLANTILLA" })
    if (!plantilla) {
      return res.status(404).json({ message: "No se encontró plantilla de convenio." });
    }

    res.status(200).json({ data: plantilla });
  } catch (error) {
    console.error("Error al obtener plantilla de convenio:", error);
    res.status(500).json({ message: "Error al obtener plantilla de convenio." });
  }
};

export const obtenerDocumentoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const documento = await documentoService.obtenerPorId(Number(id));

    res.status(200).json(documento);
  } catch (error: any) {
    console.error("Error al obtener documento:", error);
    res.status(404).json({ message: error.message });
  }
};

export const actualizarDocumento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    const data = {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      categoria: req.body.categoria
    };

    const documento = await documentoService.actualizarDocumento(
      Number(id),
      data,
      file,
      "DocumentosPracticas"
    );

    res.status(200).json(documento);
  } catch (error: any) {
    console.error("Error al actualizar documento:", error);
    res.status(500).json({ message: error.message });
  }
};

export const eliminarDocumento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const documento = await documentoService.eliminar(Number(id));

    res.status(200).json({
      message: "Documento eliminado correctamente",
      documento
    });
  } catch (error: any) {
    console.error("Error al eliminar documento:", error);
    res.status(500).json({ message: error.message });
  }
};

export const obtenerDocumentosGenerales = async (req: Request, res: Response) => {
  try {
    const documentos = await documentoService.listar({ categoria: "GENERAL"  });

    res.status(200).json(documentos);
  } catch (error: any) {
    console.error("Error al obtener documentos generales:", error);
    res.status(500).json({ message: error.message || "Error al obtener documentos generales" });
  }
};

export const obtenerDocumentosEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const empresaId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const documentos = await documentoService.listar({ categoria: "DOCUMENTO_EMPRESA" });

    res.status(200).json(documentos);
  } catch (error: any) {
    console.error("Error al obtener documentos para empresa:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

export const obtenerDocumentosEstudiante = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const documentos = await documentoService.listar({ categoria: "DOCUMENTO_ESTUDIANTE" });

    res.status(200).json(documentos);
  } catch (error: any) {
    console.error("Error al obtener documentos para estudiante:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};