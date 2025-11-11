import { Request, Response } from "express";
import { PrismaClient, EstadoConvenio } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/authFirebase.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";
import { convenioService } from "../services/convenio.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();

export const solicitarConvenio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario || usuario.rol !== "EMPRESA") {
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
        estado: EstadoConvenio.EN_REVISION,
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
      where: { directorId: director.id, estado: "APROBADO" },
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
      where: { directorId: Number(directorId), estado: EstadoConvenio.EN_REVISION },
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
      data: { estado: EstadoConvenio.APROBADO },
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
      data: { estado: EstadoConvenio.RECHAZADO },
      include: { director: true, empresa: true },
    });

    res.status(200).json({ message: "Convenio marcado como cancelado", convenio });
  } catch (error) {
    res.status(500).json({ message: "Error al marcar convenio como cancelado" });
  }
};

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