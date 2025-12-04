import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const obtenerUsuarioConCodigo = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({ message: "Debe enviar un código" });
    }

    const prefijo = codigo.substring(0, 4).toUpperCase();

    let rolEsperado: string | null = null;

    switch (prefijo) {
      case "UEST":
        rolEsperado = "ESTUDIANTE";
        break;
      case "UEMP":
        rolEsperado = "EMPRESA";
        break;
      case "UDIR":
        rolEsperado = "DIRECTOR";
        break;
      case "UADM":
        rolEsperado = "ADMIN";
        break;
      default:
        return res
          .status(400)
          .json({ message: "Código inválido: prefijo desconocido" });
    }

    // Buscar usuario por códigoUsuario o codigoSeguridad
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { codigoUsuario: codigo },
          { codigoSeguridad: codigo }
        ],
      },
      include: {
        estudiante: true,
        empresa: true,
        director: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ message: "No existe un usuario con ese código" });
    }

    if (usuario.rol !== rolEsperado) {
      return res.status(409).json({
        message: `El código pertenece a rol ${rolEsperado}, ` +
                 `pero el usuario tiene rol ${usuario.rol}`
      });
    }

    return res.status(200).json({
      message: "Usuario encontrado correctamente",
      usuario,
    });

  } catch (error) {
    console.error("Error al obtener usuario por código:", error);
    res.status(500).json({ message: "Error interno en el servidor" });
  }
};
