import { Router } from "express";
import {
  subirDocumento,
  listarDocumentos,
  obtenerDocumentoPorId,
  actualizarDocumento,
  eliminarDocumento,
  obtenerPlantillaConvenio,
} from "../controllers/documento.controller.js";
import { Rol } from "@prisma/client";
import { authorizeRoles, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/subir",
  verifyToken,
  authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
  upload.single("archivo"),
  subirDocumento
);

router.get("/", listarDocumentos);

router.get("/convenio", verifyToken, authorizeRoles('EMPRESA', 'DIRECTOR'), obtenerPlantillaConvenio);

router.get("/:id", obtenerDocumentoPorId);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
  upload.single("archivo"),
  actualizarDocumento
);

/**
 * @swagger
 * /api/documentos/{id}:
 *   delete:
 *     summary: Elimina un documento
 *     description: Elimina permanentemente un documento (solo el director propietario)
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento a eliminar
 *     responses:
 *       200:
 *         description: Documento eliminado correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permiso para eliminar este documento
 *       404:
 *         description: Documento no encontrado
 */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles(Rol.DIRECTOR, Rol.ADMIN),
  eliminarDocumento
);

export default router;
