import { Router, Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  crearDirector,
  listarDirectores,
} from "../controllers/director.controller.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "../../uploads/temp"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten archivos PDF o Excel"));
  },
});

router.post("/", crearDirector);
router.get("/", listarDirectores);


export default router;
