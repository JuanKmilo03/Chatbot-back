import { Router } from 'express';
import { EstudianteController, cargarEstudiantesExcel, listarEstudiantesIndependiente, listarEstudiantesPractica } from "../controllers/estudiante.controller.js";
import { upload } from '../middlewares/upload.js';

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
 *     summary: Crea un nuevo estudiante
 *     tags: [Estudiantes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 example: "juan@ufps.edu.co"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               habilidades:
 *                 type: string
 *                 example: "JavaScript, Node.js"
 *               perfil:
 *                 type: string
 *                 example: "Estudiante de ingeniería de sistemas"
 *     responses:
 *       201:
 *         description: Estudiante creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/', EstudianteController.crear);

/**
 * @swagger
 * /api/estudiantes:
 *   get:
 *     summary: Obtiene todos los estudiantes
 *     tags: [Estudiantes]
 *     responses:
 *       200:
 *         description: Lista de estudiantes
 */
router.get('/', EstudianteController.obtenerTodos);

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   get:
 *     summary: Obtiene un estudiante por ID
 *     tags: [Estudiantes]
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
 *       404:
 *         description: No encontrado
 */
router.get('/:id', EstudianteController.obtenerPorId);

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   put:
 *     summary: Actualiza los datos de un estudiante
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               habilidades:
 *                 type: string
 *               perfil:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estudiante actualizado
 *       404:
 *         description: Estudiante no encontrado
 */
router.put('/:id', EstudianteController.actualizar);

/**
 * @swagger
 * /api/estudiantes/{id}/soft-delete:
 *   patch:
 *     summary: Marca un estudiante como inactivo (soft delete)
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estudiante inactivado
 *       404:
 *         description: Estudiante no encontrado
 */
router.patch('/:id/soft-delete', EstudianteController.softDelete);

router.post('/cargar-excel', upload.single('archivo'), cargarEstudiantesExcel);
router.get('/estudiantes-practica', listarEstudiantesPractica);

export default router;

