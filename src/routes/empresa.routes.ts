import { Router } from "express";
import {
  registrarEmpresa,
  loginEmpresa,
  obtenerEmpresasPendientes,
  actualizarEstadoEmpresa,
} from "../controllers/empresa.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: Gestión de registro, login y aprobación de empresas
 */

/**
 * @swagger
 * /api/empresas/registro:
 *   post:
 *     summary: Registrar nueva empresa
 *     description: Permite a una empresa registrarse en el sistema. La empresa queda en estado PENDIENTE hasta que un Director/Admin la apruebe.
 *     tags: [Empresas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *               - nit
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre o razón social de la empresa
 *                 example: Tech Solutions SAS
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de contacto de la empresa
 *                 example: contacto@techsolutions.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña para acceso (mínimo 6 caracteres)
 *                 example: Password123!
 *               nit:
 *                 type: string
 *                 description: NIT de la empresa (solo números)
 *                 example: "900123456"
 *               telefono:
 *                 type: string
 *                 description: Teléfono de contacto
 *                 example: "3001234567"
 *               direccion:
 *                 type: string
 *                 description: Dirección física de la empresa
 *                 example: Calle 100 #20-30, Bogotá
 *               sector:
 *                 type: string
 *                 description: Sector empresarial
 *                 example: Tecnología
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la empresa
 *                 example: Empresa dedicada al desarrollo de software empresarial
 *     responses:
 *       201:
 *         description: Empresa registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Empresa registrada correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     usuarioId:
 *                       type: integer
 *                       example: 5
 *                     nit:
 *                       type: string
 *                       example: "900123456"
 *                     telefono:
 *                       type: string
 *                       example: "3001234567"
 *                     direccion:
 *                       type: string
 *                       example: Calle 100 #20-30, Bogotá
 *                     sector:
 *                       type: string
 *                       example: Tecnología
 *                     descripcion:
 *                       type: string
 *                       example: Empresa de desarrollo de software
 *                     estado:
 *                       type: string
 *                       enum: [PENDIENTE, APROBADA, RECHAZADA]
 *                       example: PENDIENTE
 *                     directorId:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *       400:
 *         description: Datos inválidos o email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ya existe un usuario registrado con este correo
 *       500:
 *         description: Error interno del servidor
 */
router.post("/registro", registrarEmpresa);

/**
 * @swagger
 * /api/empresas/login:
 *   post:
 *     summary: Login de empresa
 *     description: Autentica una empresa con email y contraseña, devuelve un token JWT válido por 7 días
 *     tags: [Empresas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de la empresa
 *                 example: contacto@techsolutions.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña de la empresa
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT válido por 7 días
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiRU1QUkVTQSIsImlhdCI6MTYxNjIzOTAyMn0.Xm5ZqY5fJ_9J0X
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               usuarioNoEncontrado:
 *                 value:
 *                   error: Usuario no encontrado
 *               passwordIncorrecta:
 *                 value:
 *                   error: Contraseña incorrecta
 *       500:
 *         description: Error interno del servidor
 */
router.post("/login", loginEmpresa);

/**
 * @swagger
 * /api/empresas:
 *   get:
 *     summary: Listar empresas pendientes (Director/Admin)
 *     description: Obtiene todas las empresas con estado PENDIENTE. Requiere autenticación y rol de DIRECTOR o ADMIN.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas pendientes
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
 *                   usuarioId:
 *                     type: integer
 *                     example: 5
 *                   nit:
 *                     type: string
 *                     example: "900123456"
 *                   telefono:
 *                     type: string
 *                     example: "3001234567"
 *                   direccion:
 *                     type: string
 *                     example: Calle 100 #20-30, Bogotá
 *                   sector:
 *                     type: string
 *                     example: Tecnología
 *                   descripcion:
 *                     type: string
 *                     example: Empresa de desarrollo de software
 *                   estado:
 *                     type: string
 *                     enum: [PENDIENTE, APROBADA, RECHAZADA]
 *                     example: PENDIENTE
 *                   directorId:
 *                     type: integer
 *                     nullable: true
 *                     example: null
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-12T10:30:00.000Z"
 *                   usuario:
 *                     type: object
 *                     properties:
 *                       nombre:
 *                         type: string
 *                         example: Tech Solutions SAS
 *                       email:
 *                         type: string
 *                         example: contacto@techsolutions.com
 *       401:
 *         description: No autenticado - Token faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Token no proporcionado o inválido
 *       403:
 *         description: Sin permisos suficientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No tienes permisos para realizar esta acción
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al listar empresas
 */
router.get("/", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), obtenerEmpresasPendientes);

/**
 * @swagger
 * /api/empresas/{id}/estado:
 *   patch:
 *     summary: Actualizar estado de empresa (Director/Admin)
 *     description: Permite aprobar o rechazar una solicitud de empresa. Requiere autenticación y rol de DIRECTOR o ADMIN.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [PENDIENTE, APROBADA, RECHAZADA]
 *                 description: Nuevo estado de la empresa
 *                 example: APROBADA
 *           examples:
 *             aprobar:
 *               summary: Aprobar empresa
 *               value:
 *                 estado: APROBADA
 *             rechazar:
 *               summary: Rechazar empresa
 *               value:
 *                 estado: RECHAZADA
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Estado de empresa actualizado
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     usuarioId:
 *                       type: integer
 *                       example: 5
 *                     nit:
 *                       type: string
 *                       example: "900123456"
 *                     telefono:
 *                       type: string
 *                       example: "3001234567"
 *                     direccion:
 *                       type: string
 *                       example: Calle 100 #20-30, Bogotá
 *                     sector:
 *                       type: string
 *                       example: Tecnología
 *                     descripcion:
 *                       type: string
 *                       example: Empresa de desarrollo de software
 *                     estado:
 *                       type: string
 *                       enum: [PENDIENTE, APROBADA, RECHAZADA]
 *                       example: APROBADA
 *                     directorId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-12T10:30:00.000Z"
 *       400:
 *         description: Datos inválidos o estado incorrecto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Estado inválido
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Token no proporcionado o inválido
 *       403:
 *         description: Sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No tienes permisos para realizar esta acción
 *       404:
 *         description: Empresa no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Empresa no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch("/:id/estado", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), actualizarEstadoEmpresa);

export default router;