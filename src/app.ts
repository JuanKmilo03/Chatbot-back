import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { env } from "./config/env.config.js";
import { connectDB } from "./config/db.js";
import { fileURLToPath } from "url";

// Swagger
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

//de prueba
import testRouter from "./routes/test.route.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  env.FRONTEND_URL, // tu dominio de producción
  "http://localhost:4000", // para desarrollo local
  "https://wfgp12.github.io/practibot_ufps/",// opcional, tu dominio real
  "https://n8n.juanpctsoftware.online/",
  "https://wfgp12.github.io"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true, // si usas cookies o auth headers
  })
);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// Rutas
import authRoutes from "./routes/auth.routes.js";
import authGoogleRoutes from "./routes/authGoogle.routes.js";
import convenioRoutes from "./routes/convenio.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import directorRoutes from "./routes/director.routes.js";
import empresaRoutes from "./routes/empresa.routes.js";
import vacanteRoutes from "./routes/vacante.routes.js";
import documentoRoutes from "./routes/documento.routes.js";
import estudianteRoutes from "./routes/estudiante.routes.js";

// Middlewares
import { verifyToken, authorizeRoles } from "./middlewares/auth.middleware.js";



// Middlewares base

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.use("/api", testRouter);

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas públicas
//app.use("/api/auth", authRoutes);
app.use("/api/auth", authGoogleRoutes);
app.use("/api/vacantes", vacanteRoutes);
app.use("/api/documentos", documentoRoutes);
app.use("/api/empresas", empresaRoutes);
app.use('/api/estudiantes', estudianteRoutes);

// Rutas por roles
app.use("/api/convenios", convenioRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/directores", directorRoutes);
app.use("/api/empresas", empresaRoutes);

// Ruta base
app.get("/", (_req, res) => res.send("🚀 Servidor del Chatbot funcionando correctamente"));

// Servidor
const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => console.log(`Servidor corriendo en http://localhost:${env.PORT}`));
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
