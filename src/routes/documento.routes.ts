import express from "express";
import multer from "multer";
import {
  subirDocumento,
  listarDocumentos,
  obtenerDocumentoPorId,
  actualizarDocumento,
  eliminarDocumento,
  obtenerPlantillaConvenio,
  obtenerDocumentosGenerales,
  obtenerDocumentosEmpresa,
  obtenerDocumentosEstudiante,
} from "../controllers/documento.controller.js";
import { Rol } from "@prisma/client";
import { authorizeRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/subir",
  verifyToken,
  authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
  upload.single("archivo"),
  subirDocumento
);

router.get("/",
  verifyToken,
  authorizeRoles('ADMIN', 'DIRECTOR'),
  listarDocumentos);

router.get("/publicos/generales", 
  obtenerDocumentosGenerales);

router.get("/empresa", 
  verifyToken, 
  authorizeRoles(Rol.EMPRESA), 
  obtenerDocumentosEmpresa);

router.get("/estudiante", 
  verifyToken, 
  authorizeRoles(Rol.ESTUDIANTE), 
  obtenerDocumentosEstudiante);

router.get("/convenio",
  verifyToken,
  authorizeRoles('ADMIN', 'DIRECTOR', Rol.EMPRESA),
  obtenerPlantillaConvenio);

router.get("/:id",
  obtenerDocumentoPorId);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
  upload.single("archivo"),
  actualizarDocumento
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
  eliminarDocumento
);



export default router;
