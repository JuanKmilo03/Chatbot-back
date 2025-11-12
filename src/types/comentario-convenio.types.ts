/**
 * Tipos para el sistema de comentarios en convenios
 * Similar a un sistema de issues/foros donde directores y empresas pueden comentar
 */

export interface CrearComentarioDTO {
  convenioId: number;
  autorId: number;
  autorRol: 'EMPRESA' | 'DIRECTOR';
  contenido: string;
}

export interface ActualizarComentarioDTO {
  contenido: string;
}

export interface ComentarioConvenioResponse {
  id: number;
  convenioId: number;
  autorId: number;
  autorRol: 'EMPRESA' | 'DIRECTOR';
  autorNombre: string; // Nombre del autor obtenido de Usuario
  contenido: string;
  editado: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface ObtenerComentariosQuery {
  page?: number;
  limit?: number;
  ordenar?: 'ASC' | 'DESC'; // Por fecha de creación
}

export interface ResultadoPaginadoComentarios {
  data: ComentarioConvenioResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
