import { Router } from "express";
import {
  subirDocumento,
  listarDocumentos,
  obtenerDocumentoPorId,
  actualizarDocumento,
  eliminarDocumento,
} from "../controllers/documento.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documentos
 *   description: Gestión de documentos por parte de directores
 */

/**
 * @swagger
 * /api/documentos:
 *   get:
 *     summary: Obtiene todos los documentos con paginación
 *     description: Lista todos los documentos disponibles con soporte de paginación
 *     tags: [Documentos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de documentos por página
 *     responses:
 *       200:
 *         description: Lista de documentos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get("/", listarDocumentos);

/**
 * @swagger
 * /api/documentos/{id}:
 *   get:
 *     summary: Obtiene un documento específico por ID
 *     description: Retorna los detalles de un documento incluyendo información del director
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento obtenido correctamente
 *       404:
 *         description: Documento no encontrado
 */
router.get("/:id", obtenerDocumentoPorId);

/**
 * @swagger
 * /api/documentos:
 *   post:
 *     summary: Sube un nuevo documento
 *     description: Permite a los directores subir documentos (solo DIRECTOR)
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - archivo
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Manual de prácticas"
 *               descripcion:
 *                 type: string
 *                 example: "Documento con instrucciones para las prácticas"
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (PDF, DOC, DOCX, etc.)
 *     responses:
 *       201:
 *         description: Documento subido correctamente
 *       400:
 *         description: Datos faltantes o inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo directores pueden subir documentos
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("DIRECTOR"),
  upload.single("archivo"),
  subirDocumento
);

/**
 * @swagger
 * /api/documentos/{id}:
 *   put:
 *     summary: Actualiza un documento existente
 *     description: Permite actualizar el título, descripción y opcionalmente el archivo
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documento actualizado correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permiso para actualizar este documento
 *       404:
 *         description: Documento no encontrado
 */
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("DIRECTOR"),
  upload.single("archivo"),
  actualizarDocumento
);

/**
 * @swagger
 * /api/documentos/{id}:
 *   delete:
 *     summary: Elimina un documento
 *     description: Elimina permanentemente un documento (solo el director propietario)
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento a eliminar
 *     responses:
 *       200:
 *         description: Documento eliminado correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permiso para eliminar este documento
 *       404:
 *         description: Documento no encontrado
 */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("DIRECTOR"),
  eliminarDocumento
);

export default router;
