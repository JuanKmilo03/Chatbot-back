/*import express from 'express';
import { ConvenioController } from '../controllers/convenio.controller.js';
import { uploadConvenio } from '../config/upload.config.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/rol.middleware.js';

const router = express.Router();

// Crear convenio
router.post(
  '/',
  authMiddleware,
  verificarRol(['DIRECTOR']),
  uploadConvenio.single('archivo'),
  ConvenioController.crear
);

// Listar convenios
router.get(
  '/',
  authMiddleware,
  verificarRol(['DIRECTOR']),
  ConvenioController.listar
);

//sin auth 
router.post('/', ConvenioController.crear);
router.get('/', ConvenioController.listar);


// Obtener por ID
router.get(
  '/:id',
  authMiddleware,
  ConvenioController.obtenerPorId
);

// Descargar archivo
router.get(
  '/:id/descargar',
  authMiddleware,
  ConvenioController.descargarArchivo
);

// Actualizar
router.put(
  '/:id',
  authMiddleware,
  verificarRol(['DIRECTOR']),
  ConvenioController.actualizar
);

// Eliminar
router.delete(
  '/:id',
  authMiddleware,
  verificarRol(['DIRECTOR']),
  ConvenioController.eliminar
);
*/
// Crear convenio (sin auth)

import { Router } from 'express';
import {
  crearConvenio,
  listarConvenios,
  obtenerConvenioPorId,
  actualizarConvenio,
  eliminarConvenio,
  listarConveniosPorDirector,
  listarConveniosVigentes2
} from '../controllers/convenio.controller.js';

const router = Router();

router.post('/', crearConvenio);
router.get('/', listarConvenios);
router.get('/:id', obtenerConvenioPorId);
router.put('/:id', actualizarConvenio);
router.delete('/:id', eliminarConvenio);
router.get("/director/:directorId", listarConveniosPorDirector);
router.get('/convenios/vigentes/:directorId', listarConveniosVigentes2);
export default router;
