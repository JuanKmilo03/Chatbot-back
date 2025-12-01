import { EstadoPostulacion } from '@prisma/client';

export interface CrearPostulacionDTO {
  estudianteId: number;
  vacanteId: number;
  comentario?: string;
}

export interface FiltrosPostulacion {
  estado?: EstadoPostulacion;
  estudiante?: string;
  vacante?: string;
  fechaPostula?: Date;
  page?: number;
  limit?: number;
}

export interface ResultadoPaginado<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const POSTULACION_INCLUDE = {
  estudiante: {
    include: {
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
    },
  },
  vacante: {
    include: {
      empresa: {
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true },
          },
        },
      },
    },
  },
} as const;

export const POSTULACION_ESTUDIANTE_INCLUDE = {
  vacante: {
    include: {
      empresa: {
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true },
          },
        },
      },
    },
  },
} as const;

export const POSTULACION_EMPRESA_INCLUDE = {
  estudiante: {
    include: {
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
    },
  },
  vacante: {
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      area: true,
      modalidad: true,
    },
  },
} as const;
