import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env.config.js";
import { Rol } from "@prisma/client";

export interface SocketUser {
  id: number;
  rol: Rol;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

// Variable global para almacenar la instancia de Socket.IO
let ioInstance: SocketIOServer | null = null;

/**
 * Valida que el rol sea un valor válido del enum Rol
 */
const isValidRol = (rol: string): rol is Rol => {
  return Object.values(Rol).includes(rol as Rol);
};

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        env.FRONTEND_URL,
        "http://localhost:4000",
        "https://wfgp12.github.io",
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Middleware de autenticación para Socket.IO
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Autenticación requerida"));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: number; rol: string };

      // Validar que el rol sea válido
      if (!isValidRol(decoded.rol)) {
        return next(new Error("Rol inválido en el token"));
      }

      (socket as AuthenticatedSocket).user = {
        id: decoded.id,
        rol: decoded.rol,
      };
      next();
    } catch (error) {
      next(new Error("Token inválido"));
    }
  });

  // Evento de conexión
  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`Usuario conectado: ${user.id} (${user.rol})`);

    // El usuario se une a su sala personal para notificaciones
    socket.join(`user:${user.id}`);
    console.log(`Usuario ${user.id} unido a sala de notificaciones: user:${user.id}`);

    // Evento: Unirse a una conversación
    socket.on("join-conversation", (conversacionId: number) => {
      socket.join(`conversation-${conversacionId}`);
      console.log(`Usuario ${user.id} se unió a conversación ${conversacionId}`);
    });

    // Evento: Salir de una conversación
    socket.on("leave-conversation", (conversacionId: number) => {
      socket.leave(`conversation-${conversacionId}`);
      console.log(`Usuario ${user.id} salió de conversación ${conversacionId}`);
    });

    // Evento: Usuario está escribiendo
    socket.on("typing", (data: { conversacionId: number }) => {
      socket.to(`conversation-${data.conversacionId}`).emit("user-typing", {
        userId: user.id,
        rol: user.rol,
      });
    });

    // Evento: Usuario dejó de escribir
    socket.on("stop-typing", (data: { conversacionId: number }) => {
      socket.to(`conversation-${data.conversacionId}`).emit("user-stop-typing", {
        userId: user.id,
        rol: user.rol,
      });
    });

    // Evento: Marcar mensaje como leído
    socket.on("mark-as-read", (data: { conversacionId: number; mensajeId: number }) => {
      socket.to(`conversation-${data.conversacionId}`).emit("message-read", {
        mensajeId: data.mensajeId,
        userId: user.id,
      });
    });

    // Evento: Marcar notificación como leída
    socket.on("mark-notification-read", (data: { notificacionId: number }) => {
      console.log(`Notificación ${data.notificacionId} marcada como leída por usuario ${user.id}`);
      // La lógica de marcado se maneja en el servicio, este evento es solo informativo
    });

    // Evento de desconexión
    socket.on("disconnect", () => {
      console.log(`Usuario desconectado: ${user.id}`);
    });
  });

  // Guardar la instancia de Socket.IO
  ioInstance = io;

  return io;
};

/**
 * Obtiene la instancia de Socket.IO
 * Utilizada por los servicios para emitir notificaciones
 */
export const getSocketIO = (): SocketIOServer | null => {
  return ioInstance;
};
