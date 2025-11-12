/**
 * Servicio de verificación de vencimiento de convenios
 * Ejecuta periódicamente para notificar sobre convenios próximos a vencer
 */

import { prisma } from '../config/db.js';
import {
  notificarATodosLosDirectores,
  crearNotificacion,
} from './notificacion.service.js';
import {
  TipoNotificacion,
  PrioridadNotificacion,
  ConfiguracionVencimiento,
} from '../types/notificacion.types.js';

/**
 * Configuración por defecto de días de advertencia
 */
const CONFIG_DEFAULT: ConfiguracionVencimiento = {
  diasAdvertenciaUrgente: 7,  // 7 días = Urgente
  diasAdvertenciaAlta: 15,     // 15 días = Alta
  diasAdvertenciaMedia: 30,    // 30 días = Media
};

/**
 * Verifica todos los convenios aprobados y notifica los que están próximos a vencer
 * Esta función debe ejecutarse periódicamente (ej: diariamente)
 */
export const verificarConveniosProximosAVencer = async (
  config: ConfiguracionVencimiento = CONFIG_DEFAULT
): Promise<{
  verificados: number;
  notificados: number;
  vencidos: number;
}> => {
  try {
    console.log('🔍 Iniciando verificación de convenios próximos a vencer...');

    const ahora = new Date();

    // Obtener convenios APROBADOS con fecha de fin definida
    const convenios = await prisma.convenio.findMany({
      where: {
        estado: 'APROBADO',
        fechaFin: {
          not: null,
        },
      },
      include: {
        empresa: {
          include: {
            usuario: {
              select: { nombre: true },
            },
          },
        },
        director: true,
      },
    });

    let notificadosCount = 0;
    let vencidosCount = 0;

    // Procesar cada convenio
    for (const convenio of convenios) {
      if (!convenio.fechaFin) continue;

      const fechaVencimiento = new Date(convenio.fechaFin);
      const diasRestantes = calcularDiasRestantes(ahora, fechaVencimiento);

      // Si ya venció, actualizar estado y notificar
      if (diasRestantes < 0) {
        await manejarConvenioVencido(convenio);
        vencidosCount++;
        continue;
      }

      // Verificar si debe notificarse según los días restantes
      const debeNotificar = await verificarSiDebeNotificar(
        convenio.id,
        diasRestantes,
        config
      );

      if (debeNotificar) {
        await notificarConvenioProximoVencer(
          convenio,
          diasRestantes,
          obtenerPrioridad(diasRestantes, config)
        );
        notificadosCount++;
      }
    }

    console.log(`✅ Verificación completada: ${convenios.length} verificados, ${notificadosCount} notificados, ${vencidosCount} vencidos`);

    return {
      verificados: convenios.length,
      notificados: notificadosCount,
      vencidos: vencidosCount,
    };
  } catch (error) {
    console.error('❌ Error en verificación de convenios:', error);
    throw error;
  }
};

/**
 * Calcula los días restantes entre dos fechas
 */
const calcularDiasRestantes = (fechaActual: Date, fechaVencimiento: Date): number => {
  const diferenciaMilisegundos = fechaVencimiento.getTime() - fechaActual.getTime();
  return Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
};

/**
 * Determina la prioridad de la notificación según días restantes
 */
const obtenerPrioridad = (
  diasRestantes: number,
  config: ConfiguracionVencimiento
): PrioridadNotificacion => {
  if (diasRestantes <= config.diasAdvertenciaUrgente) {
    return PrioridadNotificacion.URGENTE;
  }
  if (diasRestantes <= config.diasAdvertenciaAlta) {
    return PrioridadNotificacion.ALTA;
  }
  if (diasRestantes <= config.diasAdvertenciaMedia) {
    return PrioridadNotificacion.MEDIA;
  }
  return PrioridadNotificacion.BAJA;
};

/**
 * Verifica si debe enviarse una notificación para un convenio
 * Evita notificar múltiples veces en el mismo período
 */
const verificarSiDebeNotificar = async (
  convenioId: number,
  diasRestantes: number,
  config: ConfiguracionVencimiento
): Promise<boolean> => {
  // Verificar si ya se notificó hoy
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const notificacionExistente = await prisma.notificacion.findFirst({
    where: {
      tipo: TipoNotificacion.CONVENIO_PROXIMO_VENCER,
      creadaEn: {
        gte: hoy,
      },
      data: {
        path: ['convenioId'],
        equals: convenioId,
      },
    },
  });

  // Si ya existe notificación hoy, no notificar nuevamente
  if (notificacionExistente) {
    return false;
  }

  // Notificar en umbrales específicos
  const umbrales = [
    config.diasAdvertenciaMedia,
    config.diasAdvertenciaAlta,
    config.diasAdvertenciaUrgente,
    3, // 3 días
    1, // 1 día
  ];

  return umbrales.includes(diasRestantes);
};

/**
 * Envía notificaciones sobre un convenio próximo a vencer
 */
const notificarConvenioProximoVencer = async (
  convenio: any,
  diasRestantes: number,
  prioridad: PrioridadNotificacion
): Promise<void> => {
  const empresaNombre = convenio.empresa.usuario.nombre;
  const mensaje = diasRestantes === 1
    ? `El convenio "${convenio.nombre}" con la empresa ${empresaNombre} vence mañana.`
    : `El convenio "${convenio.nombre}" con la empresa ${empresaNombre} vence en ${diasRestantes} días.`;

  const data = {
    convenioId: convenio.id,
    nombreConvenio: convenio.nombre,
    nombreEmpresa: empresaNombre, // Para consistencia con plantillas SendGrid
    empresaNombre, // Mantener por compatibilidad
    empresaId: convenio.empresaId,
    fechaVencimiento: convenio.fechaFin,
    diasRestantes,
  };

  // Notificar a todos los directores
  await notificarATodosLosDirectores(
    TipoNotificacion.CONVENIO_PROXIMO_VENCER,
    `Convenio próximo a vencer`,
    mensaje,
    prioridad,
    data
  );

  // También notificar a la empresa
  await crearNotificacion({
    tipo: TipoNotificacion.CONVENIO_PROXIMO_VENCER,
    titulo: 'Convenio próximo a vencer',
    mensaje: `Su convenio "${convenio.nombre}" vence en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}. Por favor, gestione su renovación.`,
    prioridad,
    destinatarioId: convenio.empresaId,
    destinatarioRol: 'EMPRESA',
    data,
  });

  console.log(`📨 Notificación enviada: Convenio ${convenio.id} vence en ${diasRestantes} días (${prioridad})`);
};

/**
 * Maneja un convenio que ya venció
 * Actualiza su estado y envía notificaciones
 */
const manejarConvenioVencido = async (convenio: any): Promise<void> => {
  try {
    // Actualizar estado del convenio a VENCIDO
    await prisma.convenio.update({
      where: { id: convenio.id },
      data: { estado: 'VENCIDO' },
    });

    // Deshabilitar la empresa si era el único convenio activo
    const conveniosActivosEmpresa = await prisma.convenio.count({
      where: {
        empresaId: convenio.empresaId,
        estado: 'APROBADO',
      },
    });

    if (conveniosActivosEmpresa === 0) {
      await prisma.empresa.update({
        where: { id: convenio.empresaId },
        data: { habilitada: false },
      });
    }

    const empresaNombre = convenio.empresa.usuario.nombre;

    // Notificar a directores
    await notificarATodosLosDirectores(
      TipoNotificacion.CONVENIO_VENCIDO,
      'Convenio vencido',
      `El convenio "${convenio.nombre}" con la empresa ${empresaNombre} ha vencido.`,
      PrioridadNotificacion.ALTA,
      {
        convenioId: convenio.id,
        nombreConvenio: convenio.nombre,
        nombreEmpresa: empresaNombre, // Para consistencia con plantillas SendGrid
        empresaNombre, // Mantener por compatibilidad
        empresaId: convenio.empresaId,
        fechaVencimiento: convenio.fechaFin,
        diasRestantes: 0,
      }
    );

    // Notificar a la empresa
    await crearNotificacion({
      tipo: TipoNotificacion.CONVENIO_VENCIDO,
      titulo: 'Convenio vencido',
      mensaje: `Su convenio "${convenio.nombre}" ha vencido. Por favor, contacte con la dirección del programa para renovarlo.`,
      prioridad: PrioridadNotificacion.ALTA,
      destinatarioId: convenio.empresaId,
      destinatarioRol: 'EMPRESA',
      data: {
        convenioId: convenio.id,
        nombreConvenio: convenio.nombre,
        fechaVencimiento: convenio.fechaFin,
      },
    });

    console.log(`⚠️ Convenio ${convenio.id} marcado como VENCIDO`);
  } catch (error) {
    console.error(`Error al manejar convenio vencido ${convenio.id}:`, error);
  }
};

/**
 * Función auxiliar para iniciar el scheduler
 * Ejecuta la verificación inmediatamente y luego cada 24 horas
 */
export const iniciarSchedulerConvenios = (
  config?: ConfiguracionVencimiento
): NodeJS.Timeout => {
  console.log('🚀 Iniciando scheduler de verificación de convenios...');

  // Ejecutar inmediatamente
  verificarConveniosProximosAVencer(config).catch(console.error);

  // Ejecutar cada 24 horas (86400000 ms)
  const intervalo = setInterval(() => {
    verificarConveniosProximosAVencer(config).catch(console.error);
  }, 24 * 60 * 60 * 1000);

  console.log('✅ Scheduler iniciado: verificación cada 24 horas');

  return intervalo;
};

/**
 * Detiene el scheduler
 */
export const detenerSchedulerConvenios = (intervalo: NodeJS.Timeout): void => {
  clearInterval(intervalo);
  console.log('🛑 Scheduler de convenios detenido');
};
