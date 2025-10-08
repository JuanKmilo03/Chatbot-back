import { Router } from 'express';
import { DirectorController } from '../controllers/director.controller.js';

const router = Router();

router.post('/', DirectorController.crear);
router.get('/', DirectorController.listar);

export default router;
