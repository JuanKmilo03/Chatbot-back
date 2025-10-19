import { Router } from "express";
import {
  registrarEmpresa,
  loginEmpresa,
  obtenerEmpresasPendientes,
  obtenerPerfilEmpresa,
  editarEmpresa,
  obtenerEmpresas,
  obtenerEmpresaPorId,
  aprobarEmpresa,
  rechazarEmpresa,
  toggleEstadoEmpresa,
  solicitarRecuperacionContrasenia,
  restablecerContrasenia,

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al registrar empresa
 */
router.post("/registro", registrarEmpresa);

/**
 * @swagger
 * /api/empresas/login:
 *   post:
 *     summary: Login de empresa
 *     description: Autentica una empresa usando NIT y contraseña. Devuelve un token JWT válido por 7 días si la empresa está aprobada.
 *     tags: [Empresas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nit
 *               - password
 *             properties:
 *               nit:
 *                 type: string
 *                 description: NIT de la empresa
 *                 example: "900123456"
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
 *                 message:
 *                   type: string
 *                   example: empresa logueada correctamente
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     nombre:
 *                       type: string
 *                       example: "Tech Solutions SAS"
 *                     email:
 *                       type: string
 *                       example: "contacto@techsolutions.com"
 *                     rol:
 *                       type: string
 *                       example: "EMPRESA"
 *                 token:
 *                   type: string
 *                   description: Token JWT válido por 7 días
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Datos inválidos o empresa no aprobada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Tu cuenta aún no ha sido aprobada o activada."
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Contraseña incorrecta"
 *       404:
 *         description: Empresa no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuario no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al procesar login"
 */

router.post("/login", loginEmpresa);

/**
 * @swagger
 * /api/empresas/pendientes:
 *   get:
 *     summary: Listar empresas pendientes (ADMIN)
 *     description: Obtiene todas las empresas con estado PENDIENTE. Requiere autenticación y rol ADMIN.
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
 *                     example: "Calle 100 #20-30, Bogotá"
 *                   sector:
 *                     type: string
 *                     example: "Tecnología"
 *                   descripcion:
 *                     type: string
 *                     example: "Empresa de desarrollo de software"
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
 *                         example: "Tech Solutions SAS"
 *                       email:
 *                         type: string
 *                         example: "contacto@techsolutions.com"
 *       401:
 *         description: No autenticado - Token faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token no proporcionado o inválido"
 *       403:
 *         description: Sin permisos suficientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No tienes permisos para realizar esta acción"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al listar empresas"
 */
router.get("/pendientes", verifyToken, authorizeRoles("DIRECTOR"), obtenerEmpresasPendientes);

/**
 * @swagger
 * /api/empresas:
 *   get:
 *     summary: Listar empresas  (Director/Admin)
 *     description: Obtiene todas las empresas cuyo estado no sea PENDIENTE. Requiere autenticación ADMIN.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas
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
router.get("/", verifyToken, authorizeRoles("DIRECTOR"), obtenerEmpresas)

/**
 * @swagger
 * /api/empresas/{id}:
 *   get:
 *     summary: Obtener empresa por ID (DIRECTOR)
 *     description: Obtiene la información de una empresa específica por su ID. Requiere autenticación y rol DIRECTOR.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la empresa
 *     responses:
 *       200:
 *         description: Empresa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 usuarioId:
 *                   type: integer
 *                   example: 5
 *                 nit:
 *                   type: string
 *                   example: "900123456"
 *                 telefono:
 *                   type: string
 *                   example: "3001234567"
 *                 direccion:
 *                   type: string
 *                   example: "Calle 100 #20-30, Bogotá"
 *                 sector:
 *                   type: string
 *                   example: "Tecnología"
 *                 descripcion:
 *                   type: string
 *                   example: "Empresa de desarrollo de software"
 *                 estado:
 *                   type: string
 *                   enum: [PENDIENTE, APROBADA, RECHAZADA]
 *                   example: APROBADA
 *                 directorId:
 *                   type: integer
 *                   nullable: true
 *                   example: 3
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-12T10:30:00.000Z"
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     nombre:
 *                       type: string
 *                       example: "Tech Solutions SAS"
 *                     email:
 *                       type: string
 *                       example: "contacto@techsolutions.com"
 *       401:
 *         description: No autenticado - Token faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token no proporcionado o inválido"
 *       403:
 *         description: Sin permisos suficientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No tienes permisos para realizar esta acción"
 *       404:
 *         description: Empresa no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Empresa no encontrada"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al obtener la información de la empresa"
 */
router.get("/:id", verifyToken, authorizeRoles("DIRECTOR"), obtenerEmpresaPorId)

/**
 * @swagger
 * /api/empresas/{id}/aprobar:
 *   patch:
 *     summary: Aprobar una empresa pendiente
 *     description: Cambia el estado de la empresa de PENDIENTE a APROBADA. Solo Admin o Director.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la empresa
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empresa aprobada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Empresa aprobada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Empresa'
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
 */
router.patch("/:id/aprobar", verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), aprobarEmpresa);

/**
 * @swagger
 * /api/empresas/{id}/rechazar:
 *   patch:
 *     summary: Rechazar una empresa pendiente
 *     description: Cambia el estado de la empresa de PENDIENTE a RECHAZADA. Solo Admin o Director.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la empresa
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empresa rechazada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Empresa rechazada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Empresa'
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
 */
router.patch("/:id/rechazar", verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), rechazarEmpresa);

/**
 * @swagger
 * /api/empresas/{id}/estado:
 *   patch:
 *     summary: Activar o desactivar una empresa aprobada
 *     description: Cambia el estado de una empresa aprobada entre APROBADA e INACTIVA. Solo Admin o Director.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la empresa
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [APROBADA, INACTIVA]
 *                 description: Nuevo estado de la empresa
 *                 example: INACTIVA
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
 *                   example: Estado actualizado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Empresa'
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
 */
router.patch("/:id/estado", verifyToken, authorizeRoles("ADMIN", "DIRECTOR"), toggleEstadoEmpresa)

/**
 * @swagger
 * /api/empresas/profile:
 *   get:
 *     summary: Obtener perfil de empresa autenticada
 *     description: Retorna la información de la empresa asociada al usuario autenticado mediante el token JWT.
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de la empresa obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 nit:
 *                   type: string
 *                   example: "901456789-1"
 *                 telefono:
 *                   type: string
 *                   example: "3109876543"
 *                 direccion:
 *                   type: string
 *                   example: "Calle 45 #23-10"
 *                 sector:
 *                   type: string
 *                   example: "Tecnología"
 *                 descripcion:
 *                   type: string
 *                   example: "Desarrollamos software de impacto."
 *                 estado:
 *                   type: string
 *                   enum: [PENDIENTE, APROBADA, RECHAZADA]
 *                   example: "APROBADA"
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     nombre:
 *                       type: string
 *                       example: "Wiedii Tech"
 *                     email:
 *                       type: string
 *                       example: "info@wiedii.com"
 *       401:
 *         description: Token faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token no proporcionado"
 *       403:
 *         description: Token expirado o rol no autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Acceso denegado: solo empresas pueden acceder"
 *       404:
 *         description: No se encontró la empresa asociada al usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontró información de la empresa"
 *       500:
 *         description: Error interno del servidor
 */
router.get("/profile", verifyToken, authorizeRoles("EMPRESA"), obtenerPerfilEmpresa);

/**
 * @swagger
 * /api/empresas/{id}/editar:
 *   put:
 *     summary: Editar una empresa
 *     description: >
 *       Actualiza los datos básicos de una empresa existente.  
 *       Solo se pueden modificar los campos de información general:  
 *       **nombre, email, teléfono, dirección, sector, descripción**.  
 *       Campos como **NIT** o **estado** no pueden modificarse con este endpoint.
 *     tags:
 *       - Empresas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la empresa que se desea actualizar
 *         schema:
 *           type: integer
 *           example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: EMSITEL S.A.S.
 *               email:
 *                 type: string
 *                 example: contacto@emsitel.co
 *               telefono:
 *                 type: string
 *                 example: "3214567890"
 *               direccion:
 *                 type: string
 *                 example: "Cra 15 #20-33"
 *               sector:
 *                 type: string
 *                 example: Tecnología
 *               descripcion:
 *                 type: string
 *                 example: Empresa líder en soluciones IoT e infraestructura.
 *     responses:
 *       200:
 *         description: Empresa actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Empresa actualizada correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     nit:
 *                       type: string
 *                       example: "900999123"
 *                     telefono:
 *                       type: string
 *                       example: "3214567890"
 *                     direccion:
 *                       type: string
 *                       example: "Cra 15 #20-33"
 *                     sector:
 *                       type: string
 *                       example: "Tecnología"
 *                     descripcion:
 *                       type: string
 *                       example: Empresa líder en soluciones IoT e infraestructura.
 *                     estado:
 *                       type: string
 *                       enum: [PENDIENTE, APROBADA, RECHAZADA]
 *                       example: APROBADA
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 12
 *                         nombre:
 *                           type: string
 *                           example: Empresa de servicios.
 *                         email:
 *                           type: string
 *                           example: contacto@gmail.com
 *       400:
 *         description: Error en los datos enviados o conflicto (por ejemplo, correo ya registrado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ya existe un usuario registrado con este correo
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor
 */
router.put("/:id/editar", editarEmpresa);

/**
 * @swagger
 * /auth/recuperar:
 *   post:
 *     summary: Enviar enlace de recuperación de contraseña
 *     description: |
 *       Recibe el NIT de la empresa y envía un correo con un enlace temporal
 *       para restablecer la contraseña. El enlace se genera dinámicamente desde
 *       una variable de entorno (APP_URL) y contiene un token JWT válido por 15 minutos.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nit
 *             properties:
 *               nit:
 *                 type: string
 *                 example: "901234567"
 *     responses:
 *       200:
 *         description: Correo de recuperación enviado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Correo de recuperación enviado correctamente"
 *       404:
 *         description: Empresa no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Empresa no encontrada"
 */
router.post("/recuperar", solicitarRecuperacionContrasenia);

router.post("/restablecer", restablecerContrasenia);

export default router;