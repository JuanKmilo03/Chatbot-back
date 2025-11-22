import { Request, Response } from "express";
import { RepresentanteService } from "../services/representante.service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Crear o actualizar representante legal de la empresa autenticada
 * POST/PUT /api/representante
 */
export const upsertRepresentante = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).user;
    const { nombreCompleto, tipoDocumento, numeroDocumento, email, telefono } = req.body;

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Obtener la empresa del usuario autenticado
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: usuario.id },
    });

    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    const representante = await RepresentanteService.upsertRepresentante(empresa.id, {
      nombreCompleto,
      tipoDocumento,
      numeroDocumento,
      email,
      telefono,
    });

    res.status(200).json({
      message: "Representante legal guardado exitosamente",
      data: representante,
    });
  } catch (error: any) {
    console.error("Error al guardar representante legal:", error);
    res.status(400).json({ message: error.message || "Error al guardar representante legal" });
  }
};

/**
 * Obtener representante legal de la empresa autenticada
 * GET /api/representante
 */
export const getRepresentante = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).user;

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Obtener la empresa del usuario autenticado
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: usuario.id },
    });

    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    const representante = await RepresentanteService.getByEmpresaId(empresa.id);

    if (!representante) {
      return res.status(404).json({ message: "Representante legal no registrado" });
    }

    res.status(200).json({ data: representante });
  } catch (error: any) {
    console.error("Error al obtener representante legal:", error);
    res.status(500).json({ message: error.message || "Error al obtener representante legal" });
  }
};

/**
 * Obtener representante legal por ID de empresa (DIRECTOR/ADMIN)
 * GET /api/representante/:empresaId
 */
export const getRepresentanteByEmpresaId = async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.params;

    const representante = await RepresentanteService.getByEmpresaId(Number(empresaId));

    if (!representante) {
      return res.status(404).json({ message: "Representante legal no encontrado" });
    }

    res.status(200).json({ data: representante });
  } catch (error: any) {
    console.error("Error al obtener representante legal:", error);
    res.status(500).json({ message: error.message || "Error al obtener representante legal" });
  }
};

/**
 * Listar todos los representantes legales (DIRECTOR/ADMIN)
 * GET /api/representantes
 */
export const getAllRepresentantes = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await RepresentanteService.getAllRepresentantes(page, limit);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error al listar representantes legales:", error);
    res.status(500).json({ message: error.message || "Error al listar representantes legales" });
  }
};

/**
 * Eliminar representante legal (EMPRESA)
 * DELETE /api/representante
 */
export const deleteRepresentante = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).user;

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Obtener la empresa del usuario autenticado
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: usuario.id },
    });

    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    const result = await RepresentanteService.deleteRepresentante(empresa.id);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error al eliminar representante legal:", error);
    res.status(400).json({ message: error.message || "Error al eliminar representante legal" });
  }
};
