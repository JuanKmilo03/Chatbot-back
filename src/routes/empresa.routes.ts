import { Router } from 'express';
import { EmpresaController } from '../controllers/empresa.controller.js';

const router = Router();

router.post('/', EmpresaController.crear);
router.get('/', EmpresaController.listar);

export default router;
