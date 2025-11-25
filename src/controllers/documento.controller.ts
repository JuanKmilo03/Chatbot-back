// src/controllers/documento.controller.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authFirebase.js";
import { documentoService } from "../services/documento.service.js";
import { TipoDocumento } from "@prisma/client";
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { AppError } from '../utils/errors.js';
import cloudinary from "../config/cloudinary.config.js";

export const subirDocumento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { titulo, descripcion } = req.body;
    const usuarioId = req.user?.id;
    const archivo = req.file;
    if (!archivo) return res.status(400).json({ message: "Debe subir un archivo" });

    if (usuarioId === undefined) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const documento = await documentoService.crearDocumento(
      {
        ...req.body,
        categoria: req.body.categoria || TipoDocumento.GENERAL,
        convenioId: req.body.convenioId ? Number(req.body.convenioId) : null,
      },
      archivo,
      usuarioId
    );
    res.status(201).json({ message: "Documento subido correctamente", documento });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error al subir documento" });
  }
};

export const listarDocumentos = async (req: Request, res: Response) => {
  try {
    const filtros: Record<string, any> = { convenioId: null };
    filtros.categoria = (req.query.categoria) ? req.query.categoria : { not: "CONVENIO_EMPRESA", };
    if (req.query.titulo) filtros.titulo = req.query.titulo;
    if (req.query.directorId) filtros.directorId = Number(req.query.directorId);
    if (req.query.convenioId) filtros.convenioId = Number(req.query.convenioId);

    const documentos = await documentoService.listarDocumentos(filtros);
    res.status(200).json(documentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar documentos" });
  }
};

export const obtenerPlantillaConvenio = async (_req: Request, res: Response) => {
  try {
    const plantilla = await documentoService.obtenerPlantillaConvenio();
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
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Actualiza un documento
 */
export const actualizarDocumento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    const usuarioId = req.user?.id;
    const archivo = req.file;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    let archivoUrl: string | undefined;
    let publicId: string | undefined;

    // Si hay un nuevo archivo, subirlo a Cloudinary
    if (archivo) {
      const b64 = Buffer.from(archivo.buffer).toString("base64");
      const dataURI = `data:${archivo.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "DocumentosPracticas",
        resource_type: "auto",
      });

      archivoUrl = result.secure_url;
      publicId = result.public_id;
    }

    const documento = await documentoService.actualizarDocumento(
      Number(id),
      {
        titulo,
        descripcion,
        ...(archivoUrl && { archivoUrl }),
        ...(publicId && { publicId }),
        ...(archivo && {
          mimeType: archivo.mimetype,
          fileSize: archivo.size,
        }),
      },
      archivo  // pasa archivo completo como tercer argumento
    );


    res.status(200).json(documento);
  } catch (error: any) {
    console.error("Error al actualizar documento:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Elimina un documento
 */
export const eliminarDocumento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const result = await documentoService.eliminarDocumento(Number(id));

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error al eliminar documento:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

export const obtenerDocumentoId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID de documento es requerido" });
    }

    const documento = await documentoService.obtenerDocumentoId(Number(id));

    res.status(200).json(documento);
  } catch (error: any) {
    console.error("Error al obtener documento por ID:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

export const obtenerDocumentosGenerales = async (req: Request, res: Response) => {
  try {
    const documentos = await documentoService.obtenerDocumentosGenerales();

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

    const documentos = await documentoService.obtenerDocumentosEmpresa(empresaId);

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

    const documentos = await documentoService.obtenerDocumentosEstudiante();

    res.status(200).json(documentos);
  } catch (error: any) {
    console.error("Error al obtener documentos para estudiante:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

export const obtenerDocumentoEmpresaPorId = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const empresaId = req.user?.id;
    const { id } = req.params;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!id) {
      return res.status(400).json({ message: "ID de documento es requerido" });
    }

    const documento = await documentoService.obtenerDocumentoEmpresaPorId(Number(id), empresaId);

    res.status(200).json(documento);
  } catch (error: any) {
    console.error("Error al obtener documento para empresa:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

export const obtenerDocumentoEstudiantePorId = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const { id } = req.params;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!id) {
      return res.status(400).json({ message: "ID de documento es requerido" });
    }

    const documento = await documentoService.obtenerDocumentoEstudiantePorId(Number(id));

    res.status(200).json(documento);
  } catch (error: any) {
    console.error("Error al obtener documento para estudiante:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};