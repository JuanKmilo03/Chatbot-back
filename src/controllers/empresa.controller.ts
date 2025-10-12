import { Request, Response } from "express";
import * as empresaService from "../services/empresa.service.js";

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
    const data = await loginEmpresa(nit, password);
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

export const actualizarEstadoEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const empresaActualizada = await empresaService.actualizarEstadoEmpresa(Number(id), estado);
    res.status(200).json({
      message: "Estado de empresa actualizado",
      data: empresaActualizada,
    });
  } catch (error: any) {
    console.error("Error al actualizar estado:", error);
    res.status(400).json({ error: error.message });
  }
};
