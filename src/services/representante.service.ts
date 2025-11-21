// src/services/representante.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * DTO para crear/actualizar representante legal
 */
export interface RepresentanteLegalDTO {
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
}

/**
 * Servicio para gestionar representantes legales de empresas
 */
export class RepresentanteService {
  /**
   * Crear o actualizar representante legal de una empresa
   * Si ya existe, lo actualiza. Si no existe, lo crea.
   */
  static async upsertRepresentante(
    empresaId: number,
    data: RepresentanteLegalDTO
  ) {
    // Validaciones
    if (!data.nombreCompleto || data.nombreCompleto.trim() === "") {
      throw new Error("El nombre completo es requerido");
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error("El email es inválido o está vacío");
    }

    if (!data.telefono || data.telefono.trim() === "") {
      throw new Error("El teléfono es requerido");
    }

    // Verificar que la empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new Error("Empresa no encontrada");
    }

    // Upsert: crear o actualizar
    const representante = await prisma.representanteLegal.upsert({
      where: { empresaId },
      create: {
        empresaId,
        nombreCompleto: data.nombreCompleto.trim(),
        tipoDocumento: data.tipoDocumento.trim(),
        numeroDocumento: data.numeroDocumento.trim(),
        email: data.email.trim().toLowerCase(),
        telefono: data.telefono.trim(),
      },
      update: {
        nombreCompleto: data.nombreCompleto.trim(),
        tipoDocumento: data.tipoDocumento.trim(),
        numeroDocumento: data.numeroDocumento.trim(),
        email: data.email.trim().toLowerCase(),
        telefono: data.telefono.trim(),
      },
    });

    return representante;
  }

  /**
   * Obtener representante legal por ID de empresa
   */
  static async getByEmpresaId(empresaId: number) {
    const representante = await prisma.representanteLegal.findUnique({
      where: { empresaId },
      include: {
        empresa: {
          select: {
            id: true,
            usuario: {
              select: {
                nombre: true,
                email: true,
              },
            },
            nit: true,
          },
        },
      },
    });

    return representante;
  }

  /**
   * Obtener todos los representantes legales (solo para admin/director)
   */
  static async getAllRepresentantes(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [representantes, total] = await Promise.all([
      prisma.representanteLegal.findMany({
        skip,
        take: limit,
        include: {
          empresa: {
            select: {
              id: true,
              usuario: {
                select: {
                  nombre: true,
                },
              },
              nit: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.representanteLegal.count(),
    ]);

    return {
      data: representantes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Eliminar representante legal
   */
  static async deleteRepresentante(empresaId: number) {
    const representante = await prisma.representanteLegal.findUnique({
      where: { empresaId },
    });

    if (!representante) {
      throw new Error("Representante legal no encontrado");
    }

    await prisma.representanteLegal.delete({
      where: { empresaId },
    });

    return { message: "Representante legal eliminado exitosamente" };
  }

  /**
   * Validar formato de email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
