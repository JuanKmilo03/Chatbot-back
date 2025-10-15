import express from "express";
import multer from "multer";
import {
  subirDocumento,
  listarDocumentos,
  obtenerDocumentoPorId,
  actualizarDocumento,
  eliminarDocumento,
} from "../controllers/documento.controller.js";
import { authFirebase, AuthenticatedRequest } from "../middlewares/authFirebase.js";
import { Rol } from "@prisma/client";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

function requireRole(roles: Rol[]) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
    }
    next();
  };
}

router.post(
  "/subir",
  authFirebase,
  requireRole([Rol.DIRECTOR, Rol.ADMIN]),
  upload.single("archivo"),
  subirDocumento
);

router.get("/", listarDocumentos);

router.get("/:id", obtenerDocumentoPorId);

router.put(
  "/:id",
  authFirebase,
  requireRole([Rol.DIRECTOR, Rol.ADMIN]),
  upload.single("archivo"),
  actualizarDocumento
);

router.delete(
  "/:id",
  authFirebase,
  requireRole([Rol.ADMIN]),
  eliminarDocumento
);

export default router;
