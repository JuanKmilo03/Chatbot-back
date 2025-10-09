import { Router } from "express";
import {
  crearConvenio,
  listarConvenios,
  obtenerConvenioPorId,
  actualizarConvenio,
  eliminarConvenio,
  listarConveniosPorDirector,
  listarConveniosVigentes,
} from "../controllers/convenio.controller.js";

import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), crearConvenio);
router.get("/", verifyToken, authorizeRoles("ADMIN", "DIRECTOR", "EMPRESA"), listarConvenios);
router.get("/:id", verifyToken, authorizeRoles("ADMIN", "DIRECTOR", "EMPRESA"), obtenerConvenioPorId);
router.put("/:id", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), actualizarConvenio);
router.delete("/:id", verifyToken, authorizeRoles("ADMIN"), eliminarConvenio);
router.get("/director/:directorId", verifyToken, authorizeRoles("DIRECTOR"), listarConveniosPorDirector);
router.get("/vigentes/mios", verifyToken, authorizeRoles("DIRECTOR"), listarConveniosVigentes);

export default router;
