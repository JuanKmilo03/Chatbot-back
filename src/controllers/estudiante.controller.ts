import { Request, Response } from 'express';
import { EstudianteExcelService, EstudianteService } from "../services/estudiante.service.js";
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import cloudinary from '../config/cloudinary.config.js';
import multer from 'multer';

const estudianteExcelService = new EstudianteExcelService();
const prisma = new PrismaClient();

const storage = multer.memoryStorage();
export const upload = multer({ storage });


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
      codigoEstudiante: est.codigo,
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

    const estudiantesFormateados = estudiantes.map((est) => ({
      id: est.id,
      nombre: est.usuario.nombre,
      email: est.usuario.email,
      codigoEstudiante: est.codigo,
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


export const estudianteController = {

  crear: async (req: Request, res: Response) => {
    try {
      const { nombre, email, password, perfil, habilidadesTecnicas, habilidadesBlandas } = req.body;

      const estudiante = await EstudianteService.crear({
        nombre,
        email,
        password,
        perfil,
        habilidadesTecnicas,
        habilidadesBlandas
      });

      return res.status(201).json({
        message: "Estudiante creado exitosamente",
        data: estudiante,
      });
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('ya está registrado')) {
        return res.status(409).json({ message: "Correo institucional ya registrado" });
      }
      return res.status(500).json({ message: "Error creando estudiante", error: error.message });
    }
  },

  subirHojaDeVida: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "Archivo no proporcionado" });
      }

      // Subir a Cloudinary
      const result = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "hojas_de_vida_est" },
        async (error, result) => {
          if (error || !result) {
            console.error(error);
            return res.status(500).json({ message: "Error subiendo archivo", error });
          }

          // Guardar URL en Prisma
          const estudianteActualizado = await EstudianteService.subirHojaDeVida(
            Number(id),
            result.secure_url
          );

          return res.status(200).json({
            message: "Hoja de vida subida correctamente",
            data: estudianteActualizado
          });
        }
      );

      // Pasar el buffer del archivo al stream de Cloudinary
      if (req.file.buffer) {
        const stream = result as unknown as any;
        stream.end(req.file.buffer);
      }

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error procesando archivo", error: error.message });
    }
  },

  actualizarPerfilCompleto: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { perfil, habilidadesTecnicas, habilidadesBlandas } = req.body;

      let hojaDeVidaUrl: string | undefined = undefined;

      // Si envían archivo, subir a Cloudinary
      if (req.file?.buffer) {
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "hojas_de_vida" },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve({ secure_url: result.secure_url });
            }
          );
          stream.end(req.file?.buffer);
        });

        hojaDeVidaUrl = uploadResult.secure_url;
      }

      // Preparar datos para actualizar
      const dataToUpdate: any = {};
      if (perfil) dataToUpdate.perfil = perfil;
      if (habilidadesTecnicas) dataToUpdate.habilidadesTecnicas = habilidadesTecnicas;
      if (habilidadesBlandas) dataToUpdate.habilidadesBlandas = habilidadesBlandas;
      if (hojaDeVidaUrl) dataToUpdate.hojaDeVidaUrl = hojaDeVidaUrl;

      const estudianteActualizado = await EstudianteService.actualizar(Number(id), dataToUpdate);

      return res.status(200).json({
        message: "Perfil actualizado correctamente",
        data: estudianteActualizado
      });

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error actualizando perfil", error: error.message });
    }
  },

  /**
   * Listar estudiantes con paginación
   * @route GET /api/estudiantes
   * @access Director | Admin
   */
  obtenerTodos: async (req: Request, res: Response) => {
    try {
      const { skip, take } = req.query;

      // Obtener todos los estudiantes
      const estudiantes = await EstudianteService.obtenerTodos();

      // Implementar paginación manualmente
      const startIndex = Number(skip) || 0;
      const pageSize = Number(take) || 10;
      const paginatedEstudiantes = estudiantes.slice(startIndex, startIndex + pageSize);

      return res.status(200).json({
        message: "Estudiantes obtenidos correctamente",
        data: paginatedEstudiantes,
        total: estudiantes.length,
        page: Math.floor(startIndex / pageSize) + 1,
        pageSize: pageSize,
        totalPages: Math.ceil(estudiantes.length / pageSize)
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: "Error obteniendo estudiantes",
        error: error.message,
        data: null
      });
    }
  },

  /**
   * Obtener un estudiante por ID
   * @route GET /api/estudiantes/:id
   * @access Director | Admin | Estudiante (propio)
   */
  obtenerPorId: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "ID de estudiante inválido" });
      }

      const estudiante = await EstudianteService.obtenerPorId(Number(id));

      return res.status(200).json({
        message: "Estudiante obtenido correctamente",
        data: estudiante
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Estudiante no encontrado') {
        return res.status(404).json({ message: "Estudiante no encontrado" });
      }
      return res.status(500).json({
        message: "Error obteniendo estudiante",
        error: error.message,
        data: null
      });
    }
  },

  /**
   * Obtener la información del estudiante autenticado
   * @route GET /api/estudiantes/me
   * @access Estudiante
   */
  obtenerMiPerfil: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const estudiante = await EstudianteService.obtenerPorUsuarioId(userId);

      return res.status(200).json({
        message: "Perfil obtenido correctamente",
        data: estudiante
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Estudiante no encontrado') {
        return res.status(404).json({ message: "Estudiante no encontrado", data: null });
      }
      return res.status(500).json({
        message: "Error obteniendo perfil",
        error: error.message,
        data: null
      });
    }
  },

  /**
   * Actualizar estudiante
   * @route PUT /api/estudiantes/:id
   * @access Director | Admin | Estudiante (propio)
   */
  actualizar: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Si es estudiante, validar que solo pueda editar su propio perfil
      if (req.user?.rol === "ESTUDIANTE") {
        const estudiante = await EstudianteService.obtenerPorUsuarioId(req.user.id);
        if (estudiante.id !== Number(id)) {
          return res.status(403).json({
            message: "No puedes actualizar este estudiante",
            data: null
          });
        }
      }

      const estudianteActualizado = await EstudianteService.actualizar(Number(id), data);

      return res.status(200).json({
        message: "Estudiante actualizado correctamente",
        data: estudianteActualizado,
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Estudiante no encontrado') {
        return res.status(404).json({ message: "Estudiante no encontrado" });
      }
      if (error.message.includes('email ya está en uso')) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Error actualizando estudiante",
        data: null
      });
    }
  },

  completarPerfil: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Usuario no autenticado",
          data: null
        });
      }

      // Solo puede actualizar su propio perfil
      const estudiante = await EstudianteService.obtenerPorUsuarioId(userId);
      if (estudiante.id !== Number(id)) {
        return res.status(403).json({
          message: "No puedes actualizar este perfil",
          data: null
        });
      }

      const estudianteActualizado = await EstudianteService.actualizar(Number(id), req.body);

      return res.status(200).json({
        message: "Perfil completado correctamente",
        data: estudianteActualizado,
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Estudiante no encontrado') {
        return res.status(404).json({ message: "Estudiante no encontrado" });
      }
      return res.status(500).json({
        message: "Error completando perfil",
        data: null
      });
    }
  },

  /**
   * Eliminar estudiante permanentemente
   * @route DELETE /api/estudiantes/:id
   * @access Director | Admin
   */
  eliminar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await EstudianteService.eliminar(Number(id));

      return res.status(200).json({
        message: result.message,
        data: null
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Estudiante no encontrado') {
        return res.status(404).json({ message: "Estudiante no encontrado" });
      }
      return res.status(500).json({
        message: "Error eliminando estudiante",
        data: null
      });
    }
  },

  desactivar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Usar el método actualizar para marcar como inactivo
      const estudianteActualizado = await EstudianteService.actualizar(Number(id), {
        activo: false
      });

      return res.status(200).json({
        message: "Estudiante desactivado correctamente",
        data: estudianteActualizado,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: "Error desactivando estudiante",
        data: null
      });
    }
  },

  reactivar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const estudianteActualizado = await EstudianteService.actualizar(Number(id), {
        activo: true
      });

      return res.status(200).json({
        message: "Estudiante reactivado correctamente",
        data: estudianteActualizado,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: "Error reactivando estudiante",
        data: null
      });
    }
  },
};