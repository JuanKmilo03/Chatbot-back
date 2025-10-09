import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import { env } from "./config/env.config.js";
import { connectDB } from "./config/db.js";
import path from 'path';

import chatbotRoutes from "./routes/chatbot.routes.js";
import authRoutes from "./routes/auth.routes.js";
import convenioRoutes from './routes/convenio.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import directorRoutes from './routes/director.routes.js';
import empresaRoutes from "./routes/empresa.routes.js";


import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();


// Middleware
app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Rutas
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/convenios', convenioRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/directores', directorRoutes);
app.use('/api/empresas', empresaRoutes);


// Endpoint raíz
app.get("/", (req, res) => {
  res.send("🚀 Servidor del Chatbot funcionando correctamente");
});

// Iniciar servidor y conectar base de datos
const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
