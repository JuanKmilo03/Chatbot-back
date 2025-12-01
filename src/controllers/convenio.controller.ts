import { Request, Response } from "express";
import { EstadoConvenio, Prisma, PrismaClient, TipoConvenio } from "@prisma/client";
import { convenioService } from "../services/convenio.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import path from "path";
import { leerCSV, leerExcel, parseFecha } from "../utils/fileParse.js";

const prisma = new PrismaClient();

export const crearConvenioPorDirector = async (req: AuthRequest, res: Response) => {
  try {
    const { empresaId, nombre, descripcion, tipo, observaciones, fechaInicio, fechaFin, estado } = req.body;
    const directorId = req.user?.id;
    const archivo = req.file;

    if (!empresaId || !nombre || !tipo || !fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "empresaId, nombre, tipo, fechaInicio y fechaFin son obligatorios" });
    }

    const convenio = await convenioService.crearConvenioPorDirector({
      empresaId: Number(empresaId),
      nombre,
      descripcion,
      tipo,
      observaciones,
      fechaInicio,
      fechaFin,
      estado
    },
      archivo,
      directorId!
    );

    res.status(201).json({
      message: "Convenio creado correctamente por directora o admin.",
      data: convenio,
    });
  } catch (error) {
    console.error("❌ Error al crear convenio por director:", error);
    res.status(500).json({ message: "Error al crear convenio por director.", error: (error as Error).message });
  }
};

export const cargarConveniosMasivo = async (req: AuthRequest, res: Response) => {
  try {
    let archivos: Express.Multer.File[] = [];

    if (Array.isArray(req.files)) {
      archivos = req.files;
    } else if (req.files && typeof req.files === "object") {
      for (const key of Object.keys(req.files)) {
        archivos.push(...(req.files[key] as Express.Multer.File[]));
      }
    }
    const archivoExcel = archivos.find(f => f.fieldname === "archivoData");
    const archivosPdf = archivos.filter(f => f.fieldname === "archivos");

    if (!archivoExcel) {
      return res.status(400).json({ message: "Debes subir un archivo Excel/CSV con los convenios." });
    }
    const ext = path.extname(archivoExcel.originalname).toLowerCase();

    let rows: any[];

    if (ext === ".csv") {
      rows = await leerCSV(archivoExcel);
    } else if (ext === ".xlsx" || ext === ".xls") {
      rows = leerExcel(archivoExcel);
    } else {
      return res.status(400).json({ message: "Formato no soportado. Usa CSV o Excel." });
    }

    const created: any[] = [];
    const failed: { nombre: string; error: string }[] = [];

    for (const r of rows) {
      const {
        nitEmpresa,
        nombre,
        descripcion,
        tipo,
        observaciones,
        fechaInicio,
        fechaFin,
        estado,
        archivo: nombreArchivo
      } = r;

      if (!nitEmpresa || !nombre || !tipo || !fechaInicio || !fechaFin) {
        failed.push({ nombre, error: "Faltan campos obligatorios o el NIT." });
        continue;
      }

      const empresa = await prisma.empresa.findUnique({
        where: { nit: nitEmpresa.toString().trim() }
      });

      if (!empresa) {
        failed.push({
          nombre,
          error: `No existe una empresa registrada con el NIT ${nitEmpresa}`
        });
        continue;
      }

      // Buscar PDF asociado
      let archivoSelecionado: Express.Multer.File | undefined;

      if (nombreArchivo) {
        archivoSelecionado = archivosPdf.find(f =>
          f.originalname.toLowerCase().trim() === nombreArchivo.toLowerCase().trim()
        );
      }

      try {
        const convenio = await convenioService.crearConvenioPorDirector({
          empresaId: empresa.id,
          nombre,
          descripcion,
          tipo,
          observaciones,
          fechaInicio,
          fechaFin,
          estado
        },
        archivoSelecionado,
        req.user!.id,
      );

        created.push({ nombre, convenio });
      } catch (err: any) {
        console.log(err)
        failed.push({ nombre, error: err.message });
      }
    }

    return res.json({
      message: "Cargue masivo de convenios procesado",
      data: {
        created,
        failed
      }
    });
  } catch (error) {
    console.error("❌ Error en cargue masivo de convenios:", error);
    return res.status(500).json({ message: "Error procesando el archivo." });
  }
};

export const iniciarConvenio = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId },
    });

    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    const convenio = await convenioService.crearConvenioInicial(
      empresa.id
    );

    res.status(201).json({
      message: "Convenio iniciado correctamente",
      data: convenio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar el convenio", error });
  }
};

export const listarConveniosEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId },
    });

    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const filtros: any = {};

    if (req.query.estado) filtros.estado = req.query.estado;
    if (req.query.tipo) filtros.tipo = req.query.tipo;
    if (req.query.nombre)
      filtros.nombre = { contains: String(req.query.nombre), mode: "insensitive" };

    const result = await convenioService.listarConveniosPorEmpresa(empresa.id, {
      page,
      pageSize,
      filtros,
    });

    res.status(200).json({
      message: "Convenios obtenidos correctamente",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error al listar convenios de la empresa:", error);
    res.status(500).json({ message: "Error al listar los convenios", error });
  }
};
export const listarConvenios = async (req: Request, res: Response) => {
  try {

    const q = req.query;

    const page = Number(q.page || 1);
    const take = Number(q.pageSize || 10);

    const CAMPOS_ORDEN: Array<keyof Prisma.ConvenioOrderByWithRelationInput> = [
      "creadoEn",
      "fechaInicio",
      "fechaFin"
    ];

    const ordenCampo = CAMPOS_ORDEN.includes(q.ordenCampo as any)
      ? (q.ordenCampo as keyof Prisma.ConvenioOrderByWithRelationInput)
      : "creadoEn";

    const ordenDireccion =
      q.orden === "asc" || q.orden === "desc" ? q.orden : "desc";

    const orderBy: Prisma.ConvenioOrderByWithRelationInput = {
      [ordenCampo]: ordenDireccion,
    };
    const where: Prisma.ConvenioWhereInput = {
      nombre: q.nombre
        ? { contains: String(q.nombre), mode: "insensitive" }
        : undefined,

      empresa: q.empresa
        ? {
          usuario: {
            nombre: {
              contains: String(q.empresa),
              mode: "insensitive",
            }
          },
        }
        : undefined,
      tipo: q.tipo ? { equals: q.tipo as TipoConvenio } : undefined,
      fechaInicio: q.fechaInicio
        ? normalizeDateRange(q.fechaInicio as string)
        : undefined,

      fechaFin: q.fechaFin
        ? normalizeDateRange(q.fechaFin as string)
        : undefined,

      estado: {
        in: q.estado
          ? [q.estado as EstadoConvenio]
          : ["APROBADO", "RECHAZADO", "VENCIDO"]
      },
    };

    const result = await convenioService.listarConvenios({
      where,
      page,
      take,
      orderBy
    });

    res.status(200).json({
      message: "Convenios obtenidos correctamente",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error al listar convenios de la empresa:", error);
    res.status(500).json({ message: "Error al listar los convenios", error });
  }
};
export const listarConveniosPendientes = async (req: Request, res: Response) => {
  try {
    const q = req.query;

    const page = Number(q.page || 1);
    const take = Number(q.pageSize || 10);

    const CAMPOS_ORDEN: Array<keyof Prisma.ConvenioOrderByWithRelationInput> = [
      "creadoEn",
      "fechaInicio",
      "fechaFin"
    ];

    const ordenCampo = CAMPOS_ORDEN.includes(q.ordenCampo as any)
      ? (q.ordenCampo as keyof Prisma.ConvenioOrderByWithRelationInput)
      : "creadoEn";

    const ordenDireccion =
      q.orden === "asc" || q.orden === "desc" ? q.orden : "desc";

    const orderBy: Prisma.ConvenioOrderByWithRelationInput = {
      [ordenCampo]: ordenDireccion,
    };
    const where: Prisma.ConvenioWhereInput = {
      nombre: q.nombre
        ? { contains: String(q.nombre), mode: "insensitive" }
        : undefined,

      empresa: q.empresa
        ? {
          usuario: {
            nombre: {
              contains: String(q.empresa),
              mode: "insensitive",
            }
          },
        }
        : undefined,
      tipo: q.tipo ? { equals: q.tipo as TipoConvenio } : undefined,
      fechaInicio: q.fechaInicio
        ? normalizeDateRange(q.fechaInicio as string)
        : undefined,

      fechaFin: q.fechaFin
        ? normalizeDateRange(q.fechaFin as string)
        : undefined,

      estado: {
        notIn: q.estado
          ? [q.estado as EstadoConvenio]
          : ["APROBADO", "RECHAZADO", "VENCIDO"]
      },
    };

    const result = await convenioService.listarConvenios({
      where,
      page,
      take,
      orderBy
    });

    res.status(200).json({
      message: "Convenios obtenidos correctamente",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error al listar convenios de la empresa:", error);
    res.status(500).json({ message: "Error al listar los convenios", error });
  }
};

const normalizeDateRange = (value?: string) => {
  if (!value) return undefined;

  const day = new Date(value);
  const start = new Date(day);
  const end = new Date(day);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { gte: start, lte: end };
};

export const listarTodosLosConvenios = async (_req: AuthRequest, res: Response) => {
  try {
    const convenios = await convenioService.listarTodosLosConvenios();
    res.status(200).json({ convenios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar todos los convenios", error });
  }
};

export const listarConveniosPorEmpresaId = async (req: AuthRequest, res: Response) => {
  try {
    const empresaId = Number(req.params.empresaId);
    if (!empresaId) {
      return res.status(400).json({ message: "ID de empresa inválido" });
    }

    // 🔹 Paginación y filtros desde query
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const filtros: any = {};

    if (req.query.estado) filtros.estado = req.query.estado;
    if (req.query.tipo) filtros.tipo = req.query.tipo;
    if (req.query.nombre)
      filtros.nombre = { contains: String(req.query.nombre), mode: "insensitive" };

    const result = await convenioService.listarConveniosPorEmpresaId(empresaId, {
      page,
      pageSize,
      filtros,
    });

    res.status(200).json({
      message: "Convenios obtenidos correctamente",
      ...result,
    });
  } catch (error) {
    console.error("Error al listar convenios por empresa:", error);
    res.status(500).json({ message: "Error al listar convenios por empresa", error });
  }
};

export const obtenerConvenioPorId = async (req: AuthRequest, res: Response) => {
  try {
    const convenioId = Number(req.params.id);
    const usuario = req.user;

    if (!convenioId) {
      return res.status(400).json({ message: "ID de convenio inválido" });
    }

    const convenio = await convenioService.obtenerConvenioPorId(convenioId, usuario);

    if (!convenio) {
      return res.status(404).json({ message: "Convenio no encontrado o acceso denegado" });
    }

    res.status(200).json({ data: convenio });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener convenio" });
  }
};

export const subirConvenioFirmado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const archivo = req.file;
    const convenio = await convenioService.subirFirmado(Number(id), archivo!);
    res.status(200).json({ message: "Archivo firmado subido correctamente.", data: convenio });
  } catch (error) {
    console.error("Error al subir convenio firmado:", error);
    res.status(500).json({ message: "Error al subir convenio firmado.", error: (error as Error).message });
  }
};

export const enviarRevisionFinal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const convenio = await convenioService.enviarRevisionFinal(Number(id));
    res.status(200).json({ message: "Convenio enviado a revisión final.", data: convenio });
  } catch (error) {
    console.error("Error al enviar a revisión:", error);
    res.status(500).json({ message: "Error al enviar a revisión final.", error: (error as Error).message });
  }
};

export const aprobarConvenio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin, observaciones } = req.body;
    const archivo = req.file;
    const directorId = req.user?.id;

    const convenio = await convenioService.aprobarConvenio(Number(id), archivo!, {
      directorId: directorId!,
      fechaInicio,
      fechaFin,
      observaciones,
    });

    res.status(200).json({ message: "Convenio aprobado correctamente.", data: convenio });
  } catch (error) {
    console.error("Error al aprobar convenio:", error);
    res.status(500).json({ message: "Error al aprobar el convenio." });
  }
};

export const rechazarConvenio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const convenio = await convenioService.rechazarConvenio(Number(id), observaciones);
    res.status(200).json({ message: "Convenio rechazado correctamente.", data: convenio });
  } catch (error) {
    console.error("Error al rechazar convenio:", error);
    res.status(500).json({ message: "Error al rechazar el convenio." });
  }
};

export const subirNuevaVersionConvenio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const archivo = req.file;
    const usuarioId = req.user?.id;
    if (!archivo) {
      return res.status(400).json({ message: "Debe adjuntar un archivo" });
    }

    const convenio = await convenioService.subirNuevaVersion(Number(id), archivo, usuarioId!);

    res.status(200).json({
      message: "Nueva versión del convenio subida correctamente.",
      data: convenio,
    });
  } catch (error) {
    console.error("Error al subir nueva versión del convenio:", error);
    res.status(500).json({
      message: "Error al subir la nueva versión del convenio.",
      error: (error as Error).message,
    });
  }
};