import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authFirebase.js";
import { RepresentanteService } from "../services/representante.service.js";

/**
 * Actualizar datos del representante legal (Solo EMPRESA o DIRECTOR)
 */
export const actualizarRepresentante = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombreCompleto, tipoDocumento, numeroDocumento, cargo, telefono, email } = req.body;

    const representanteActualizado = await RepresentanteService.actualizarRepresentante(Number(id), {
      nombreCompleto,
      tipoDocumento,
      numeroDocumento,
      cargo,
      telefono,
      email,
    });

    res.status(200).json({
      message: "Representante legal actualizado exitosamente",
      representante: representanteActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar representante legal:", error);
    res.status(500).json({ message: error.message || "Error interno del servidor" });
  }
};
