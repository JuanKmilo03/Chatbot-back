import { Router } from "express";
import {

  crearDirector,
  listarDirectores,
} from "../controllers/director.controller.js";

const router = Router();

router.post("/", crearDirector);
router.get("/", listarDirectores);


export default router;
