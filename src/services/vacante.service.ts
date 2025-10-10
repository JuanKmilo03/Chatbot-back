import { PrismaClient, EstadoVacante } from '@prisma/client';

const prisma = new PrismaClient();

export const crearVacante = async (data: {
  empresaId: number;
  titulo: string;
  descripcion: string;
  area: string;
  requisitos?: string;
}) => {
  // Validar que la empresa existe
  const empresa = await prisma.empresa.findUnique({
    where: { id: data.empresaId }
  });

  if (!empresa) {
    throw new Error('Empresa no encontrada');
  }

  // Crear la vacante con estado PENDIENTE por defecto
  const vacante = await prisma.vacante.create({
    data: {
      empresaId: data.empresaId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      area: data.area,
      requisitos: data.requisitos || null,
      estado: EstadoVacante.PENDIENTE
    },
    include: {
      empresa: {
        select: {
          nombre: true,
          nit: true
        }
      }
    }
  });

  return vacante;
};

export const listarVacantesPendientes = async () => {
  const vacantes = await prisma.vacante.findMany({
    where: {
      estado: EstadoVacante.PENDIENTE
    },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          nit: true
        }
      }
    },
    orderBy: {
      creadaEn: 'desc'
    }
  });

  return vacantes;
};

export const aprobarVacante = async (
  vacanteId: number,
  directorId: number
) => {
  // Verificar que la vacante existe
  const vacante = await prisma.vacante.findUnique({
    where: { id: vacanteId }
  });

  if (!vacante) {
    throw new Error('Vacante no encontrada');
  }

  // Verificar que la vacante está pendiente
  if (vacante.estado !== EstadoVacante.PENDIENTE) {
    throw new Error('Solo se pueden aprobar vacantes en estado PENDIENTE');
  }

  // Verificar que el director existe
  const director = await prisma.director.findUnique({
    where: { id: directorId }
  });

  if (!director) {
    throw new Error('Director no encontrado');
  }

  // Aprobar la vacante
  const vacanteAprobada = await prisma.vacante.update({
    where: { id: vacanteId },
    data: {
      estado: EstadoVacante.APROBADA,
      directorValidaId: directorId
    },
    include: {
      empresa: {
        select: {
          nombre: true
        }
      },
      directorValida: {
        select: {
          id: true,
          usuario: {
            select: {
              nombre: true
            }
          }
        }
      }
    }
  });

  return vacanteAprobada;
};

export const rechazarVacante = async (
  vacanteId: number,
  directorId: number
) => {
  // Verificar que la vacante existe
  const vacante = await prisma.vacante.findUnique({
    where: { id: vacanteId }
  });

  if (!vacante) {
    throw new Error('Vacante no encontrada');
  }

  // Verificar que la vacante está pendiente
  if (vacante.estado !== EstadoVacante.PENDIENTE) {
    throw new Error('Solo se pueden rechazar vacantes en estado PENDIENTE');
  }

  // Verificar que el director existe
  const director = await prisma.director.findUnique({
    where: { id: directorId }
  });

  if (!director) {
    throw new Error('Director no encontrado');
  }

  // Rechazar la vacante
  const vacanteRechazada = await prisma.vacante.update({
    where: { id: vacanteId },
    data: {
      estado: EstadoVacante.RECHAZADA,
      directorValidaId: directorId
    },
    include: {
      empresa: {
        select: {
          nombre: true
        }
      },
      directorValida: {
        select: {
          id: true,
          usuario: {
            select: {
              nombre: true
            }
          }
        }
      }
    }
  });

  return vacanteRechazada;
};