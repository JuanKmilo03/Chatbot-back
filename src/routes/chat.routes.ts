import { Router } from "express";
import {
 enviarMensajeController,
  obtenerMensajesController, obtenerOCrearConversacionController,
  obtenerConversacionesController,
  obtenerConversacionPorIdController,
} from "../controllers/chat.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Sistema de mensajería entre empresas y directores con soporte para archivos
 */

/**
 * @swagger
 * /api/chat/conversaciones:
 *   get:
 *     summary: Obtiene todas las conversaciones del usuario autenticado
 *     description: Retorna la lista de conversaciones del usuario (empresa o director) con el último mensaje de cada una
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   empresaId:
 *                     type: integer
 *                     example: 5
 *                   directorId:
 *                     type: integer
 *                     example: 2
 *                   titulo:
 *                     type: string
 *                     example: "Conversación: Tech Solutions - Director Juan"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   empresa:
 *                     type: object
 *                   director:
 *                     type: object
 *                   mensajes:
 *                     type: array
 *                     description: Array con el último mensaje
 *       401:
 *         description: No autorizado
 */
router.get(
  "/conversaciones",
  verifyToken,
  authorizeRoles("EMPRESA", "DIRECTOR"),
  obtenerConversacionesController
);

/**
 * @swagger
 * /api/chat/conversacion:
 *   post:
 *     summary: Obtiene o crea una conversación entre empresa y director
 *     description: Busca una conversación existente o crea una nueva si no existe
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresaId
 *               - directorId
 *             properties:
 *               empresaId:
 *                 type: integer
 *                 example: 5
 *               directorId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Conversación obtenida o creada correctamente
 *       400:
 *         description: Parámetros faltantes o inválidos
 *       401:
 *         description: No autorizado
 */
router.post(
  "/conversacion",
  verifyToken,
  authorizeRoles("EMPRESA", "DIRECTOR"),
  obtenerOCrearConversacionController
);

/**
 * @swagger
 * /api/chat/conversacion/{conversacionId}:
 *   get:
 *     summary: Obtiene una conversación específica por ID
 *     description: Retorna los detalles de una conversación incluyendo información de empresa y director
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Conversación obtenida correctamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Conversación no encontrada
 */
router.get(
  "/conversacion/:conversacionId",
  verifyToken,
  authorizeRoles("EMPRESA", "DIRECTOR"),
  obtenerConversacionPorIdController
);

/**
 * @swagger
 * /api/chat/mensaje:
 *   post:
 *     summary: Envía un mensaje en una conversación
 *     description: Permite enviar un mensaje con contenido de texto y/o archivos adjuntos (máx 10 archivos de 10MB c/u)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - conversacionId
 *             properties:
 *               conversacionId:
 *                 type: integer
 *                 example: 1
 *               contenido:
 *                 type: string
 *                 example: "Adjunto el convenio firmado para su revisión"
 *               archivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos adjuntos (máximo 10 archivos)
 *     responses:
 *       201:
 *         description: Mensaje enviado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 conversacionId:
 *                   type: integer
 *                 remitenteId:
 *                   type: integer
 *                 remitenteRol:
 *                   type: string
 *                 contenido:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 archivos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombreArchivo:
 *                         type: string
 *                       archivoUrl:
 *                         type: string
 *                       mimeType:
 *                         type: string
 *                       fileSize:
 *                         type: integer
 *       400:
 *         description: Parámetros faltantes o sin permiso
 *       401:
 *         description: No autorizado
 */
router.post(
  "/mensaje",
  verifyToken,
  authorizeRoles("EMPRESA", "DIRECTOR"),
  upload.array("archivos", 10),
  enviarMensajeController
);

/**
 * @swagger
 * /api/chat/mensajes/{conversacionId}:
 *   get:
 *     summary: Obtiene los mensajes de una conversación
 *     description: Retorna los mensajes de una conversación con paginación
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conversación
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
 *           default: 50
 *         description: Cantidad de mensajes por página
 *     responses:
 *       200:
 *         description: Mensajes obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       conversacionId:
 *                         type: integer
 *                       remitenteId:
 *                         type: integer
 *                       remitenteRol:
 *                         type: string
 *                       contenido:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       archivos:
 *                         type: array
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Conversación no encontrada
 */
router.get(
  "/mensajes/:conversacionId",
  verifyToken,
  authorizeRoles("EMPRESA", "DIRECTOR"),
  obtenerMensajesController
);

export default router;
