import { Request, Response } from 'express';
import { EstudianteService } from "../services/estudiante.service.js";

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
