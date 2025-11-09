import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { authFirebase } from "../middlewares/authFirebase.js";
import multer from "multer";
import fs from "fs";

import {
  solicitarConvenio,
  listarConveniosEmpresa,
  obtenerConvenioPorId,
  actualizarConvenio,
  eliminarConvenio,
  listarConveniosPorDirector,
  listarConveniosVigentes,
  listarConveniosPendientes,
  aceptarConvenio,
  rechazarConvenio,
  marcarConvenioCancelado,
  iniciarConvenio,
  listarTodosLosConvenios,
  listarConveniosPorEmpresaId,
} from "../controllers/convenio.controller.js";
import cloudinary from "../config/cloudinary.config.js";
import { authorizeRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Convenios
 *   description: Gestión de convenios entre empresas, directores y estudiantes
 */

router.post("/solicitar", authFirebase, upload.single("archivo"), solicitarConvenio);
router.put("/:id", authFirebase, upload.single("archivo"), actualizarConvenio);
router.delete("/:id", authFirebase, eliminarConvenio);
router.get("/director/:directorId", authFirebase, listarConveniosPorDirector);
router.get("/vigentes/mios", authFirebase, listarConveniosVigentes);
router.get("/:directorId/conveniospend", authFirebase, listarConveniosPendientes);
router.put("/convenios/:convenioId/aceptar", authFirebase, aceptarConvenio);
router.put("/convenios/:convenioId/rechazar", authFirebase, rechazarConvenio);
router.put("/convenios/:convenioId/vencido", authFirebase, marcarConvenioCancelado);

//pa probar sin auth
router.post("/prueba/subida", upload.single("archivo"), async (req: Request, res: Response) => {
  try {
    const archivo = req.file;
    if (!archivo) return res.status(400).json({ message: "Se debe subir un archivo" });

    // Subida a Cloudinary (soporta PDF, Word e imágenes)
    const result = await cloudinary.uploader.upload(archivo.path, {
      folder: "ConveniosPracticas",
      resource_type: "auto", // permite PDF, Word, imágenes
    });

    // Eliminar archivo temporal
    fs.unlinkSync(archivo.path);

    res.status(200).json({
      message: "Archivo subido correctamente a Cloudinary",
      url: result.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al subir archivo", error });
  }
});
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
