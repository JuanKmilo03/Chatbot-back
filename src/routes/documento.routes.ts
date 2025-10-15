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

// ✅ Middleware auxiliar para verificar roles
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

// 📁 Subir un documento (solo DIRECTOR o ADMIN)
router.post(
  "/",
  authFirebase,
  requireRole([Rol.DIRECTOR, Rol.ADMIN]),
  upload.single("archivo"),
  subirDocumento
);

// 📄 Listar todos los documentos (público)
router.get("/", listarDocumentos);

// 🔍 Obtener documento por ID (público)
router.get("/:id", obtenerDocumentoPorId);

// ✏️ Actualizar documento (solo DIRECTOR o ADMIN)
router.put(
  "/:id",
  authFirebase,
  requireRole([Rol.DIRECTOR, Rol.ADMIN]),
  upload.single("archivo"),
  actualizarDocumento
);

// 🗑️ Eliminar documento (solo ADMIN)
router.delete(
  "/:id",
  authFirebase,
  requireRole([Rol.ADMIN]),
  eliminarDocumento
);

export default router;
