import express from "express";
import cors from "cors";
import { env } from "./config/env.config.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);
app.use(express.json());

// Rutas
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/auth", authRoutes);

// Endpoint raíz
app.get("/", (req, res) => {
  res.send("🚀 Servidor del Chatbot funcionando correctamente");
});

// Iniciar servidor y conectar base de datos
const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
  });
};

startServer();
