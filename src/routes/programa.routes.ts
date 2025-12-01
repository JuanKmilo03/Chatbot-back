import { Router } from "express";
import {
    crearProgramaController,
    obtenerProgramasController,
    obtenerProgramaPorIdController,
    actualizarProgramaController,
    eliminarProgramaController,
    listarProgramasSelectController,
} from "../controllers/programa.controller.js";

import { authorizeRoles, verifyToken } from "../middlewares/auth.middleware.js";
import { Rol } from "@prisma/client";

const router = Router();

// Solo ADMIN puede gestionar programas
router.post("/", verifyToken, authorizeRoles(Rol.ADMIN), crearProgramaController);
router.get("/", verifyToken, authorizeRoles(Rol.ADMIN), obtenerProgramasController);
router.get("/:id", verifyToken, authorizeRoles(Rol.ADMIN), obtenerProgramaPorIdController);
router.put("/:id", verifyToken, authorizeRoles(Rol.ADMIN), actualizarProgramaController);
router.delete("/:id", verifyToken, authorizeRoles(Rol.ADMIN), eliminarProgramaController);

router.get("/list/select", listarProgramasSelectController);


export default router;
