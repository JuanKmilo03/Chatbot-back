import { Router } from "express";
import { handleChatRequest } from "../controllers/chatbot.controller";

const router = Router();

router.post("/", handleChatRequest);

export default router;
