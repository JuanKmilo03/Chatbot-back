import { prisma } from "../config/db.js";

export class ReporteService {
  static async obtenerResumen(directorId: number) {
    const hoy = new Date();
    const diasProximoAVencer = 30;
    const fechaProximoAVencer = new Date();
    fechaProximoAVencer.setDate(hoy.getDate() + diasProximoAVencer);

    // Obtener el programaId del director
    const director = await prisma.director.findUnique({
      where: { usuarioId: directorId },
      select: { programaId: true },
    });

    if (!director) throw new Error("Director no encontrado");

    const programaId = director.programaId;

    // Contar estudiantes en práctica del programa
    const estudiantesEnPractica = await prisma.practica.count({
      where: {
        estado: "EN_PROCESO",
        estudiante: { programaId }
      }
    });

    // Contar vacantes activas del programa
    const vacantesActivas = await prisma.vacante.count({
      where: {
        estado: "APROBADA",
        empresa: { programaId }
      }
    });

    // Contar convenios vigentes y próximos a vencer
    const conveniosVigentes = await prisma.convenio.count({
      where: {
        estado: "APROBADO",
        directorId,
        fechaFin: { gte: hoy }
      }
    });

    const conveniosPorVencer = await prisma.convenio.count({
      where: {
        estado: "APROBADO",
        directorId,
        fechaFin: { gte: hoy, lte: fechaProximoAVencer }
      }
    });

    return {
      estudiantesEnPractica,
      vacantesActivas,
      conveniosVigentes,
      conveniosPorVencer
    };
  }
}
