import { Router } from "express";
import {
  registrarEmpresa,
  loginEmpresa,
  obtenerEmpresasPendientes,
  actualizarEstadoEmpresa,
} from "../controllers/empresa.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Registro y login (sin token)
router.post("/registro", registrarEmpresa);
router.post("/login", loginEmpresa);

// Listar y aprobar empresas (solo DIRECTOR o ADMIN)
router.get("/", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), obtenerEmpresasPendientes);
router.patch("/:id/estado", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), actualizarEstadoEmpresa);

export default router;
