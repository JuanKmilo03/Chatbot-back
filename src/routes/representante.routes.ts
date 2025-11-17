// src/routes/representante.routes.ts
import express from "express";
import {
  upsertRepresentante,
  getRepresentante,
  getRepresentanteByEmpresaId,
  getAllRepresentantes,
  deleteRepresentante,
} from "../controllers/representante.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/representante:
 *   post:
 *     summary: Crear o actualizar representante legal de la empresa autenticada
 *     tags: [Representantes Legales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombreCompleto
 *               - email
 *               - telefono
 *             properties:
 *               nombreCompleto:
 *                 type: string
 *                 example: "Juan Pérez García"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@empresa.com"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *     responses:
 *       200:
 *         description: Representante legal guardado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Empresa no encontrada
 */
router.post("/", verifyToken, authorizeRoles("EMPRESA"), upsertRepresentante);

/**
 * @swagger
 * /api/representante:
 *   get:
 *     summary: Obtener representante legal de la empresa autenticada
 *     tags: [Representantes Legales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Representante legal encontrado
 *       404:
 *         description: Representante legal no registrado
 */
router.get("/", verifyToken, authorizeRoles("EMPRESA"), getRepresentante);

/**
 * @swagger
 * /api/representante:
 *   delete:
 *     summary: Eliminar representante legal de la empresa autenticada
 *     tags: [Representantes Legales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Representante legal eliminado exitosamente
 *       404:
 *         description: Representante legal no encontrado
 */
router.delete("/", verifyToken, authorizeRoles("EMPRESA"), deleteRepresentante);

/**
 * @swagger
 * /api/representantes:
 *   get:
 *     summary: Listar todos los representantes legales (solo DIRECTOR/ADMIN)
 *     tags: [Representantes Legales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de representantes legales
 */
router.get("/all", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), getAllRepresentantes);

/**
 * @swagger
 * /api/representante/{empresaId}:
 *   get:
 *     summary: Obtener representante legal por ID de empresa (solo DIRECTOR/ADMIN)
 *     tags: [Representantes Legales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empresaId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Representante legal encontrado
 *       404:
 *         description: Representante legal no encontrado
 */
router.get("/:empresaId", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), getRepresentanteByEmpresaId);

export default router;
