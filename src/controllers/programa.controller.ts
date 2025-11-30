import { Request, Response } from "express";
import * as programaService from "../services/programa.service.js";

export const crearProgramaController = async (req: Request, res: Response) => {
  try {
    const programa = await programaService.crearPrograma(req.body);
    res.status(201).json(programa);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const obtenerProgramasController = async (req: Request, res: Response) => {
  try {
    const programas = await programaService.obtenerProgramas();
    res.json(programas);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const obtenerProgramaPorIdController = async (req: Request, res: Response) => {
  try {
    const programa = await programaService.obtenerProgramaPorId(Number(req.params.id));
    res.json(programa);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const actualizarProgramaController = async (req: Request, res: Response) => {
  try {
    const programa = await programaService.actualizarPrograma(Number(req.params.id), req.body);
    res.json(programa);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const eliminarProgramaController = async (req: Request, res: Response) => {
  try {
    const deleted = await programaService.eliminarPrograma(Number(req.params.id));
    res.json(deleted);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listarProgramasSelectController = async (req: Request, res: Response) => {
  try {
    const programas = await programaService.listarProgramasSelect();
    res.json(programas);
  } catch (error: any) {
    console.error("Error listando programas:", error);
    res.status(500).json({ message: "Error obteniendo programas" });
  }
};
