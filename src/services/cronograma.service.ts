import { PrismaClient, TipoActividad } from '@prisma/client';

const prisma = new PrismaClient();

export class CronogramaService {
  /**
   * Obtener todos los cronogramas de un programa
   */
  static async obtenerPorPrograma(programaId: number) {
    // Validar que el programa existe
    const programa = await prisma.programa.findUnique({
      where: { id: programaId }
    });

    if (!programa) {
      throw new Error('Programa no encontrado');
    }

    const cronogramas = await prisma.cronograma.findMany({
      where: { 
        programaId: programaId 
      },
      include: {
        director: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        },
        actividades: {
          orderBy: { fechaInicio: 'asc' }
        },
        programa: {
          select: {
            id: true,
            nombre: true,
            facultad: true
          }
        }
      },
      orderBy: { 
        creadoEn: 'desc' 
      }
    });

    return {
      programa: {
        id: programa.id,
        nombre: programa.nombre,
        facultad: programa.facultad
      },
      cronogramas,
      total: cronogramas.length
    };
  }

  /**
   * Obtener cronograma activo de un programa
   */
  static async obtenerActivo(programaId: number) {
    const programa = await prisma.programa.findUnique({
      where: { id: programaId }
    });

    if (!programa) {
      throw new Error('Programa no encontrado');
    }

    const cronograma = await prisma.cronograma.findFirst({
      where: { 
        programaId: programaId,
        activo: true
      },
      include: {
        director: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        },
        actividades: {
          orderBy: { fechaInicio: 'asc' }
        },
        programa: {
          select: {
            id: true,
            nombre: true,
            facultad: true
          }
        }
      }
    });

    if (!cronograma) {
      throw new Error('No hay cronograma activo para este programa');
    }

    return cronograma;
  }

  /**
   * Obtener cronograma por ID
   */
  static async obtenerPorId(id: number) {
    const cronograma = await prisma.cronograma.findUnique({
      where: { id },
      include: {
        director: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        },
        actividades: {
          orderBy: { fechaInicio: 'asc' }
        },
        programa: {
          select: {
            id: true,
            nombre: true,
            facultad: true
          }
        }
      }
    });

    if (!cronograma) {
      throw new Error('Cronograma no encontrado');
    }

    return cronograma;
  }

  /**
   * Crear nuevo cronograma (archivoUrl opcional)
   */
  static async crear(data: {
    programaId: number;
    directorId: number;
    titulo: string;
    descripcion?: string;
    semestre: string;
    archivoUrl?: string; // ✅ Ahora es opcional
    actividades: Array<{
      nombre: string;
      descripcion?: string;
      fechaInicio: Date;
      fechaFin: Date;
      tipo: TipoActividad;
    }>;
  }) {
    // Verificar que el director pertenece al programa
    const director = await prisma.director.findFirst({
      where: {
        id: data.directorId,
        programaId: data.programaId
      }
    });

    if (!director) {
      throw new Error('El director no pertenece a este programa');
    }

    // Verificar que no existe cronograma para el mismo semestre
    const existeCronograma = await prisma.cronograma.findFirst({
      where: {
        programaId: data.programaId,
        semestre: data.semestre
      }
    });

    if (existeCronograma) {
      throw new Error('Ya existe un cronograma para este semestre');
    }

    // Desactivar cronogramas anteriores
    await prisma.cronograma.updateMany({
      where: {
        programaId: data.programaId,
        activo: true
      },
      data: {
        activo: false
      }
    });

    // Datos para crear el cronograma
    const cronogramaData: any = {
      programaId: data.programaId,
      directorId: data.directorId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      semestre: data.semestre,
      activo: true,
      actividades: {
        create: data.actividades
      }
    };

    // ✅ Agregar archivoUrl solo si existe y no está vacío
    if (data.archivoUrl && data.archivoUrl.trim() !== '') {
      cronogramaData.archivoUrl = data.archivoUrl;
    }

    // Crear nuevo cronograma
    const cronograma = await prisma.cronograma.create({
      data: cronogramaData,
      include: {
        actividades: {
          orderBy: { fechaInicio: 'asc' }
        },
        director: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        },
        programa: {
          select: {
            id: true,
            nombre: true,
            facultad: true
          }
        }
      }
    });

    return cronograma;
  }

  /**
   * Actualizar cronograma
   */
  static async actualizar(id: number, data: {
    titulo?: string;
    descripcion?: string;
    archivoUrl?: string;
    activo?: boolean;
  }) {
    const cronograma = await prisma.cronograma.findUnique({
      where: { id }
    });

    if (!cronograma) {
      throw new Error('Cronograma no encontrado');
    }

    const cronogramaActualizado = await prisma.cronograma.update({
      where: { id },
      data: data,
      include: {
        actividades: {
          orderBy: { fechaInicio: 'asc' }
        },
        director: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        }
      }
    });

    return cronogramaActualizado;
  }

  /**
   * Eliminar cronograma
   */
  static async eliminar(id: number) {
    const cronograma = await prisma.cronograma.findUnique({
      where: { id }
    });

    if (!cronograma) {
      throw new Error('Cronograma no encontrado');
    }

    // Eliminar actividades primero (por la relación)
    await prisma.actividadCronograma.deleteMany({
      where: { cronogramaId: id }
    });

    // Eliminar cronograma
    await prisma.cronograma.delete({
      where: { id }
    });

    return { message: 'Cronograma eliminado correctamente' };
  }

  /**
   * Buscar cronogramas con filtros
   */
  static async buscar(filtros: {
    programaId?: number;
    semestre?: string;
    activo?: boolean;
  }) {
    const where: any = {};

    if (filtros.programaId) {
      where.programaId = filtros.programaId;
    }

    if (filtros.semestre) {
      where.semestre = { contains: filtros.semestre, mode: 'insensitive' };
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    const cronogramas = await prisma.cronograma.findMany({
      where,
      include: {
        director: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        },
        actividades: {
          orderBy: { fechaInicio: 'asc' }
        },
        programa: {
          select: {
            id: true,
            nombre: true,
            facultad: true
          }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    return cronogramas;
  }
}