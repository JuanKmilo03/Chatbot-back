import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as documentoService from "../services/documento.service.js";
import cloudinary from "../config/cloudinary.config.js";
import { AppError } from "../utils/errors.js";

/**
 * Crea un documento
 */
export const subirDocumento = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, descripcion } = req.body;
    const usuarioId = req.user?.id;
    const archivo = req.file;

    if (!usuarioId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!titulo?.trim()) {
      return res.status(400).json({ message: "El título es requerido" });
    }

    if (!archivo) {
      return res.status(400).json({ message: "El archivo es requerido" });
    }

    // Subir archivo a Cloudinary
    const b64 = Buffer.from(archivo.buffer).toString("base64");
    const dataURI = `data:${archivo.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "DocumentosPracticas",
      resource_type: "auto",
    });

    // Crear documento
    const documento = await documentoService.crearDocumento(usuarioId, {
      titulo,
      descripcion,
      archivoUrl: result.secure_url,
      publicId: result.public_id,
      mimeType: archivo.mimetype,
      fileSize: archivo.size,
    });

    res.status(201).json(documento);
  } catch (error: any) {
    console.error("Error al subir documento:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Obtiene todos los documentos
 */
export const listarDocumentos = async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize } = req.query;

    const result = await documentoService.listarDocumentos({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error al listar documentos:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Obtiene un documento por ID
 */
export const obtenerDocumentoPorId = async (req: AuthRequest, res: Response) => {
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
      usuarioId,
      {
        titulo,
        descripcion,
        ...(archivoUrl && { archivoUrl }),
        ...(publicId && { publicId }),
        ...(archivo && {
          mimeType: archivo.mimetype,
          fileSize: archivo.size,
        }),
      }
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

    const result = await documentoService.eliminarDocumento(Number(id), usuarioId);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error al eliminar documento:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};
