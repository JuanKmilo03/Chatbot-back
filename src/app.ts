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

// Rutas
import authRoutes from "./routes/auth.routes.js";
import authGoogleRoutes from "./routes/authGoogle.routes.js";
import convenioRoutes from "./routes/convenio.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import directorRoutes from "./routes/director.routes.js";
import empresaRoutes from "./routes/empresa.routes.js";
import vacanteRoutes from "./routes/vacante.routes.js";

// Middlewares
import { verifyToken, authorizeRoles } from "./middlewares/auth.middleware.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares base
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas públicas
app.use("/api/auth", authRoutes);
app.use("/api/auth", authGoogleRoutes);
app.use("/api/vacantes", vacanteRoutes);

// ruta spor roles
app.use("/api/convenios", verifyToken, authorizeRoles("DIRECTOR", "ADMIN"), convenioRoutes);
app.use("/api/usuarios", verifyToken, authorizeRoles("ADMIN"), usuarioRoutes);
app.use("/api/directores", verifyToken, authorizeRoles("ADMIN"), directorRoutes);
app.use("/api/empresas", verifyToken, authorizeRoles("EMPRESA"), empresaRoutes);

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
