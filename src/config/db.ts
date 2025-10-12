import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Conexión exitosa a PostgreSQL con Prisma");
  } catch (error: any) {
    console.error("Error al conectar con la base de datos:");

    console.error("Mensaje:", error.message);
    console.error("Nombre:", error.name);
    console.error("Código Prisma:", error.code);
    console.error("Meta:", error.meta);
    console.error("Stack:", error.stack);

    process.exit(1);
  }
}
