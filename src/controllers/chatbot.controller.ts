import { Request, Response } from "express";

export const handleChatRequest = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    // Por ahora solo responde con eco del mensaje
    return res.json({ reply: `Recibí tu mensaje: ${message}` });
  } catch (error) {
    console.error("Error en handleChatRequest:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
