import express from "express";
import multer from "multer";
import {
  listarConveniosEmpresa,
  obtenerConvenioPorId,
  rechazarConvenio,
  iniciarConvenio,
  listarTodosLosConvenios,
  listarConveniosPorEmpresaId,
  enviarRevisionFinal,
  subirConvenioFirmado,
  aprobarConvenio,
} from "../controllers/convenio.controller.js";
import { authorizeRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Convenios
 *   description: Gestión de convenios empresariales
 */

/**
 * @swagger
 * /api/convenios/iniciar:
 *   post:
 *     summary: Iniciar un convenio
 *     description: Permite a la empresa crear un convenio inicial. No requiere director asignado.
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Convenio creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Convenio iniciado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Convenio'
 *       404:
 *         description: Empresa no encontrada
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado (solo empresas)
 */
router.post('/iniciar', verifyToken, authorizeRoles('EMPRESA'), iniciarConvenio);

router.post("/:id/subir-firmado", verifyToken, authorizeRoles("EMPRESA"), upload.single("file"), subirConvenioFirmado);

router.post("/:id/enviar-revision", verifyToken, authorizeRoles("EMPRESA"), enviarRevisionFinal);

/**
 * @swagger
 * /api/convenios/{id}/aprobar:
 *   post:
 *     summary: Aprobar un convenio
 *     description: Permite a la directora aprobar un convenio subiendo el documento final firmado y completando la información correspondiente.
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del convenio a aprobar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               fechaInicio:
 *                 type: string
 *                 example: "2025-01-15"
 *               fechaFin:
 *                 type: string
 *                 example: "2026-01-15"
 *               observaciones:
 *                 type: string
 *                 example: "Convenio firmado por ambas partes"
 *     responses:
 *       200:
 *         description: Convenio aprobado correctamente
 *       400:
 *         description: Error de validación o archivo faltante
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Solo puede aprobarlo un director
 */
router.post("/:id/aprobar", verifyToken, authorizeRoles("DIRECTOR"), upload.single("file"), aprobarConvenio);

/**
 * @swagger
 * /api/convenios/{id}/rechazar:
 *   post:
 *     summary: Rechazar un convenio
 *     description: Permite al director rechazar un convenio en revisión agregando una observación opcional.
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del convenio a rechazar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observaciones:
 *                 type: string
 *                 example: "El documento no cumple con los requisitos"
 *     responses:
 *       200:
 *         description: Convenio rechazado correctamente
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Solo puede rechazarlo un director
 */
router.post("/:id/rechazar", verifyToken, authorizeRoles("DIRECTOR"), rechazarConvenio);

/**
 * @swagger
 * /api/convenios/:
 *   get:
 *     summary: Listar todos los convenios (Director/Admin)
 *     description: Admin y Director pueden obtener todos los convenios existentes.
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los convenios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 convenios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Convenio'
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado (solo director o admin)
 */
router.get("/", verifyToken, authorizeRoles('DIRECTOR', 'ADMIN'), listarTodosLosConvenios);

router.get(
  "/empresa/:empresaId",
  verifyToken,
  authorizeRoles('DIRECTOR', 'ADMIN'),
  listarConveniosPorEmpresaId
);

/**
 * @swagger
 * /api/convenios/me:
 *   get:
 *     summary: Listar convenios de la empresa logueada
 *     description: La empresa obtiene todos sus convenios ordenados por fecha de creación descendente.
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de convenios de la empresa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Convenio'
 *       404:
 *         description: Empresa no encontrada
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado (solo empresas)
 */
router.get("/me", verifyToken, authorizeRoles('EMPRESA'), listarConveniosEmpresa);
/**
 * @swagger
 * /api/convenios/{id}:
 *   get:
 *     summary: Obtener un convenio específico
 *     description: Devuelve toda la información del convenio, incluyendo empresa, director, revisiones, documentos y vacantes.
 *     tags: [Convenios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del convenio
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Convenio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Convenio'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Convenio no encontrado o acceso denegado
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso denegado (empresa intentando ver convenio de otra empresa)
 */
router.get("/:id", verifyToken, authorizeRoles('EMPRESA', 'DIRECTOR', 'ADMIN'), obtenerConvenioPorId);


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Empresa:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         usuarioId:
 *           type: integer
 *           example: 5
 *         nit:
 *           type: string
 *           example: "900123456"
 *         nombre:
 *           type: string
 *           example: "Empresa Ejemplo"
 *         telefono:
 *           type: string
 *           example: "3001234567"
 *         direccion:
 *           type: string
 *           example: "Calle 123 #45-67"
 *     Convenio:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         empresaId:
 *           type: integer
 *           example: 1
 *         directorId:
 *           type: integer
 *           nullable: true
 *         nombre:
 *           type: string
 *           example: "Convenio inicial"
 *         tipo:
 *           type: string
 *           enum: [MACRO, ESPECIFICO]
 *           example: "MACRO"
 *         estado:
 *           type: string
 *           enum: [EN_REVISION, APROBADO, RECHAZADO, VENCIDO]
 *           example: "EN_REVISION"
 *         version:
 *           type: integer
 *           example: 1
 *         archivoUrl:
 *           type: string
 *           nullable: true
 *           example: null
 *         creadoEn:
 *           type: string
 *           format: date-time
 *           example: "2025-11-09T12:00:00.000Z"
 *         actualizadoEn:
 *           type: string
 *           format: date-time
 *           example: "2025-11-09T12:30:00.000Z"
 */
export default router;
