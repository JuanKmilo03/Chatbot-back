import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { authFirebase } from "../middlewares/authFirebase.js";
import multer from "multer";
import fs from "fs";

import {
  solicitarConvenio,
  listarConvenios,
  obtenerConvenioPorId,
  actualizarConvenio,
  eliminarConvenio,
  listarConveniosPorDirector,
  listarConveniosVigentes,
  listarConveniosPendientes,
  aceptarConvenio,
  rechazarConvenio,
  marcarConvenioCancelado,
} from "../controllers/convenio.controller.js";
import cloudinary from "../config/cloudinary.config.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Convenios
 *   description: Gestión de convenios entre empresas, directores y estudiantes
 */

router.get("/", authFirebase, listarConvenios);
router.get("/:id", authFirebase, obtenerConvenioPorId);
router.post("/solicitar", authFirebase, upload.single("archivo"), solicitarConvenio);
router.put("/:id", authFirebase, upload.single("archivo"), actualizarConvenio);
router.delete("/:id", authFirebase, eliminarConvenio);
router.get("/director/:directorId", authFirebase, listarConveniosPorDirector);
router.get("/vigentes/mios", authFirebase, listarConveniosVigentes);
router.get("/:directorId/conveniospend", authFirebase, listarConveniosPendientes);
router.put("/convenios/:convenioId/aceptar", authFirebase, aceptarConvenio);
router.put("/convenios/:convenioId/rechazar", authFirebase, rechazarConvenio);
router.put("/convenios/:convenioId/vencido", authFirebase, marcarConvenioCancelado);

//pa probar sin auth
router.post("/prueba/subida", upload.single("archivo"), async (req: Request, res: Response) => {
  try {
    const archivo = req.file;
    if (!archivo) return res.status(400).json({ message: "Se debe subir un archivo" });

    // Subida a Cloudinary (soporta PDF, Word e imágenes)
    const result = await cloudinary.uploader.upload(archivo.path, {
      folder: "ConveniosPracticas",
      resource_type: "auto", // permite PDF, Word, imágenes
    });

    // Eliminar archivo temporal
    fs.unlinkSync(archivo.path);

    res.status(200).json({
      message: "Archivo subido correctamente a Cloudinary",
      url: result.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al subir archivo", error });
  }
});

export default router;
