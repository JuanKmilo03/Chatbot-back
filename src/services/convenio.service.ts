import { EstadoConvenio, PrismaClient, TipoConvenio } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware.js";
const prisma = new PrismaClient();

export const convenioService = {
  crearConvenioInicial: async (empresaId: number) => {
    const convenio = await prisma.convenio.create({
      data: {
        empresaId,
        directorId: null,
        nombre: "Convenio inicial",
        tipo: TipoConvenio.MACRO,
        estado: EstadoConvenio.EN_REVISION,
        version: 1,
        archivoUrl: null,
      },
    });

    return convenio;
  },
  listarConveniosPorEmpresa: async (empresaId: number) => {
    const convenios = await prisma.convenio.findMany({
      where: { empresaId },
      orderBy: { creadoEn: 'desc' }, // más recientes primero
    });

    return convenios;
  },
  listarTodosLosConvenios: async () => {
    return await prisma.convenio.findMany({
      include: { empresa: true, director: true },
      orderBy: { creadoEn: 'desc' },
    });
  },
  obtenerConvenioPorId: async (convenioId: number, usuario: AuthRequest["user"]) => {
    const convenio = await prisma.convenio.findUnique({
      where: { id: convenioId },
      include: {
        empresa: true,         
        director: true,        
        revisiones: true,
        documentos: true,
        vacantes: true,
        subConvenios: true,    
        macroConvenio: true,   
      },
    });

    if (!convenio) return null;

    if (usuario!.rol === 'EMPRESA' && convenio.empresa.usuarioId !== usuario!.id) {
      return null; // una empresa solo puede ver sus propios convenios
    }

    return convenio;
  },
}