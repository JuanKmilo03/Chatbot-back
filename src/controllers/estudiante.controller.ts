import { Request, Response } from 'express';
import { EstudianteExcelService, EstudianteService } from "../services/estudiante.service.js";
import { PrismaClient } from '@prisma/client';

const estudianteExcelService = new EstudianteExcelService();
const prisma = new PrismaClient();


export const listarEstudiantesIndependiente = async (req: Request, res: Response) => {
  try {
    console.log('📋 Listando estudiantes con método independiente...');
    
    const estudiantes = await prisma.estudiante.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            creadoEn: true
          }
        },
        empresa: {
          include: {
            usuario: {
              select: {
                nombre: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      }
    });

    // Formatear respuesta
    const estudiantesFormateados = estudiantes.map(est => ({
      id: est.id,
      nombre: est.usuario.nombre,
      email: est.usuario.email,
      codigoEstudiante: est.codigoEstudiante,
      telefono: est.telefono,
      programaAcademico: est.programaAcademico,
      semestre: est.semestre,
      empresa: est.empresa ? est.empresa.usuario.nombre : est.empresaAsignada,
      estadoProceso: est.estadoProceso,
      empresaId: est.empresa?.id,
      fechaRegistro: est.usuario.creadoEn
    }));

    console.log(`✅ Encontrados ${estudiantesFormateados.length} estudiantes`);
    res.json(estudiantesFormateados);

  } catch (error: any) {
    console.error('❌ Error en listado independiente:', error);
    res.status(500).json({ 
      error: 'Error listando estudiantes',
      detalles: error.message 
    });
  }
};

export const cargarEstudiantesExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    console.log('Archivo recibido:', {
      nombre: req.file.originalname,
      tamaño: req.file.size,
      mimetype: req.file.mimetype
    });

    const resultado = await estudianteExcelService.procesarArchivoEstudiantes(
      req.file.buffer,
      req.file.originalname  // Pasar el nombre completo
    );

    res.json({
      mensaje: 'Archivo procesado correctamente',
      ...resultado
    });

  } catch (error: any) {
    console.error('Error en controlador:', error);
    res.status(500).json({ 
      error: 'Error procesando archivo',
      detalles: error.message 
    });
  }
};

export const listarEstudiantesPractica = async (req: Request, res: Response) => {
  try {
    const estudiantes = await estudianteExcelService.listarEstudiantesEnPractica();
    
    // Formatear respuesta
    const estudiantesFormateados = estudiantes.map(est => ({
      id: est.id,
      nombre: est.usuario.nombre,
      email: est.usuario.email,
      codigoEstudiante: est.codigoEstudiante,
      telefono: est.telefono,
      programaAcademico: est.programaAcademico,
      semestre: est.semestre,
      empresa: est.empresa ? est.empresa.usuario.nombre : est.empresaAsignada,
      estadoProceso: est.estadoProceso,
      empresaId: est.empresa?.id,
      practicas: est.practicas,
      fechaRegistro: est.usuario.creadoEn
    }));

    res.json(estudiantesFormateados);

  } catch (error: any) {
    res.status(500).json({ 
      error: 'Error listando estudiantes',
      detalles: error.message 
    });
  }
};

export class EstudianteController {
  static async crear(req: Request, res: Response) {
    try {
      const estudiante = await EstudianteService.crear(req.body);
      res.status(201).json(estudiante);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async obtenerTodos(_req: Request, res: Response) {
    try {
      const estudiantes = await EstudianteService.obtenerTodos();
      res.json(estudiantes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async obtenerPorId(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const estudiante = await EstudianteService.obtenerPorId(id);
      res.json(estudiante);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  static async actualizar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const estudiante = await EstudianteService.actualizar(id, req.body);
      res.json(estudiante);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async softDelete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await EstudianteService.softDelete(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
