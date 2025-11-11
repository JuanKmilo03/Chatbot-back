import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { convenioService } from "../services/convenio.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();

export const iniciarConvenio = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId },
    });

    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    const convenio = await convenioService.crearConvenioInicial(
      empresa.id
    );

    res.status(201).json({
      message: "Convenio iniciado correctamente",
      data: convenio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar el convenio", error });
  }
};

export const listarConveniosEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId },
    });

    if (!empresa) {
      throw new Error("Empresa no encontrada");
    }

    const convenios = await convenioService.listarConveniosPorEmpresa(empresa.id);

    res.status(200).json({ data: convenios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar los convenios", error });
  }
};

export const listarTodosLosConvenios = async (_req: AuthRequest, res: Response) => {
  try {
    const convenios = await convenioService.listarTodosLosConvenios();
    res.status(200).json({ convenios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar todos los convenios", error });
  }
};

export const listarConveniosPorEmpresaId = async (req: AuthRequest, res: Response) => {
  try {
    const empresaId = Number(req.params.empresaId);
    if (!empresaId) return res.status(400).json({ message: "ID de empresa inválido" });

    const convenios = await convenioService.listarConveniosPorEmpresaId(empresaId);
    res.status(200).json({ data:convenios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar convenios por empresa", error });
  }
};

export const obtenerConvenioPorId = async (req: AuthRequest, res: Response) => {
  try {
    const convenioId = Number(req.params.id);
    const usuario = req.user;

    if (!convenioId) {
      return res.status(400).json({ message: "ID de convenio inválido" });
    }

    const convenio = await convenioService.obtenerConvenioPorId(convenioId, usuario);

    if (!convenio) {
      return res.status(404).json({ message: "Convenio no encontrado o acceso denegado" });
    }

    res.status(200).json({ data: convenio });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener convenio" });
  }
};

export const subirConvenioFirmado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const archivo = req.file;
    const convenio = await convenioService.subirFirmado(Number(id), archivo!);
    res.status(200).json({ message: "Archivo firmado subido correctamente.", data: convenio });
  } catch (error) {
    console.error("Error al subir convenio firmado:", error);
    res.status(500).json({ message: "Error al subir convenio firmado.", error: (error as Error).message });
  }
};

export const enviarRevisionFinal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const convenio = await convenioService.enviarRevisionFinal(Number(id));
    res.status(200).json({ message: "Convenio enviado a revisión final.", data: convenio });
  } catch (error) {
    console.error("Error al enviar a revisión:", error);
    res.status(500).json({ message: "Error al enviar a revisión final.", error: (error as Error).message });
  }
};

export const aprobarConvenio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin, observaciones } = req.body;
    const archivo = req.file;
    const directorId = req.user?.id;

    const convenio = await convenioService.aprobarConvenio(Number(id), archivo!, {
      directorId: directorId!,
      fechaInicio,
      fechaFin,
      observaciones,
    });

    res.status(200).json({ message: "Convenio aprobado correctamente.", data: convenio });
  } catch (error) {
    console.error("Error al aprobar convenio:", error);
    res.status(500).json({ message: "Error al aprobar el convenio." });
  }
};

export const rechazarConvenio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const convenio = await convenioService.rechazarConvenio(Number(id), observaciones);
    res.status(200).json({ message: "Convenio rechazado correctamente.", data: convenio });
  } catch (error) {
    console.error("Error al rechazar convenio:", error);
    res.status(500).json({ message: "Error al rechazar el convenio." });
  }
};