import { prisma } from "../config/db.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors.js";

/**
 * Datos para crear un documento
 */
export interface CrearDocumentoDTO {
  titulo: string;
  descripcion?: string;
  archivoUrl: string;
  publicId?: string;
  mimeType?: string;
  fileSize?: number;
}

/**
 * Parámetros de paginación
 */
export interface ObtenerDocumentosParams {
  page?: number;
  pageSize?: number;
}

/**
 * Valida que el usuario sea director y obtiene su ID
 */
const obtenerDirectorId = async (usuarioId: number): Promise<number> => {
  const director = await prisma.director.findFirst({
    where: { usuarioId },
    select: { id: true },
  });

  if (!director) {
    throw new ForbiddenError("Solo los directores pueden gestionar documentos");
  }

  return director.id;
};

/**
 * Crea un documento
 */
export const crearDocumento = async (
  usuarioId: number,
  data: CrearDocumentoDTO
) => {
  // Validar que sea director
  const directorId = await obtenerDirectorId(usuarioId);

  // Validaciones
  if (!data.titulo?.trim()) {
    throw new BadRequestError("El título es requerido");
  }

  if (!data.archivoUrl?.trim()) {
    throw new BadRequestError("El archivo es requerido");
  }

  // Crear documento
  const documento = await prisma.documento.create({
    data: {
      directorId,
      titulo: data.titulo.trim(),
      descripcion: data.descripcion?.trim() || null,
      archivoUrl: data.archivoUrl,
    },
    include: {
      director: {
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true },
          },
        },
      },
    },
  });

  return documento;
};

/**
 * Obtiene todos los documentos con paginación
 */
export const listarDocumentos = async (params: ObtenerDocumentosParams = {}) => {
  const { page = 1, pageSize = 20 } = params;

  const [documentos, total] = await Promise.all([
    prisma.documento.findMany({
      include: {
        director: {
          include: {
            usuario: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.documento.count(),
  ]);

  return {
    data: documentos,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Obtiene un documento por ID
 */
export const obtenerPorId = async (id: number) => {
  const documento = await prisma.documento.findUnique({
    where: { id },
    include: {
      director: {
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true },
          },
        },
      },
    },
  });

  if (!documento) {
    throw new NotFoundError("Documento no encontrado");
  }

  return documento;
};

/**
 * Actualiza un documento
 */
export const actualizarDocumento = async (
  id: number,
  usuarioId: number,
  data: Partial<CrearDocumentoDTO>
) => {
  // Validar que sea director
  const directorId = await obtenerDirectorId(usuarioId);

  // Verificar que el documento existe
  const documento = await prisma.documento.findUnique({
    where: { id },
  });

  if (!documento) {
    throw new NotFoundError("Documento no encontrado");
  }

  // Verificar que el documento pertenece al director
  if (documento.directorId !== directorId) {
    throw new ForbiddenError("No tienes permiso para actualizar este documento");
  }

  // Actualizar documento
  const documentoActualizado = await prisma.documento.update({
    where: { id },
    data: {
      ...(data.titulo && { titulo: data.titulo.trim() }),
      ...(data.descripcion !== undefined && {
        descripcion: data.descripcion?.trim() || null
      }),
      ...(data.archivoUrl && { archivoUrl: data.archivoUrl }),
    },
    include: {
      director: {
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true },
          },
        },
      },
    },
  });

  return documentoActualizado;
};

/**
 * Elimina un documento
 */
export const eliminarDocumento = async (id: number, usuarioId: number) => {
  // Validar que sea director
  const directorId = await obtenerDirectorId(usuarioId);

  // Verificar que el documento existe
  const documento = await prisma.documento.findUnique({
    where: { id },
  });

  if (!documento) {
    throw new NotFoundError("Documento no encontrado");
  }

  // Verificar que el documento pertenece al director
  if (documento.directorId !== directorId) {
    throw new ForbiddenError("No tienes permiso para eliminar este documento");
  }

  // Eliminar de Cloudinary si tiene publicId
  // (Si guardaste el publicId previamente, puedes eliminar el archivo)

  // Eliminar documento
  await prisma.documento.delete({
    where: { id },
  });

  return { message: "Documento eliminado exitosamente" };
};
