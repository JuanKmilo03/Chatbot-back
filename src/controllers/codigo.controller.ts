import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";


const prisma = new PrismaClient();

export const obtenerUsuarioPorCodigo = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;

    if (!codigo || codigo.trim() === "") {
      return res.status(400).json({ message: "Debe enviar un código válido" });
    }

    const codigoNormalizado = codigo.toUpperCase().trim();

    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { codigoUsuario: codigo },
          { 
            codigoSeguridad: {
              equals: codigo,
              mode: "insensitive"
            }
          }
        ]
      },
      include: {
        estudiante: true,
        empresa: true,
        director: true,
      }
    });

    if (!usuario) {
      return res
        .status(404)
        .json({ message: "No existe un usuario con ese código" });
    }

    const tipoCodigo =
      usuario.codigoUsuario === codigoNormalizado
        ? "codigoUsuario"
        : "codigoSeguridad";

    let nombre = "Sin nombre asignado";

    switch (usuario.rol) {
      case "ESTUDIANTE":
        nombre = usuario.nombre ?? nombre;
        break;

      case "EMPRESA":
        nombre = usuario.nombre ?? nombre;
        break;

      case "DIRECTOR":
        nombre = usuario.nombre ?? nombre;
        break;

      default:
        break;
    }

    // Generar el token JWT
    const tokenPayload = {
      id: usuario.id,
      rol: usuario.rol,
      codigoUsuario: usuario.codigoUsuario,
    };

    const token = jwt.sign(
      tokenPayload,
      env.JWT_SECRET,
      { expiresIn: "24h" } // Puedes ajustar el tiempo de expiración
    );

    return res.status(200).json({
      message: "Usuario encontrado correctamente",
      tipoCodigo,
      rol: usuario.rol,
      nombre,
      token, // Token JWT generado
    });

  } catch (error) {
    console.error("Error al obtener usuario por código:", error);
    return res.status(500).json({
      message: "Error interno en el servidor",
      error: error instanceof Error ? error.message : error,
    });
  }
};