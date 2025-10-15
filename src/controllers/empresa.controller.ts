import { Request, Response } from "express";
import * as empresaService from "../services/empresa.service.js";
import {AuthRequest} from "../middlewares/auth.middleware.js"

export const registrarEmpresa = async (req: Request, res: Response) => {
  try {
    const empresa = await empresaService.registrarEmpresa(req.body);
    res.status(201).json({
      message: "Empresa registrada correctamente",
      data: empresa,
    });
  } catch (error: any) {
    console.error("Error al registrar empresa:", error);
    res.status(400).json({ error: error.message });
  }
};

export const loginEmpresa = async (req: Request, res: Response) => {
  try {
    const { nit, password } = req.body;
    const data = await empresaService.loginEmpresa(nit, password);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const obtenerEmpresasPendientes = async (req: Request, res: Response) => {
  try {
    const empresas = await empresaService.obtenerEmpresasPendientes();
    res.status(200).json(empresas);
  } catch (error: any) {
    console.error("Error al obtener empresas:", error);
    res.status(500).json({ error: "Error al listar empresas" });
  }
};

export const obtenerEmpresas = async (req: Request, res: Response) => {
  try {
    const empresas = await empresaService.obtenerEmpresas();
    res.status(200).json(empresas);
  } catch (error: any) {
    console.error("Error al obtener empresas:", error);
    res.status(500).json({ error: "Error al listar empresas" });
  }
};

export const obtenerEmpresaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresa = await empresaService.obtenerEmpresaPorId(Number(id));

    if (!empresa) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    res.status(200).json(empresa);
  } catch (error: any) {
    console.error("Error al obtener empresa:", error);
    res.status(500).json({ error: "Error al obtener la información de la empresa" });
  }
};

// export const actualizarEstadoEmpresa = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { estado } = req.body;
//     const empresaActualizada = await empresaService.actualizarEstadoEmpresa(Number(id), estado);
//     res.status(200).json({
//       message: "Estado de empresa actualizado",
//       data: empresaActualizada,
//     });
//   } catch (error: any) {
//     console.error("Error al actualizar estado:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

export const aprobarEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresa = await empresaService.aprobarEmpresa(Number(id));
    res.status(200).json({ message: "Empresa aprobada", data: empresa });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const rechazarEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresa = await empresaService.rechazarEmpresa(Number(id));
    res.status(200).json({ message: "Empresa rechazada", data: empresa });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const toggleEstadoEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresa = await empresaService.toggleEstadoEmpresa(Number(id));
    res.status(200).json({ message: "Estado de empresa actualizado", data: empresa });
  } catch (error: any) {
    console.error("Error al actualizar estado:", error);
    res.status(400).json({ error: error.message });
  }
}

export const obtenerPerfilEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(400).json({ message: "Usuario no válido o sin sesión activa" });
    }

    const empresa = await empresaService.obtenerEmpresaPorUsuarioId(usuarioId);

    if (!empresa) {
      return res.status(404).json({ message: "No se encontró información de la empresa" });
    }

    return res.status(200).json(empresa);
  } catch (error: unknown) {
    console.error("Error al obtener perfil de empresa:", error);
    return res.status(500).json({ message: "Error al obtener la información de la empresa" });
  }
};

export const editarEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const empresaActualizada = await empresaService.editarEmpresa(Number(id), data);

    res.status(200).json({
      message: "Empresa actualizada correctamente",
      data: empresaActualizada,
    });
  } catch (error: any) {
    console.error("Error al editar empresa:", error);
    res.status(400).json({ error: error.message });
  }
};