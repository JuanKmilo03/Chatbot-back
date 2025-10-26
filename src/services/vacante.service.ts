import { PrismaClient, EstadoGeneral, Vacante, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface FiltrosVacantes {
  titulo?: string;
  empresa?: string;
  estado?: EstadoGeneral;
  area?: string;
}

/**
 * Crea una nueva vacante asociada a una empresa.
 */
export const crearVacante = async (data: {
  empresaId: number;
  titulo: string;
  descripcion: string;
  area: string;
  modalidad: "PRESENCIAL" | "REMOTO" | "HIBRIDO";
  habilidadesBlandas?: string;
  habilidadesTecnicas?: string;
}) => {
  const { empresaId, titulo, descripcion, area, modalidad, habilidadesBlandas, habilidadesTecnicas } = data;

  // Validar que la empresa exista
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (!empresa) {
    throw new Error("La empresa especificada no existe.");
  }

  // Crear la vacante (estado pendiente por defecto)
  const nuevaVacante = await prisma.vacante.create({
    data: {
      empresaId,
      titulo,
      descripcion,
      area,
      modalidad,
      habilidadesBlandas: habilidadesBlandas || null,
      habilidadesTecnicas: habilidadesTecnicas || null,
      estado: "PENDIENTE", // o EstadoGeneral.PENDIENTE si usas el enum importado
    },
    include: {
      empresa: {
        select: {
          id: true,
          usuario: {
            select: { nombre: true, email: true },
          },
        },
      },
    },
  });

  return nuevaVacante;
};

export const crearVacanteAprobada = async (data: {
  titulo: string;
  descripcion: string;
  area: string;
  modalidad: "PRESENCIAL" | "REMOTO" | "HIBRIDO";
  habilidadesBlandas?: string;
  habilidadesTecnicas?: string;
  empresaId: number;
  directorId: number;
}) => {
  const { titulo, descripcion, area, modalidad, habilidadesBlandas, habilidadesTecnicas, empresaId, directorId } = data;

  // Validar empresa
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa) throw new Error("Empresa no encontrada.");

  // Validar director
  const director = await prisma.director.findUnique({ where: { id: directorId } });
  if (!director) throw new Error("Director no encontrado.");

  // Crear vacante como aprobada
  const vacante = await prisma.vacante.create({
    data: {
      titulo,
      descripcion,
      area,
      modalidad,
      habilidadesBlandas: habilidadesBlandas || null,
      habilidadesTecnicas: habilidadesTecnicas || null,
      estado: "APROBADA",
      empresaId,
      directorValidaId: directorId,
    },
    include: {
      empresa: { select: { id: true, usuario: { select: { nombre: true } } } },
      directorValida: { select: { id: true, usuario: { select: { nombre: true } } } },
    },
  });

  return vacante;
};


export const getVacanteByIdService = async (id: number): Promise<Vacante | null> => {
  return prisma.vacante.findUnique({
    where: { id },
    include: {
       empresa: {
        include: {
          usuario: true
        },
      },
      directorValida: true,
      practicas: true
    }
  });
};

export const listarVacantesPendientes = async ({ page, limit, filters }: {
  page: number;
  limit: number;
  filters: FiltrosVacantes;
}) => {
  const skip = (page - 1) * limit;

  const where: Prisma.VacanteWhereInput = {
    estado: EstadoGeneral.PENDIENTE,
    ...(filters.titulo && {
      titulo: { contains: String(filters.titulo), mode: Prisma.QueryMode.insensitive },
    }),
    ...(filters.area && {
      area: { contains: String(filters.area), mode: Prisma.QueryMode.insensitive },
    }),
    ...(filters.empresa && {
      empresa: {
        usuario: {
          nombre: { contains: String(filters.empresa), mode: Prisma.QueryMode.insensitive },
        },
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.vacante.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nit: true,
            usuario: { select: { nombre: true, email: true } },
          },
        },
      },
      orderBy: { creadaEn: 'desc' },
      skip,
      take: limit,
    }),
    prisma.vacante.count({ where }),
  ]);

  return { data, total };
};

export const listarVacantesAprobadas = async ({ page, limit, filters }: {
  page: number;
  limit: number;
  filters: FiltrosVacantes;
}) => {
  const skip = (page - 1) * limit;

  const where: Prisma.VacanteWhereInput = {
    ...(filters.estado
      ? { estado: filters.estado }
      : { NOT: { estado: EstadoGeneral.PENDIENTE } }),
    ...(filters.titulo && {
      titulo: { contains: filters.titulo, mode: Prisma.QueryMode.insensitive },
    }),
    ...(filters.area && {
      area: { contains: filters.area, mode: Prisma.QueryMode.insensitive },
    }),
    ...(filters.empresa && {
      empresa: {
        usuario: {
          nombre: { contains: filters.empresa, mode: Prisma.QueryMode.insensitive },
        },
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.vacante.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nit: true,
            usuario: { select: { nombre: true, email: true } },
          },
        },
      },
      orderBy: { creadaEn: 'desc' },
      skip,
      take: limit,
    }),
    prisma.vacante.count({ where }),
  ]);

  return { data, total };
};

/**
 * Aprueba una vacante pendiente por parte de un director.
 */
export const aprobarVacante = async (vacanteId: number, usuarioId: number) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });
  if (!vacante) throw new Error("Vacante no encontrada.");
  if (vacante.estado !== EstadoGeneral.PENDIENTE)
    throw new Error("Solo se pueden aprobar vacantes pendientes.");

  const director = await prisma.director.findFirst({ where: { usuarioId } });
  if (!director) throw new Error("Director no encontrado.");

  return await prisma.vacante.update({
    where: { id: vacanteId },
    data: {
      estado: EstadoGeneral.APROBADA,
      directorValidaId: director.id, 
    },
    include: {
      empresa: {
        select: { id: true, usuario: { select: { nombre: true, email: true } } },
      },
      directorValida: {
        select: { id: true, usuario: { select: { nombre: true, email: true } } },
      },
    },
  });
};


export const rechazarVacante = async (vacanteId: number, usuarioId: number) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });
  if (!vacante) throw new Error("Vacante no encontrada.");

  if (vacante.estado !== EstadoGeneral.PENDIENTE) {
    throw new Error("Solo se pueden rechazar vacantes pendientes.");
  }

  const director = await prisma.director.findUnique({ where: { usuarioId } });
  if (!director) throw new Error("Director no encontrado.");

  const vacanteActualizada = await prisma.vacante.update({
    where: { id: vacanteId },
    data: {
      estado: EstadoGeneral.RECHAZADA,
      directorValidaId: director.id,
    },
    include: {
      empresa: { select: { id: true, usuario: { select: { nombre: true, email: true } } } },
      directorValida: { select: { id: true, usuario: { select: { nombre: true, email: true } } } },
    },
  });

  return vacanteActualizada;
};

/**
 * Solicitar eliminación de una vacante (la empresa lo solicita, no la elimina directamente)
 */
export const solicitarEliminacionVacante = async (vacanteId: number, empresaId: number) => {
  const vacante = await prisma.vacante.findUnique({
    where: { id: vacanteId },
  });

  if (!vacante) throw new Error("Vacante no encontrada.");
  if (vacante.empresaId !== empresaId)
    throw new Error("No tienes permiso para solicitar eliminación de esta vacante.");

  // Solo se puede solicitar eliminación si no está ya inactiva
  if (vacante.estado === EstadoGeneral.INACTIVA)
    throw new Error("La vacante ya está inactiva o eliminada.");

  // Aquí podrías implementar una notificación o marcar una columna especial si quisieras.
  // Por ahora devolvemos una confirmación de solicitud.
  return {
    message: "Solicitud de eliminación enviada. Un director revisará la solicitud.",
    vacanteId,
    estadoActual: vacante.estado,
  };
};

/**
 * Eliminar definitivamente (solo admin o director)
 */
export const eliminarVacanteDefinitiva = async (vacanteId: number) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });

  if (!vacante) throw new Error("Vacante no encontrada.");

  await prisma.vacante.delete({
    where: { id: vacanteId },
  });

  return { message: "Vacante eliminada permanentemente.", vacanteId };
};

/**
 * Cambia el estado de una vacante (reutilizable para inactivar/activar).
 */
export const cambiarEstadoVacante = async (
  vacanteId: number,
  nuevoEstado: EstadoGeneral
) => {
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });
  if (!vacante) throw new Error("Vacante no encontrada.");

  if (vacante.estado === nuevoEstado)
    throw new Error(`La vacante ya se encuentra en estado ${nuevoEstado}.`);

  return prisma.vacante.update({
    where: { id: vacanteId },
    data: { estado: nuevoEstado },
  });
};

/**
 * Actualizar vacante (genérico)
 * Reutilizable para admin, director o empresa (según controladores)
 */
export const actualizarVacante = async (
  vacanteId: number,
  data: Partial<{
    titulo: string;
    descripcion: string;
    area: string;
    modalidad?: "PRESENCIAL" | "REMOTO" | "HIBRIDO";
    habilidadesBlandas?: string;
    habilidadesTecnicas?: string;
    estado?: EstadoGeneral;
    empresaId?: number; // solo lo usarán admin/director
    directorValidaId?: number;
  }>
) => {
  // Verificar existencia
  const vacante = await prisma.vacante.findUnique({ where: { id: vacanteId } });
  if (!vacante) throw new Error("Vacante no encontrada.");

  // Si se envía empresaId, validar que exista
  if (data.empresaId) {
    const empresa = await prisma.empresa.findUnique({ where: { id: data.empresaId } });
    if (!empresa) throw new Error("La empresa especificada no existe.");
  }

  // Si se envía directorValidaId, validar que exista
  if (data.directorValidaId) {
    const director = await prisma.director.findUnique({ where: { id: data.directorValidaId } });
    if (!director) throw new Error("Director no encontrado.");
  }

  const vacanteActualizada = await prisma.vacante.update({
    where: { id: vacanteId },
    data: {
      ...data,
      habilidadesBlandas: data.habilidadesBlandas ?? vacante.habilidadesBlandas,
      habilidadesTecnicas: data.habilidadesTecnicas ?? vacante.habilidadesTecnicas,
    },
    include: {
      empresa: {
        select: {
          id: true,
          usuario: { select: { nombre: true, email: true } },
        },
      },
      directorValida: {
        select: {
          id: true,
          usuario: { select: { nombre: true, email: true } },
        },
      },
    },
  });

  return vacanteActualizada;
};



export const listarVacantesEmpresaService = async ({ companyId, page, limit, titulo, estado, area, requisitos }: {
  companyId: number;
  page: number;
  limit: number;
  titulo?: string;
  estado?: EstadoGeneral;
  area?: string;
  requisitos?: string;
}) => {
  const skip = (page - 1) * limit;

  const where: Prisma.VacanteWhereInput = {
    empresaId: companyId,
    ...(titulo && { titulo: { contains: titulo, mode: Prisma.QueryMode.insensitive } }),
    ...(estado && { estado }),
    ...(area && { area: { contains: area, mode: Prisma.QueryMode.insensitive } }),
    ...(requisitos && { requisitos: { contains: requisitos, mode: Prisma.QueryMode.insensitive } }),
  };

  const [data, total] = await Promise.all([
    prisma.vacante.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nit: true,
            usuario: { select: { nombre: true, email: true } },
          },
        },
      },
      orderBy: { creadaEn: "desc" },
      skip,
      take: limit,
    }),
    prisma.vacante.count({ where }),
  ]);

  return { data, total, page, pageSize: limit };
};
