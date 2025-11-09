// src/services/representante.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class RepresentanteService {
  /**
   * Actualizar datos del representante legal
   */
  static async actualizarRepresentante(
    id: number,
    data: {
      nombreCompleto?: string;
      tipoDocumento?: string;
      numeroDocumento?: string;
      cargo?: string;
      telefono?: string;
      email?: string;
    }
  ) {
    // Verificar que existe
    const representanteExistente = await prisma.representanteLegal.findUnique({
      where: { id },
    });

    if (!representanteExistente) {
      throw new Error("Representante legal no encontrado");
    }

    // Si se está actualizando el número de documento, verificar que no esté duplicado
    if (data.numeroDocumento && data.numeroDocumento !== representanteExistente.numeroDocumento) {
      const documentoDuplicado = await prisma.representanteLegal.findUnique({
        where: { numeroDocumento: data.numeroDocumento },
      });

      if (documentoDuplicado) {
        throw new Error("El número de documento ya está registrado");
      }
    }

    // Actualizar
    const representante = await prisma.representanteLegal.update({
      where: { id },
      data,
      include: {
        empresa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    return representante;
  }
}
