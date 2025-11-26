import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';
import { Rol } from '@prisma/client';
import { cargarEstudiantesExcel, cargarMasivo, estudianteController, listarEstudiantesIndependiente, listarEstudiantesPractica, uploadHojaVida } from '../controllers/estudiante.controller.js';
import { upload } from '../middlewares/upload.js';
import { authFirebase } from '../middlewares/authFirebase.js';


const router = Router();
router.get('/listar-independiente', listarEstudiantesIndependiente);

/**
 * @swagger
 * tags:
 *   name: Estudiantes
 *   description: Endpoints para gestionar estudiantes
 */

/**
 * @swagger
 * /api/estudiantes:
 *   post:
 *     summary: Crear un estudiante (solo DIRECTOR o ADMIN)
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 example: juan.perez@universidad.edu
 *     responses:
 *       201:
 *         description: Estudiante creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Estudiante creado exitosamente
 *                 estudiante:
 *                   $ref: '#/components/schemas/Estudiante'
 *       400:
 *         description: Campos obligatorios faltantes
 *       409:
 *         description: Correo institucional ya registrado
 *       500:
 *         description: Error del servidor
 */
router.post(
    '/',
    verifyToken,
    authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
    estudianteController.crear
);

/**
 * @swagger
 * /api/estudiantes:
 *   get:
 *     summary: Obtener todos los estudiantes con paginación (solo DIRECTOR o ADMIN)
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           example: 0
 *         description: Número de registros a saltar (paginación)
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Número máximo de registros a traer
 *     responses:
 *       200:
 *         description: Lista de estudiantes activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Estudiante'
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error del servidor
 */
router.get(
    '/',
    verifyToken,
    authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
    estudianteController.obtenerTodos
);

/**
 * @swagger
 * /api/estudiantes/me:
 *   get:
 *     summary: Obtener la información del estudiante autenticado
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información completa del estudiante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Estudiante'
 *       401:
 *         description: Usuario no autenticado
 *       404:
 *         description: Estudiante no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get(
    '/me',
    verifyToken,
    authorizeRoles(Rol.ESTUDIANTE),
    estudianteController.obtenerMiPerfil
);

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   get:
 *     summary: Obtener un estudiante por su ID
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante
 *     responses:
 *       200:
 *         description: Estudiante encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Estudiante'
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Estudiante no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get(
    '/:id',
    verifyToken,
    authorizeRoles(Rol.DIRECTOR, Rol.ADMIN, Rol.ESTUDIANTE),
    estudianteController.obtenerPorId
);


/**
 * @swagger
 * /api/estudiantes/{id}/desactivar:
 *   patch:
 *     summary: Desactivar un estudiante (soft delete)
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante a desactivar
 *     responses:
 *       200:
 *         description: Estudiante desactivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Estudiante desactivado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Estudiante'
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error del servidor
 */
router.patch(
    '/:id/desactivar',
    verifyToken,
    authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
    estudianteController.desactivar
);

/**
 * @swagger
 * /api/estudiantes/{id}/activar:
 *   patch:
 *     summary: Reactivar un estudiante previamente inactivo
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante a reactivar
 *     responses:
 *       200:
 *         description: Estudiante reactivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Estudiante reactivado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Estudiante'
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error del servidor
 */
router.patch(
    '/:id/activar',
    verifyToken,
    authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
    estudianteController.reactivar
);

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   put:
 *     summary: Actualizar datos de un estudiante
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *               area:
 *                 type: string
 *               habilidadesTecnicas:
 *                 type: array
 *                 items:
 *                   type: string
 *               habilidadesBlandas:
 *                 type: array
 *                 items:
 *                   type: string
 *               experiencia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estudiante actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Estudiante actualizado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Estudiante'
 *       403:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put(
    '/:id',
    verifyToken,
    authorizeRoles(Rol.DIRECTOR, Rol.ADMIN, Rol.ESTUDIANTE),
    estudianteController.actualizar
);

/**
 * @swagger
 * /api/estudiantes/:id/completar-perfil:
 *   patch:
 *     summary: Completar perfil del estudiante (solo propio)
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante que completa su perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *               area:
 *                 type: string
 *               habilidadesTecnicas:
 *                 type: array
 *                 items:
 *                   type: string
 *               habilidadesBlandas:
 *                 type: array
 *                 items:
 *                   type: string
 *               experiencia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil completado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Estudiante'
 *       403:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.patch(
  '/:id/completar-perfil',
  verifyToken,
  authorizeRoles(Rol.ESTUDIANTE),
  estudianteController.completarPerfil
);

router.post('/cargar',verifyToken, authorizeRoles(Rol.DIRECTOR, Rol.ADMIN), upload.single('archivo'), cargarMasivo);

router.patch('/:id/completar-perfil', verifyToken, authorizeRoles(Rol.ESTUDIANTE), estudianteController.completarPerfil);

/**
 * @swagger
 * /api/estudiantes/me/upload-hoja-vida:
 *   post:
 *     summary: Subir hoja de vida del estudiante autenticado (obtiene ID del JWT)
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo PDF o Word (máx. 5MB)
 *     responses:
 *       200:
 *         description: Hoja de vida subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hoja de vida subida exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     hojaDeVidaUrl:
 *                       type: string
 *                     estudiante:
 *                       type: object
 *                     uploadedAt:
 *                       type: string
 *       400:
 *         description: Archivo no válido o faltante
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.post('/me/upload-hoja-vida', verifyToken, authorizeRoles(Rol.ESTUDIANTE), upload.single('archivo'), estudianteController.subirMiHojaDeVida);

/**
 * @swagger
 * /api/estudiantes/{id}/upload-hoja-vida:
 *   post:
 *     summary: Subir hoja de vida del estudiante (JWT)
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo PDF o Word (máx. 5MB)
 *     responses:
 *       200:
 *         description: Hoja de vida subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hoja de vida subida exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     hojaDeVidaUrl:
 *                       type: string
 *                     estudiante:
 *                       type: object
 *                     uploadedAt:
 *                       type: string
 *       400:
 *         description: Archivo no válido o faltante
 *       403:
 *         description: No autorizado (solo estudiantes)
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/upload-hoja-vida', verifyToken, authorizeRoles(Rol.ESTUDIANTE), upload.single('archivo'), estudianteController.subirHojaDeVida);

/**
 * @swagger
 * /api/estudiantes/upload-hoja-vida:
 *   post:
 *     summary: Subir hoja de vida del estudiante autenticado (Firebase)
 *     tags: [Estudiantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo PDF o Word (máx. 5MB)
 *     responses:
 *       200:
 *         description: Hoja de vida subida exitosamente
 *       400:
 *         description: Archivo no válido o faltante
 *       403:
 *         description: No autorizado (solo estudiantes)
 *       500:
 *         description: Error del servidor
 */
router.post('/upload-hoja-vida', authFirebase, upload.single('archivo'), uploadHojaVida);

router.post('/cargar-excel', upload.single('archivo'), cargarEstudiantesExcel);
router.get('/estudiantes-practica', listarEstudiantesPractica);

export default router;
