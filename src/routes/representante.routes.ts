// src/routes/representante.routes.ts
import express from "express";
import { actualizarRepresentante } from "../controllers/representante.controller.js";
import { authFirebase } from "../middlewares/authFirebase.js";
import { authorizeRole } from "../middlewares/authorizeRoles.js";
import { Rol } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * /api/representantes/{id}:
 *   put:
 *     summary: Actualizar datos del representante legal (solo empresa propietaria o director asignado)
 *     tags: [Representantes Legales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreCompleto:
 *                 type: string
 *               tipoDocumento:
 *                 type: string
 *               numeroDocumento:
 *                 type: string
 *               cargo:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Representante legal actualizado exitosamente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Representante legal no encontrado
 */
router.put(
  "/:id",
  authFirebase,
  authorizeRole([Rol.EMPRESA, Rol.DIRECTOR]),
  actualizarRepresentante
);

export default router;
