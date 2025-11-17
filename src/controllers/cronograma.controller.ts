import { Request, Response } from 'express';
import { CronogramaService } from '../services/cronograma.service.js';
import { CloudinaryService } from '../config/cloudinary.config.js';
import { TipoActividad } from '@prisma/client';


export const obtenerCronogramasPorPrograma = async (req: Request, res: Response) => {
  try {
    const { programaId } = req.params;

    if (!programaId || isNaN(Number(programaId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de programa inválido'
      });
    }

    const resultado = await CronogramaService.obtenerPorPrograma(Number(programaId));

    res.json({
      success: true,
      data: resultado
    });
  } catch (error: any) {
    console.error('Error al obtener cronogramas:', error);
    
    if (error.message === 'Programa no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener los cronogramas'
    });
  }
};

export const obtenerCronogramaActivo = async (req: Request, res: Response) => {
  try {
    const { programaId } = req.params;

    if (!programaId || isNaN(Number(programaId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de programa inválido'
      });
    }

    const cronograma = await CronogramaService.obtenerActivo(Number(programaId));

    res.json({
      success: true,
      data: cronograma
    });
  } catch (error: any) {
    console.error('Error al obtener cronograma activo:', error);
    
    if (error.message === 'Programa no encontrado' || error.message === 'No hay cronograma activo para este programa') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener el cronograma activo'
    });
  }
};

export const crearCronograma = async (req: Request, res: Response) => {
  try {
    const { programaId, directorId, titulo, descripcion, semestre, actividades } = req.body;

    // Validaciones básicas (sin archivoUrl)
    if (!programaId || !directorId || !titulo || !semestre || !actividades) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: programaId, directorId, titulo, semestre, actividades'
      });
    }

    // Validar que actividades es un array
    if (!Array.isArray(actividades) || actividades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos una actividad'
      });
    }

    // Validar tipos de actividad
    const tiposValidos = Object.values(TipoActividad);
    const actividadesInvalidas = actividades.filter(act => !tiposValidos.includes(act.tipo));
    
    if (actividadesInvalidas.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Tipos de actividad inválidos: ${actividadesInvalidas.map(a => a.tipo).join(', ')}. Tipos válidos: ${tiposValidos.join(', ')}`
      });
    }

      let archivoUrl = '';
    let archivoInfo = null;

    if (req.file) {
      try {
        const uploadResult = await CloudinaryService.uploadFile(
          req.file, 
          `cronogramas/programa-${programaId}`
        );
        archivoUrl = uploadResult.url;
        archivoInfo = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          format: uploadResult.format,
          size: uploadResult.size
        };
      } catch (uploadError) {
        console.error('Error subiendo archivo a Cloudinary:', uploadError);
      }
    }

    const cronograma = await CronogramaService.crear({
      programaId: Number(programaId),
      directorId: Number(directorId),
      titulo,
      descripcion,
      semestre,
      archivoUrl,
      actividades: actividades.map(act => ({
        ...act,
        fechaInicio: new Date(act.fechaInicio),
        fechaFin: new Date(act.fechaFin),
        tipo: act.tipo as TipoActividad
      }))
    });

    // ✅ SOLUCIÓN MÁS SIMPLE - Respuesta separada
    res.status(201).json({
      success: true,
      message: 'Cronograma creado exitosamente',
      data: {
        cronograma: cronograma, // El objeto completo de Prisma
        archivoInfo: archivoInfo // Info del archivo como propiedad separada
      }
    });

  } catch (error: any) {
    console.error('Error al crear cronograma:', error);
    
    if (error.message.includes('no pertenece') || error.message.includes('ya existe')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear el cronograma'
    });
  }
};