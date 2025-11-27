import { Prisma, TipoDocumento } from "@prisma/client";
import { CloudinaryService } from "../config/cloudinary.config.js";
import { prisma } from "../config/db.js";

const TIPOS_UNICOS: ReadonlyArray<TipoDocumento> = [
  "CONVENIO_PLANTILLA",
  "ACTA_INICIO",
  "ACTA_FIN",
  "CRONOGRAMA",
]

class DocumentoService {
  async subirDocumento(file: Express.Multer.File, data: Prisma.DocumentoCreateInput, folder: string, tx: Prisma.TransactionClient = prisma) {

    if (data.categoria === "HOJA_DE_VIDA" && data.estudiante?.connect?.id) {
      const existe = await tx.documento.findFirst({
        where: {
          categoria: "HOJA_DE_VIDA",
          estudiante: { id: data.estudiante.connect.id }
        }
      });

      if (existe) {
        return this.actualizarDocumento(
          existe.id,
          data,
          file,
          folder,
          tx
        );
      }
    }

    if (TIPOS_UNICOS.includes(data.categoria as TipoDocumento)) {
      const existe = await tx.documento.findFirst({
        where: { categoria: data.categoria }
      });

      if (existe) {
        return this.actualizarDocumento(
          existe.id,
          data,
          file,
          folder,
          tx
        );
      }
    }

    const upload = await CloudinaryService.uploadFile(file, folder);

    const documento = await tx.documento.create({
      data: {
        ...data,
        archivoUrl: upload.url,
        publicId: upload.publicId,
        nombreArchivo: data.nombreArchivo || file.originalname,
      },
    });

    return documento;
  }

  async obtenerPorId(id: number) {
    const documento = await prisma.documento.findUnique({ where: { id } });
    if (!documento) throw new Error("Documento no encontrado");
    return documento;
  }

  async listar(filtros: Prisma.DocumentoWhereInput = {}) {
    return prisma.documento.findMany({
      where: filtros,
      orderBy: { createdAt: "desc" },
    });
  }

  async listarPaginado(
    where: Prisma.DocumentoWhereInput = {},
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const [total, data] = await prisma.$transaction([
      prisma.documento.count({ where }),
      prisma.documento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return { data, total, page, pages };
  }


  async eliminar(id: number) {
    const documento = await prisma.documento.findUnique({ where: { id } });
    if (!documento) {
      throw new Error("Documento no encontrado");
    }

    if (documento.publicId) {
      await CloudinaryService.deleteFile(documento.publicId);
    }

    return prisma.documento.delete({ where: { id } });
  }

  async actualizarDocumento(
    id: number,
    data: Prisma.DocumentoUpdateInput,
    nuevoArchivo?: Express.Multer.File,
    folder?: string,
    tx: Prisma.TransactionClient = prisma
  ) {
    const documento = await tx.documento.findUnique({ where: { id } });
    if (!documento) throw new Error("Documento no encontrado");

    let archivoActualizado: Partial<Prisma.DocumentoUpdateInput> = {};

    if (nuevoArchivo) {

      if (documento.publicId) {
        await CloudinaryService.deleteFile(documento.publicId);
      }

      const upload = await CloudinaryService.uploadFile(
        nuevoArchivo,
        folder ?? `documentos`
      );

      archivoActualizado = {
        archivoUrl: upload.url,
        publicId: upload.publicId,
        nombreArchivo: nuevoArchivo.originalname
      };
    }

    return tx.documento.update({
      where: { id },
      data: {
        ...data,
        ...archivoActualizado,
      },
    });
  }
}

export const documentoService = new DocumentoService();