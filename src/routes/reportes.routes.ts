import { Router } from "express";
import { ReporteController } from "../controllers/reportes.controller.js";
import { authorizeRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /reportes/resumen
router.get("/resumen", verifyToken, authorizeRoles("DIRECTOR"), ReporteController.resumen);

export default router;
