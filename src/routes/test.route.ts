import { Router } from "express";
import { authFirebase } from "../middlewares/authFirebase.js";

const router = Router();

router.get("/testAuth", authFirebase, (req, res) => {
  res.json({
    message: "Autenticación correcta",
    uid: (req as any).uid,
  });
});

export default router;
