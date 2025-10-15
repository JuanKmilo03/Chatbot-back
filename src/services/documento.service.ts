import { PrismaClient } from "@prisma/client";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";

const prisma = new PrismaClient();

export const DocumentoService = {
  async crearDocumento(data: any, archivo: Express.Multer.File, directorId: number) {
    const result = await cloudinary.uploader.upload(archivo.path, {
      folder: "DocumentosPracticas",
      resource_type: "auto",
    });

    const documento = await prisma.documento.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        archivoUrl: result.secure_url,
        directorId,
      },
    });

    fs.unlinkSync(archivo.path);
    return documento;
  },

  async listarDocumentos() {
    return prisma.documento.findMany({
      include: { director: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async obtenerPorId(id: number) {
    return prisma.documento.findUnique({
      where: { id },
      include: { director: true },
    });
  },

  async actualizarDocumento(id: number, data: any, archivo?: Express.Multer.File) {
    const documento = await prisma.documento.findUnique({ where: { id } });
    if (!documento) throw new Error("Documento no encontrado");

    let archivoUrl = documento.archivoUrl;

    if (archivo) {
      const result = await cloudinary.uploader.upload(archivo.path, {
        folder: "DocumentosPracticas",
        resource_type: "auto",
      });
      archivoUrl = result.secure_url;
      fs.unlinkSync(archivo.path);
    }

    return prisma.documento.update({
      where: { id },
      data: {
        titulo: data.titulo ?? documento.titulo,
        descripcion: data.descripcion ?? documento.descripcion,
        archivoUrl,
      },
    });
  },

  async eliminarDocumento(id: number) {
    await prisma.documento.delete({ where: { id } });
  },
};
