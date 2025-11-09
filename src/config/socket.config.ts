import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env.config.js";

export interface SocketUser {
  id: number;
  rol: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

import { Socket } from "socket.io";

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
      const decoded = jwt.verify(token, env.JWT_SECRET) as SocketUser;
      (socket as AuthenticatedSocket).user = decoded;
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

    console.log(`✅ Usuario conectado: ${user.id} (${user.rol})`);

    // El usuario se une a su sala personal
    socket.join(`user-${user.id}`);

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

    // Evento de desconexión
    socket.on("disconnect", () => {
      console.log(`❌ Usuario desconectado: ${user.id}`);
    });
  });

  return io;
};
