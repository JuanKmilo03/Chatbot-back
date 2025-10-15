// src/controllers/documento.controller.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authFirebase.js";
import { DocumentoService } from "../services/documento.service.js";

export const subirDocumento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario || (usuario.rol !== "DIRECTOR" && usuario.rol !== "ADMIN")) {
      return res.status(403).json({ message: "No autorizado para subir documentos" });
    }

    const archivo = req.file;
    if (!archivo) return res.status(400).json({ message: "Debe subir un archivo" });

    const documento = await DocumentoService.crearDocumento(req.body, archivo, usuario.id);
    res.status(201).json({ message: "Documento subido correctamente", documento });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error al subir documento" });
  }
};

export const listarDocumentos = async (_req: Request, res: Response) => {
  try {
    const documentos = await DocumentoService.listarDocumentos();
    res.status(200).json(documentos);
  } catch {
    res.status(500).json({ message: "Error al listar documentos" });
  }
};

export const obtenerDocumentoPorId = async (req: Request, res: Response) => {
  try {
    const documento = await DocumentoService.obtenerPorId(Number(req.params.id));
    if (!documento) return res.status(404).json({ message: "Documento no encontrado" });
    res.status(200).json(documento);
  } catch {
    res.status(500).json({ message: "Error al obtener documento" });
  }
};

export const actualizarDocumento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario || (usuario.rol !== "DIRECTOR" && usuario.rol !== "ADMIN")) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const documento = await DocumentoService.actualizarDocumento(Number(req.params.id), req.body, req.file);
    res.status(200).json({ message: "Documento actualizado", documento });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error al actualizar documento" });
  }
};

export const eliminarDocumento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario || usuario.rol !== "ADMIN") {
      return res.status(403).json({ message: "Solo el administrador puede eliminar documentos" });
    }

    await DocumentoService.eliminarDocumento(Number(req.params.id));
    res.status(200).json({ message: "Documento eliminado correctamente" });
  } catch {
    res.status(500).json({ message: "Error al eliminar documento" });
  }
};
