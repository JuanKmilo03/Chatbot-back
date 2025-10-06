import { Router } from "express";
import { handleChatRequest } from "../controllers/chatbot.controller.js";

const router = Router();

router.post("/", handleChatRequest);

export default router;
