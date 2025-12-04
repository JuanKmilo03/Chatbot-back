import { Router } from 'express';
import { obtenerPerfilUsuario, UsuarioController } from '../controllers/usuario.controller.js';
import { authFirebase } from '../middlewares/authFirebase.js';
import { obtenerUsuarioConCodigo } from '../controllers/codigo.controller.js';

const router = Router();

router.get('/', UsuarioController.listar);
router.get("/perfil", authFirebase, obtenerPerfilUsuario);
router.get("/codigo/:codigo", obtenerUsuarioConCodigo);



export default router;
