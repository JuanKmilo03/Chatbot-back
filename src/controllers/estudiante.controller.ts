import { Request, Response } from 'express';
import { EstudianteExcelService, EstudianteService } from "../services/estudiante.service.js";
import { EstadoPostulacion, Prisma, PrismaClient, Rol, TipoDocumento } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { leerCSV, leerExcel } from '../utils/fileParse.js';
import path from 'path';
import multer from 'multer';
import { documentoService } from '../services/documento.service.js';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary.config.js';

const estudianteExcelService = new EstudianteExcelService();
const prisma = new PrismaClient();

export const subirHojaVida = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    const [estudiante] = await EstudianteService.findMany({ usuarioId });
    if (!estudiante) return res.status(401).json({ error: "Estudiante no existe " });

    if (!req.file) return res.status(400).json({ error: "Debe subir un archivo" });

    const resultado = await prisma.$transaction(async (tx) => {
      const documento = await documentoService.subirDocumento(
        req.file!,
        {
          titulo: "Hoja de Vida",
          categoria: TipoDocumento.HOJA_DE_VIDA,
          estudiante: { connect: { id: estudiante.id } },
          nombreArchivo: req.file!.originalname,
          archivoUrl: ""
        },
        `Estudiantes/${estudiante.id}`,
        tx
      );

      const estudianteActualizado = await EstudianteService.actualizar(
        estudiante.id,
        { hojaDeVidaUrl: documento.archivoUrl },
        tx
      );

      return { documento, estudianteActualizado };
    });

    return res.status(200).json({
      message: "Hoja de vida subida correctamente",
      data: {
        hojaVidaUrl: resultado.estudianteActualizado.hojaDeVidaUrl,
        documentoId: resultado.documento.id
      }
    });
  } catch (error: any) {
    console.error("Error subir hoja de vida:", error);
    return res.status(500).json({ error: error.message });
  }
}

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
    if (usuario.estudiante.hojaDeVidaUrl) {
      try {
        await deleteFromCloudinary(usuario.estudiante.hojaDeVidaUrl);
      } catch (error) {
        console.warn('No se pudo eliminar la hoja de vida anterior:', error);
      }
    }

    // Actualizar la URL en la base de datos
    const estudianteActualizado = await prisma.estudiante.update({
      where: { id: usuario.estudiante.id },
      data: {
        hojaDeVidaUrl: uploadResult.secure_url
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
        hojaVidaUrl: estudianteActualizado.hojaDeVidaUrl,
        estudiante: {
          id: estudianteActualizado.id,
          nombres: estudianteActualizado.usuario.nombre,
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

type EstudianteRowRaw = {
  nombre: string;
  email: string;
  codigo: string;
  documento: string;
  activo?: string | boolean;
};
type EstudianteRow = {
  nombre: string;
  email: string;
  codigo: string;
  documento: string;
  activo?: boolean;
};
export const cargarMasivo = async (req: AuthRequest, res: Response) => {
  try {
    const directorId = req.user?.id;
    const archivo = req.file;

    if (!archivo) {
      return res.status(400).json({ message: "No se subió archivo" });
    }

    const ext = path.extname(archivo.originalname).toLowerCase();

    let rowsRaw: EstudianteRowRaw[];

    if (ext === ".csv") {
      rowsRaw = await leerCSV<EstudianteRowRaw>(archivo);
    } else if (ext === ".xlsx" || ext === ".xls") {
      rowsRaw = leerExcel<EstudianteRowRaw>(archivo);
    } else {
      return res.status(400).json({ message: "Formato no soportado" });
    }

    // Convertir strings a boolean y asignar el tipo correcto
    const rows: EstudianteRow[] = rowsRaw.map((r) => ({
      ...r,
      codigo: String(r.codigo).trim(),
      documento: String(r.documento).trim(),
      activo: ["true", "1", true].includes(r.activo as any),
    }));

    const resultado = await EstudianteService.cargarMasivo(rows, directorId!);

    return res.json({
      message: "Cargue masivo procesado",
      resultados: resultado,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error procesando el archivo" });
  }
};

export const cargarEstudiantesExcel = async (req: AuthRequest, res: Response) => {
  try {
    const directorId = req.user?.id;
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
      req.file.originalname,  // Pasar el nombre completo
      directorId!
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

  crear: async (req: AuthRequest, res: Response) => {
    try {
      const directorId = req.user?.id;
      const { nombre, email, codigo, documento } = req.body;

      if (!nombre || !email || !documento || !codigo) {
        return res.status(400).json({ message: "Nombre, correo, documento y código son obligatorios" });
      }

      const estudiante = await EstudianteService.crear({
        nombre,
        email,
        codigo,
        documento
      }, directorId!);

      return res.status(201).json({
        message: "Estudiante creado exitosamente",
        data: estudiante,
      });
    } catch (error: any) {
      console.error(error);

      if (error.message.includes("ya está registrado")) {
        return res
          .status(409)
          .json({ message: "Correo institucional ya registrado" });
      }

      return res.status(500).json({
        message: "Error creando estudiante",
        error: error.message,
        data: null,
      });

    }
  },

  /**
   * Listar estudiantes con paginación
   * @route GET /api/estudiantes
   * @access Director | Admin
   */
  obtenerTodos: async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const {
        skip = "0",
        take = "10",
        nombre,
        codigo,
        documento,
        email,
        createdAt
      } = req.query;

      const filtros: Prisma.EstudianteWhereInput = {};
      const usuarioFilter: Prisma.UsuarioWhereInput = {};

      if (req.user?.rol === Rol.DIRECTOR) {
        const director = await prisma.director.findUnique({
          where: { usuarioId: req.user.id }
        });

        if (!director) {
          return res.status(404).json({ message: "Director no encontrado" });
        }

        filtros.programaId = director.programaId;
      }

      if (nombre) {
        usuarioFilter.nombre = {
          contains: nombre as string,
          mode: "insensitive",
        };
      }

      if (email) {
        usuarioFilter.email = {
          contains: email as string,
          mode: "insensitive",
        };
      }
      if (Object.keys(usuarioFilter).length > 0) {
        filtros.usuario = usuarioFilter;
      }

      if (codigo) {
        filtros.codigo = {
          contains: codigo as string,
          mode: "insensitive",
        };
      }

      if (documento) {
        filtros.documento = {
          contains: documento as string,
          mode: "insensitive",
        };
      }

      if (createdAt) {
        filtros.createdAt = {
          gte: new Date(createdAt as string),
        };
      }

      const { data, total } = await EstudianteService.findManyWithPagination({
        filtros,
        skip: Number(skip),
        take: Number(take),
      });

      return res.status(200).json({
        message: "Estudiantes obtenidos correctamente",
        data,
        total,
        pageSize: Number(take),
        page: Math.floor(Number(skip) / Number(take)) + 1,
        totalPages: Math.ceil(total / Number(take)),
      });

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: "Error obteniendo estudiantes",
        error: error.message,
        data: null,
      });
    }
  },

  obtenerParaVacante: async (
    req: AuthRequest,
    res: Response
  ) => {
    const { vacancyId } = req.params;

    try {
      const {
        skip = "0",
        take = "10",
        nombre,
        codigo,
        documento,
        email,
        createdAt
      } = req.query;

      const filtros: Prisma.EstudianteWhereInput = {};
      const usuarioFilter: Prisma.UsuarioWhereInput = {};

      if (req.user?.rol === Rol.DIRECTOR) {
        const director = await prisma.director.findUnique({
          where: { usuarioId: req.user.id }
        });

        if (!director) {
          return res.status(404).json({ message: "Director no encontrado" });
        }

        filtros.programaId = director.programaId;
      }

      if (nombre) { usuarioFilter.nombre = { contains: nombre as string, mode: "insensitive", }; }
      if (email) { usuarioFilter.email = { contains: email as string, mode: "insensitive", }; }
      if (Object.keys(usuarioFilter).length > 0) { filtros.usuario = usuarioFilter; }
      if (codigo) { filtros.codigo = { contains: codigo as string, mode: "insensitive", }; }
      if (documento) { filtros.documento = { contains: documento as string, mode: "insensitive", }; }
      if (createdAt) { filtros.createdAt = { gte: new Date(createdAt as string), }; }

      const estadosExcluir: EstadoPostulacion[] = ["EN_REVISION", "ACEPTADA", "RECHAZADA"];

      filtros.postulaciones = { none: { vacanteId: Number(vacancyId), estado: { in: estadosExcluir }, }, };

      const { data, total } = await EstudianteService.findManyWithPagination({
        filtros,
        skip: Number(skip),
        take: Number(take),
      });

      return res.status(200).json({
        message: "Estudiantes obtenidos correctamente",
        data,
        total,
        pageSize: Number(take),
        page: Math.floor(Number(skip) / Number(take)) + 1,
        totalPages: Math.ceil(total / Number(take)),
      });

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: "Error obteniendo estudiantes",
        error: error.message,
        data: null,
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

  /**
   * Subir hoja de vida automáticamente (obtiene ID desde JWT)
   * @route POST /api/estudiantes/me/upload-hoja-vida
   * @access Estudiante
   */
  subirMiHojaDeVida: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Usuario no autenticado",
          data: null
        });
      }

      // Obtener el estudiante desde el userId del JWT
      const estudiante = await EstudianteService.obtenerPorUsuarioId(userId);

      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({
          message: "Archivo requerido",
          details: "Debe subir un archivo PDF o Word"
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
          message: "Formato no válido",
          details: "Solo se permiten archivos PDF o Word (DOC, DOCX)"
        });
      }

      // Validar tamaño del archivo (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({
          message: "Archivo muy grande",
          details: "El tamaño máximo permitido es 5MB"
        });
      }

      // Subir a Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'hojas_vida',
        resource_type: 'auto',
        public_id: `hoja_vida_${estudiante.id}`
      });

      // Eliminar hoja de vida anterior si existe
      if (estudiante.hojaDeVidaUrl) {
        try {
          await deleteFromCloudinary(estudiante.hojaDeVidaUrl);
        } catch (error) {
          console.warn('No se pudo eliminar la hoja de vida anterior:', error);
        }
      }

      // Actualizar estudiante con la nueva URL
      const estudianteActualizado = await EstudianteService.actualizar(estudiante.id, {
        hojaDeVidaUrl: uploadResult.secure_url
      });

      return res.status(200).json({
        message: "Hoja de vida subida exitosamente",
        data: {
          hojaDeVidaUrl: estudianteActualizado.hojaDeVidaUrl,
          estudiante: {
            id: estudianteActualizado.id,
            nombre: estudianteActualizado.usuario?.nombre,
            semestre: estudianteActualizado.semestre
          },
          uploadedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Error al subir hoja de vida:', error);
      return res.status(500).json({
        message: "Error interno del servidor",
        details: error.message
      });
    }
  },

  /**
   * Subir hoja de vida con autenticación JWT
   * @route POST /api/estudiantes/:id/upload-hoja-vida
   * @access Estudiante (propio)
   */
  subirHojaDeVida: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Usuario no autenticado",
          data: null
        });
      }

      // Verificar que el estudiante solo puede subir su propia hoja de vida
      const estudiante = await EstudianteService.obtenerPorUsuarioId(userId);
      if (estudiante.id !== Number(id)) {
        return res.status(403).json({
          message: "No puedes subir hoja de vida para otro estudiante",
          data: null
        });
      }

      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({
          message: "Archivo requerido",
          details: "Debe subir un archivo PDF o Word"
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
          message: "Formato no válido",
          details: "Solo se permiten archivos PDF o Word (DOC, DOCX)"
        });
      }

      // Validar tamaño del archivo (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({
          message: "Archivo muy grande",
          details: "El tamaño máximo permitido es 5MB"
        });
      }

      // Subir a Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'hojas_vida',
        resource_type: 'auto',
        public_id: `hoja_vida_${estudiante.id}`
      });

      // Eliminar hoja de vida anterior si existe
      if (estudiante.hojaDeVidaUrl) {
        try {
          await deleteFromCloudinary(estudiante.hojaDeVidaUrl);
        } catch (error) {
          console.warn('No se pudo eliminar la hoja de vida anterior:', error);
        }
      }

      // Actualizar estudiante con la nueva URL
      const estudianteActualizado = await EstudianteService.actualizar(Number(id), {
        hojaDeVidaUrl: uploadResult.secure_url
      });

      return res.status(200).json({
        message: "Hoja de vida subida exitosamente",
        data: {
          hojaDeVidaUrl: estudianteActualizado.hojaDeVidaUrl,
          estudiante: {
            id: estudianteActualizado.id,
            nombre: estudianteActualizado.usuario?.nombre,
            semestre: estudianteActualizado.semestre
          },
          uploadedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Error al subir hoja de vida:', error);
      return res.status(500).json({
        message: "Error interno del servidor",
        details: error.message
      });
    }
  },
};