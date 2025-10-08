import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';

const router = Router();

router.post('/', UsuarioController.crear);
router.get('/', UsuarioController.listar);

export default router;
