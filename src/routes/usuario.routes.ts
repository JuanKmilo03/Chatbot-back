import { Router } from 'express';
import { obtenerPerfilUsuario, UsuarioController } from '../controllers/usuario.controller.js';
import { authFirebase } from '../middlewares/authFirebase.js';
import { obtenerUsuarioPorCodigo } from '../controllers/codigo.controller.js';

const router = Router();

router.get('/', UsuarioController.listar);
router.get("/perfil", authFirebase, obtenerPerfilUsuario);
router.get("/codigo/:codigo", obtenerUsuarioPorCodigo);



export default router;
