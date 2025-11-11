import express from "express";
import multer from "multer";
import {
  subirDocumento,
  listarDocumentos,
  obtenerDocumentoPorId,
  actualizarDocumento,
  eliminarDocumento,
  obtenerPlantillaConvenio,
} from "../controllers/documento.controller.js";
import { Rol } from "@prisma/client";
import { authorizeRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/subir",
  verifyToken,
  authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
  upload.single("archivo"),
  subirDocumento
);

router.get("/", listarDocumentos);

router.get("/convenio", verifyToken, authorizeRoles('EMPRESA', 'DIRECTOR'), obtenerPlantillaConvenio);

router.get("/:id", obtenerDocumentoPorId);

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
