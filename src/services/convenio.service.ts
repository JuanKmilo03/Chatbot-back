import fs from "fs";
import { EstadoConvenio, EstadoEmpresa, PrismaClient, TipoConvenio, TipoDocumento } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import cloudinary from "../config/cloudinary.config.js";

const prisma = new PrismaClient();

export const convenioService = {
  crearConvenioInicial: async (empresaId: number) => {
    const plantilla = await prisma.documento.findFirst({
      where: { categoria: TipoDocumento.CONVENIO_PLANTILLA },
      orderBy: { createdAt: "desc" },
    });

    const convenio = await prisma.convenio.create({
      data: {
        empresaId,
        directorId: null,
        nombre: "Convenio inicial",
        tipo: TipoConvenio.MACRO,
        estado: EstadoConvenio.PENDIENTE_FIRMA,
        version: 1,
        archivoUrl: plantilla ? plantilla.archivoUrl : null,
      },
    });

    if (plantilla) {
      await prisma.documento.create({
        data: {
          titulo: `Convenio empresa #${empresaId}`,
          descripcion: "Copia inicial del convenio generado a partir de la plantilla institucional.",
          categoria: "CONVENIO_EMPRESA",
          archivoUrl: plantilla.archivoUrl,
          directorId: plantilla.directorId,
          convenioId: convenio.id,
        },
      });
    }

    return convenio;
  },
  listarConveniosPorEmpresa: async (empresaId: number) => {
    const convenios = await prisma.convenio.findMany({
      where: { empresaId },
      orderBy: { creadoEn: 'desc' }, // más recientes primero
    });

    return convenios;
  },
  listarTodosLosConvenios: async () => {
    return await prisma.convenio.findMany({
      include: { empresa: true, director: true },
      orderBy: { creadoEn: 'desc' },
    });
  },
  listarConveniosPorEmpresaId: async (empresaId: number) => {
    return await prisma.convenio.findMany({
      where: { empresaId },
      include: { empresa: true, director: true },
      orderBy: { creadoEn: 'desc' },
    });
  },
  obtenerConvenioPorId: async (convenioId: number, usuario: AuthRequest["user"]) => {
    const convenio = await prisma.convenio.findUnique({
      where: { id: convenioId },
      include: {
        empresa: {
          include: { usuario: true },
        },
        director: true,
        revisiones: true,
        documentos: true,
        vacantes: true,
        subConvenios: true,
        macroConvenio: true,
      },
    });

    if (!convenio) return null;

    if (usuario!.rol === 'EMPRESA' && convenio.empresa.usuarioId !== usuario!.id) {
      return null; // una empresa solo puede ver sus propios convenios
    }

    return convenio;
  },
  async subirFirmado(id: number, archivo: Express.Multer.File) {
    if (!archivo) throw new Error("Archivo no proporcionado");

    const convenioExistente = await prisma.convenio.findUnique({ where: { id } });
    if (!convenioExistente) throw new Error("Convenio no encontrado");

    if (convenioExistente.archivoUrl) {
      const publicId = convenioExistente.archivoUrl
        .split("/")
        .slice(-2)
        .join("/")
        .replace(/\.[^/.]+$/, ""); // quita extensión

      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn("No se pudo eliminar el archivo anterior:", e);
      }
    }
    const result = await cloudinary.uploader.upload(archivo.path, {
      folder: `Convenios/${convenioExistente.empresaId}`,
      resource_type: "auto",
      public_id: `Convenio_${id}`,
      overwrite: true,
    });

    const convenio = await prisma.convenio.update({
      where: { id },
      data: {
        archivoUrl: result.secure_url,
        estado: EstadoConvenio.PENDIENTE_REVISION,
      },
    });

    fs.unlinkSync(archivo.path);
    return convenio;
  },

  async enviarRevisionFinal(id: number) {
    const convenio = await prisma.convenio.findUnique({ where: { id } });
    if (!convenio) throw new Error("Convenio no encontrado");

    if (convenio.estado !== EstadoConvenio.PENDIENTE_REVISION) {
      throw new Error("El convenio debe estar en estado 'PENDIENTE_REVISION' para enviarse a revisión.");
    }

    return await prisma.convenio.update({
      where: { id },
      data: { estado: EstadoConvenio.EN_REVISION },
    });

    // TODO: enviar notificación por correo o registrar evento en tabla de notificaciones
  },
  async aprobarConvenio(
    id: number,
    archivo: Express.Multer.File,
    { directorId, fechaInicio, fechaFin, observaciones }:
      { directorId: number; fechaInicio?: string; fechaFin?: string; observaciones?: string }
  ) {
    if (!archivo) throw new Error("Debe subir el archivo firmado final.");

    const convenioExistente = await prisma.convenio.findUnique({
      where: { id },
      include: { empresa: true },
    });
    if (!convenioExistente) throw new Error("Convenio no encontrado");

    if (convenioExistente.archivoUrl) {
      const publicId = convenioExistente.archivoUrl
        .split("/")
        .slice(-2)
        .join("/")
        .replace(/\.[^/.]+$/, "");
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn("No se pudo eliminar el archivo anterior:", e);
      }
    }

    const result = await cloudinary.uploader.upload(archivo.path, {
      folder: `Convenios/${convenioExistente.empresaId}`,
      resource_type: "auto",
      public_id: `Convenio_${id}`,
      overwrite: true,
    });

    const convenio = await prisma.convenio.update({
      where: { id },
      data: {
        archivoUrl: result.secure_url,
        directorId,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        observaciones,
        estado: EstadoConvenio.APROBADO,
      },
    });

    await prisma.empresa.update({
      where: { id: convenioExistente.empresaId },
      data: {
        habilitada: true,
        estado: EstadoEmpresa.HABILITADA,
      },
    });

    fs.unlinkSync(archivo.path);
    return convenio;
  },
  async rechazarConvenio(id: number, observaciones?: string) {
    const convenioExistente = await prisma.convenio.findUnique({ where: { id } });
    if (!convenioExistente) throw new Error("Convenio no encontrado");

    if (
      !([EstadoConvenio.PENDIENTE_REVISION, EstadoConvenio.EN_REVISION] as EstadoConvenio[])
        .includes(convenioExistente.estado)
    ) {
      throw new Error("Solo se pueden rechazar convenios pendientes o en revisión.");
    }

    return await prisma.convenio.update({
      where: { id },
      data: {
        estado: EstadoConvenio.RECHAZADO,
        observaciones,
      },
    });
  }

}