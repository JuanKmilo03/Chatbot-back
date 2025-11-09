import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as chatService from "../services/chat.service.js";
import cloudinary from "../config/cloudinary.config.js";
import { io } from "../app.js";
import * as socketChatService from "../services/socket-chat.service.js";
import { Rol } from "@prisma/client";
import { AppError } from "../utils/errors.js";

/**
 * Valida que el rol sea un valor válido del enum Rol
 */
const isValidRol = (rol: string): rol is Rol => {
  return Object.values(Rol).includes(rol as Rol);
};

/**
 * Obtiene o crea una conversación entre empresa y director
 */
export const obtenerOCrearConversacionController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { empresaId, directorId } = req.body;
    const usuarioId = req.user?.id;
    const rol = req.user?.rol;

    if (!usuarioId || !rol || !isValidRol(rol)) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!empresaId || !directorId) {
      return res.status(400).json({
        message: "empresaId y directorId son requeridos",
      });
    }

    const conversacion = await chatService.obtenerOCrearConversacion(
      Number(empresaId),
      Number(directorId)
    );

    // Emitir evento de nueva conversación si fue creada
    socketChatService.emitNewConversation(
      io,
      Number(empresaId),
      Number(directorId),
      conversacion
    );

    res.status(200).json(conversacion);
  } catch (error: any) {
    console.error("Error al obtener/crear conversación:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Envía un mensaje en una conversación (con soporte para archivos)
 */
export const enviarMensajeController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { conversacionId, contenido } = req.body;
    const usuarioId = req.user?.id;
    const rol = req.user?.rol;
    const archivos = req.files as Express.Multer.File[];

    if (!usuarioId || !rol || !isValidRol(rol)) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!conversacionId) {
      return res.status(400).json({
        message: "conversacionId es requerido",
      });
    }

    // Validar que al menos haya contenido o archivos
    if (!contenido && (!archivos || archivos.length === 0)) {
      return res.status(400).json({
        message: "Debes proporcionar contenido o archivos",
      });
    }

    // Subir archivos a Cloudinary si existen
    let archivosData: Array<{
      nombreArchivo: string;
      archivoUrl: string;
      publicId?: string;
      mimeType?: string;
      fileSize?: number;
    }> = [];

    if (archivos && archivos.length > 0) {
      // Subir cada archivo a Cloudinary
      const uploadPromises = archivos.map(async (archivo) => {
        // Convertir buffer a base64 para subir a Cloudinary
        const b64 = Buffer.from(archivo.buffer).toString("base64");
        const dataURI = `data:${archivo.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "ChatDocumentos",
          resource_type: "auto",
        });

        return {
          nombreArchivo: archivo.originalname,
          archivoUrl: result.secure_url,
          publicId: result.public_id,
          mimeType: archivo.mimetype,
          fileSize: archivo.size,
        };
      });

      archivosData = await Promise.all(uploadPromises);
    }

    const mensaje = await chatService.enviarMensaje(
      Number(conversacionId),
      usuarioId,
      rol,
      contenido,
      archivosData.length > 0 ? archivosData : undefined
    );

    // Emitir evento de nuevo mensaje en tiempo real
    socketChatService.emitNewMessage(io, Number(conversacionId), mensaje);

    res.status(201).json(mensaje);
  } catch (error: any) {
    console.error("Error al enviar mensaje:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Obtiene los mensajes de una conversación
 */
export const obtenerMensajesController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { conversacionId } = req.params;
    const { page, pageSize } = req.query;
    const usuarioId = req.user?.id;
    const rol = req.user?.rol;

    if (!usuarioId || !rol || !isValidRol(rol)) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const result = await chatService.obtenerMensajes(
      Number(conversacionId),
      usuarioId,
      rol,
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      }
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error al obtener mensajes:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Obtiene todas las conversaciones del usuario
 */
export const obtenerConversacionesController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const usuarioId = req.user?.id;
    const rol = req.user?.rol;

    if (!usuarioId || !rol || !isValidRol(rol)) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const conversaciones = await chatService.obtenerConversaciones(
      usuarioId,
      rol
    );

    res.status(200).json(conversaciones);
  } catch (error: any) {
    console.error("Error al obtener conversaciones:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Obtiene una conversación por ID
 */
export const obtenerConversacionPorIdController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { conversacionId } = req.params;
    const usuarioId = req.user?.id;
    const rol = req.user?.rol;

    if (!usuarioId || !rol || !isValidRol(rol)) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const conversacion = await chatService.obtenerConversacionPorId(
      Number(conversacionId),
      usuarioId,
      rol
    );

    res.status(200).json(conversacion);
  } catch (error: any) {
    console.error("Error al obtener conversación:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ message: error.message });
  }
};
