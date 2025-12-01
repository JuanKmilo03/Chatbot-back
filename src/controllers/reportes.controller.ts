import { Request, Response } from "express";
import { ReporteService } from "../services/reportes.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export class ReporteController {
  static async resumen(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user!.id;
      const data = await ReporteService.obtenerResumen(usuarioId);
      res.json({ success: true, data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error generando resumen" });
    }
  }
}
