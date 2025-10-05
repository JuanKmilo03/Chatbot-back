import express from "express";
import cors from "cors";
import { env } from "./config/env.config";
import chatbotRoutes from "./routes/chatbot.routes";

const app = express();

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
}));
app.use(express.json());

// Rutas
app.use("/api/chatbot", chatbotRoutes);

// Endpoint raíz para probar
app.get("/", (req, res) => {
  res.send("🚀 Servidor del Chatbot funcionando correctamente");
});

// Iniciar servidor
app.listen(env.PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${env.PORT}`);
});
