import { Router } from "express";
import { 
  obtenerCronogramasPorPrograma, 
  obtenerCronogramaActivo,
  crearCronograma 
} from "../controllers/cronograma.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.js";
import { Rol } from "@prisma/client";

const router = Router();

router.use(verifyToken);

router.get("/programa/:programaId", obtenerCronogramasPorPrograma);
router.get("/programa/:programaId/activo", obtenerCronogramaActivo);
router.post("/", authorizeRoles(Rol.DIRECTOR, Rol.ADMIN), upload.single('archivo'), crearCronograma);

export default router;