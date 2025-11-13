import { Router } from "express";
import { obtenerCronogramasPorPrograma } from "../controllers/cronograma.controller.js";

const router = Router();

router.get("/programa/:programaId", obtenerCronogramasPorPrograma);

export default router;
