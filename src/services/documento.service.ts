import { PrismaClient, TipoDocumento } from "@prisma/client";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";

const prisma = new PrismaClient();

export const documentoService = {
  async crearDocumento(data: any, archivo: Express.Multer.File, directorId: number) {
    const result = await cloudinary.uploader.upload(archivo.path, {
      folder: "DocumentosPracticas",
      resource_type: "auto",
    });

    if (data.categoria === "CONVENIO_PLANTILLA") {
      const existente = await prisma.documento.findFirst({
        where: { categoria: "CONVENIO_PLANTILLA" },
      });

      if (existente) {
        if (existente.publicId) await cloudinary.uploader.destroy(existente.publicId);
        await prisma.documento.delete({ where: { id: existente.id } });
      }
    }

    const documento = await prisma.documento.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        archivoUrl: result.secure_url,
        nombreArchivo: archivo.originalname,
        publicId: result.public_id,
        directorId,
        convenioId: data.convenioId ? Number(data.convenioId) : null,
      },
    });

    fs.unlinkSync(archivo.path);

    return documento;
  },

  async listarDocumentos(where: Record<string, any> = {}) {
    return prisma.documento.findMany({
      where,
      include: { director: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async obtenerPlantillaConvenio() {
    return prisma.documento.findFirst({
      where: { categoria: "CONVENIO_PLANTILLA" },
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
    let publicId = documento.publicId;
    let nombreArchivo = documento.nombreArchivo;

    if (archivo) {
      if (publicId) await cloudinary.uploader.destroy(publicId);

      const result = await cloudinary.uploader.upload(archivo.path, {
        folder: "DocumentosPracticas",
        resource_type: "auto",
      });
      archivoUrl = result.secure_url;
      publicId = result.public_id;
      nombreArchivo = archivo.originalname;
      fs.unlinkSync(archivo.path);
    }

    return prisma.documento.update({
      where: { id },
      data: {
        titulo: data.titulo ?? documento.titulo,
        descripcion: data.descripcion ?? documento.descripcion,
        categoria: data.categoria ?? documento.categoria,
        archivoUrl,
        nombreArchivo,
        publicId,
      },
    });
  },

  async eliminarDocumento(id: number) {
    const documento = await prisma.documento.findUnique({ where: { id } });
    if (!documento) throw new Error("Documento no encontrado");

    if (documento.publicId) {
      await cloudinary.uploader.destroy(documento.publicId); // ✅ eliminar también de Cloudinary
    }

    await prisma.documento.delete({ where: { id } });
  },

  async obtenerDocumentoId(id: number) {
    const documento = await prisma.documento.findUnique({
      where: { id },
      include: { director: true },
    });

    if (!documento) {
      throw new Error("Documento no encontrado");
    }
    return documento;
  },

  async obtenerDocumentosGenerales() {
    return prisma.documento.findMany({
      where: {
        categoria: TipoDocumento.GENERAL
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        archivoUrl: true,
        nombreArchivo: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async obtenerDocumentosEmpresa(empresaId?: number) {

    const documentosGenerales = await prisma.documento.findMany({
      where: {
        categoria: TipoDocumento.GENERAL
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        archivoUrl: true,
        nombreArchivo: true,
        createdAt: true
      }
    });

    const documentosEmpresa = await prisma.documento.findMany({
      where: {
        categoria: TipoDocumento.EMPRESA
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        archivoUrl: true,
        nombreArchivo: true,
        createdAt: true
      }
    });

    // pa obtener convenio específico de la empresa
    let convenioEmpresa: any[] = [];
    if (empresaId) {
      convenioEmpresa = await prisma.documento.findMany({
        where: {
          categoria: TipoDocumento.CONVENIO_EMPRESA,
          Convenio: {
            empresaId: empresaId
          }
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          categoria: true,
          archivoUrl: true,
          nombreArchivo: true,
          createdAt: true,
          Convenio: {
            select: {
              id: true,
              estado: true
            }
          }
        }
      });
    }

    return {
      documentosGenerales,
      documentosEmpresa,
      convenioEmpresa
    };
  },

  async obtenerDocumentosEstudiante() {

    const documentosGenerales = await prisma.documento.findMany({
      where: {
        categoria: TipoDocumento.GENERAL
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        archivoUrl: true,
        nombreArchivo: true,
        createdAt: true
      }
    });

    const documentosEstudiante = await prisma.documento.findMany({
      where: {
        categoria: TipoDocumento.ESTUDIANTE
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        archivoUrl: true,
        nombreArchivo: true,
        createdAt: true
      }
    });

    return {
      documentosGenerales,
      documentosEstudiante
    };
  },

  async obtenerDocumentoEmpresaPorId(id: number, empresaId?: number) {
    const documento = await prisma.documento.findFirst({
      where: {
        id,
        OR: [
          { categoria: TipoDocumento.GENERAL },
          { categoria: TipoDocumento.EMPRESA },
          ...(empresaId ? [{
            categoria: TipoDocumento.CONVENIO_EMPRESA,
            Convenio: {
              empresaId: empresaId
            }
          }] : [])
        ]
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        archivoUrl: true,
        nombreArchivo: true,
        createdAt: true,
        Convenio: {
          select: {
            id: true,
            estado: true
          }
        }
      }
    });

    if (!documento) {
      throw new Error("Documento no encontrado o no autorizado");
    }

    return documento;
  },

  async obtenerDocumentoEstudiantePorId(id: number) {
    const documento = await prisma.documento.findFirst({
      where: {
        id,
        OR: [
          { categoria: TipoDocumento.GENERAL },
          { categoria: TipoDocumento.ESTUDIANTE }
        ]
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        archivoUrl: true,
        nombreArchivo: true,
        createdAt: true
      }
    });

    if (!documento) {
      throw new Error("Documento no encontrado o no autorizado");
    }

    return documento;
  }
};
