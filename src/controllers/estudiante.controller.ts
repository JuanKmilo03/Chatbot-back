import { Request, Response } from 'express';
import { EstudianteExcelService, EstudianteService } from "../services/estudiante.service.js";
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary.config.js';

const estudianteExcelService = new EstudianteExcelService();
const prisma = new PrismaClient();

export const uploadHojaVida = async (req: Request, res: Response) => {
  try {
    // Usar el email del token de Firebase
    const userEmail = (req as any).user.email;
    
    if (!userEmail) {
      return res.status(400).json({
        error: 'Email no disponible en el token'
      });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { email: userEmail },
      include: { estudiante: true }
    });

    if (!usuario || !usuario.estudiante) {
      return res.status(403).json({
        error: 'No autorizado',
        details: 'Solo los estudiantes pueden subir hojas de vida'
      });
    }

    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({
        error: 'Archivo requerido',
        details: 'Debe subir un archivo PDF o Word'
      });
    }

    // Validar tipo de archivo
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Formato no válido',
        details: 'Solo se permiten archivos PDF o Word (DOC, DOCX)'
      });
    }

    // Validar tamaño del archivo (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: 'Archivo muy grande',
        details: 'El tamaño máximo permitido es 5MB'
      });
    }

    // Subir a Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'hojas_vida',
      resource_type: 'auto',
      public_id: `hoja_vida_${usuario.estudiante.id}`
    });

    // Eliminar hoja de vida anterior si existe
    if (usuario.estudiante.hojaVidaArchivoUrl) {
      try {
        await deleteFromCloudinary(usuario.estudiante.hojaVidaArchivoUrl);
      } catch (error) {
        console.warn('No se pudo eliminar la hoja de vida anterior:', error);
      }
    }

    // Actualizar la URL en la base de datos
    const estudianteActualizado = await prisma.estudiante.update({
      where: { id: usuario.estudiante.id },
      data: {
        hojaVidaArchivoUrl: uploadResult.secure_url
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Hoja de vida subida exitosamente',
      data: {
        hojaVidaUrl: estudianteActualizado.hojaVidaArchivoUrl,
        estudiante: {
          id: estudianteActualizado.id,
          nombres: estudianteActualizado.usuario.nombre,
          programaAcademico: estudianteActualizado.programaAcademico,
          semestre: estudianteActualizado.semestre
        },
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error al subir hoja de vida:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

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
      const { nombre, email, password, habilidadesTecnicas, habilidadesBlandas, perfil } = req.body;

      if (!nombre || !email) {
        return res.status(400).json({ message: "Nombre y correo son obligatorios" });
      }

      // Crear estudiante usando el servicio
      const estudiante = await EstudianteService.crear({
        nombre,
        email,
        password,
        habilidadesTecnicas,
        habilidadesBlandas,
        perfil
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
      return res.status(500).json({
        message: "Error creando estudiante",
        error: error.message,
        data: null
      });
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