import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { estudianteService } from "../services/estudiante.service.js";


export const estudianteController = {
  crear: async (req: Request, res: Response) => {
    try {
      const { nombre, email, codigo, cedula } = req.body;

      if (!nombre || !email || !codigo || !cedula) {
        return res.status(400).json({ message: "Nombre, correo, código y cédula son obligatorios" });
      }

      const estudiantesExistentes = await estudianteService.findMany({
        OR: [
          { usuario: { email } },
          { codigo },
          { cedula },
        ],
      });
      if (estudiantesExistentes.length > 0) {
        return res.status(409).json({ message: "Correo institucional ya registrado" });
      }

      const estudiante = await estudianteService.create({
        usuario: { create: { nombre, email, rol: "ESTUDIANTE" } },
        codigo, 
        cedula,
        perfilCompleto: false,
        activo: true,
      });

      return res.status(201).json({
        message: "Estudiante creado exitosamente",
        data: estudiante,
      });
    } catch (error: any) {
      console.error(error);
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Correo institucional ya registrado" });
      }
      return res.status(500).json({ message: "Error creando estudiante", error: error.message, data: null });
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

      const estudiantes = await estudianteService.getAll({
        skip: Number(skip) || 0,
        take: Number(take) || 10,
      });

      return res.status(200).json({
        message: "Estudiantes obtenidos correctamente",
        data: estudiantes,
        total: estudiantes.length,
        page: Number(skip) / (Number(take) || 10) + 1,
        pageSize: Number(take) || 10,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error obteniendo estudiantes", error: error.message, data: null });
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
      const estudiante = await estudianteService.getById(Number(id));

      if (!estudiante) {
        return res.status(404).json({ message: "Estudiante no encontrado" });
      }

      return res.status(200).json({ message: "Estudiante obtenido correctamente", data: estudiante });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error obteniendo estudiante", error: error.message, data: null });
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

      const estudiantes = await estudianteService.findMany({
        usuarioId: userId
      });

      if (estudiantes.length === 0) {
        return res.status(404).json({ message: "Estudiante no encontrado", data: null });
      }

      return res.status(200).json({ message: "Perfil obtenido correctamente", data: estudiantes[0] });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error obteniendo perfil", error: error.message, data: null });
    }
  },
  /**
 * Soft delete de estudiante (marcar como inactivo)
 * @route PATCH /api/estudiantes/:id/desactivar
 * @access Director | Admin
 */
  desactivar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const estudiante = await estudianteService.softDelete(Number(id));

      return res.status(200).json({
        message: "Estudiante desactivado correctamente",
        data: estudiante,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error desactivando estudiante", data: null });
    }
  },

  /**
   * Reactivar estudiante previamente inactivo
   * @route PATCH /api/estudiantes/:id/activar
   * @access Director | Admin
   */
  reactivar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const estudiante = await estudianteService.reactivate(Number(id));

      return res.status(200).json({
        message: "Estudiante reactivado correctamente",
        data: estudiante,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error reactivando estudiante", data: null });
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
        const estudiante = await estudianteService.findMany({ usuarioId: req.user.id });
        if (!estudiante.length || estudiante[0].id !== Number(id)) {
          return res.status(403).json({ message: "No puedes actualizar este estudiante", data: null });
        }
      }

      const estudianteActualizado = await estudianteService.update(Number(id), data);

      return res.status(200).json({
        message: "Estudiante actualizado correctamente",
        data: estudianteActualizado,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error actualizando estudiante", data: null });
    }
  },

  completarPerfil: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado", data: null });
      }

      // Solo puede actualizar su propio perfil
      const estudiantes = await estudianteService.findMany({ usuarioId: userId });
      if (!estudiantes.length || estudiantes[0].id !== Number(id)) {
        return res.status(403).json({ message: "No puedes actualizar este perfil", data: null });
      }

      const data = { ...req.body, perfilCompleto: true };
      const estudianteActualizado = await estudianteService.update(Number(id), data);

      return res.status(200).json({
        message: "Perfil completado correctamente",
        data: estudianteActualizado,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Error completando perfil", data: null });
    }
  },
}