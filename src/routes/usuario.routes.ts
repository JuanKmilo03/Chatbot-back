import { Router } from 'express';
import { obtenerPerfilUsuario, UsuarioController } from '../controllers/usuario.controller.js';
import { authFirebase } from '../middlewares/authFirebase.js';

const router = Router();

router.get('/', UsuarioController.listar);
router.get("/perfil", authFirebase, obtenerPerfilUsuario);


export default router;
