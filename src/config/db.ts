import { PrismaClient } from "@prisma/client";


export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});


export async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Conexión exitosa a PostgreSQL con Prisma");
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    process.exit(1);
  }
}
