/**
 * Tipos y enumeraciones para el sistema de notificaciones
 */

/**
 * Tipos de notificaciones disponibles en el sistema
 */
export enum TipoNotificacion {
  CONVENIO_PROXIMO_VENCER = 'CONVENIO_PROXIMO_VENCER',
  CONVENIO_VENCIDO = 'CONVENIO_VENCIDO',
  NUEVA_SOLICITUD_VACANTE = 'NUEVA_SOLICITUD_VACANTE',
  VACANTE_APROBADA = 'VACANTE_APROBADA',
  VACANTE_RECHAZADA = 'VACANTE_RECHAZADA',
}

/**
 * Prioridad de la notificación
 */
export enum PrioridadNotificacion {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

/**
 * Estructura base de una notificación
 */
export interface NotificacionBase {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
  destinatarioId: number;
  destinatarioRol: 'DIRECTOR' | 'EMPRESA' | 'ESTUDIANTE';
  leida?: boolean;
  creadaEn?: Date;
}

/**
 * Notificación de convenio próximo a vencer
 */
export interface NotificacionConvenioVencimiento extends NotificacionBase {
  tipo: TipoNotificacion.CONVENIO_PROXIMO_VENCER | TipoNotificacion.CONVENIO_VENCIDO;
  data: {
    convenioId: number;
    nombreConvenio: string;
    empresaNombre: string;
    empresaId: number;
    fechaVencimiento: Date;
    diasRestantes: number;
  };
}

/**
 * Notificación de nueva solicitud de vacante
 */
export interface NotificacionNuevaVacante extends NotificacionBase {
  tipo: TipoNotificacion.NUEVA_SOLICITUD_VACANTE;
  data: {
    vacanteId: number;
    tituloVacante: string;
    empresaNombre: string;
    empresaId: number;
    area: string;
    modalidad: string;
  };
}

/**
 * Notificación de cambio de estado de vacante
 */
export interface NotificacionEstadoVacante extends NotificacionBase {
  tipo: TipoNotificacion.VACANTE_APROBADA | TipoNotificacion.VACANTE_RECHAZADA;
  data: {
    vacanteId: number;
    tituloVacante: string;
    motivoRechazo?: string;
  };
}

/**
 * Tipo unión de todas las notificaciones
 */
export type Notificacion =
  | NotificacionConvenioVencimiento
  | NotificacionNuevaVacante
  | NotificacionEstadoVacante;

/**
 * DTO para crear una notificación
 */
export interface CrearNotificacionDTO {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
  destinatarioId: number;
  destinatarioRol: 'DIRECTOR' | 'EMPRESA' | 'ESTUDIANTE';
  data: Record<string, any>;
}

/**
 * Filtros para consultar notificaciones
 */
export interface FiltrosNotificacion {
  destinatarioId?: number;
  tipo?: TipoNotificacion;
  leida?: boolean;
  prioridad?: PrioridadNotificacion;
  fechaDesde?: Date;
  fechaHasta?: Date;
  page?: number;
  limit?: number;
}

/**
 * Configuración para el chequeo de convenios próximos a vencer
 */
export interface ConfiguracionVencimiento {
  diasAdvertenciaUrgente: number; // Días para notificación urgente (ej: 7 días)
  diasAdvertenciaAlta: number;    // Días para notificación alta (ej: 15 días)
  diasAdvertenciaMedia: number;   // Días para notificación media (ej: 30 días)
}

/**
 * Respuesta paginada de notificaciones
 */
export interface ResultadoPaginadoNotificaciones {
  data: Notificacion[];
  total: number;
  noLeidas: number;
  page: number;
  limit: number;
  totalPages: number;
}
