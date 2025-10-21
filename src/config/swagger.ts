import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detectar si estamos en producción o desarrollo
const isProduction = process.env.NODE_ENV === "production";

// Determinar la URL base del servidor
const serverUrl = isProduction
  ? "http://chatbot-back-production.up.railway.app/" // 🔁 cámbialo por tu URL real en Railway
  : `http://localhost:${env.PORT}`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Chatbot",
      version: "1.0.0",
      description: "Documentación de la API del chatbot",
    },
    servers: [
      {
        url: serverUrl,
        description: isProduction ? "Servidor en producción" : "Servidor local",
      },
    ],
  },
  apis: [
    // ✅ Usa los archivos .js en producción y .ts en desarrollo
    path.join(
      __dirname,
      isProduction ? "../dist/routes/*.js" : "../routes/*.ts"
    ),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
