import { Server as SocketIOServer } from "socket.io";

/**
 * Emite un evento de nuevo mensaje a todos los usuarios en una conversación
 */
export const emitNewMessage = (
  io: SocketIOServer,
  conversacionId: number,
  mensaje: any
) => {
  io.to(`conversation-${conversacionId}`).emit("new-message", mensaje);
};

/**
 * Emite un evento cuando se crea una nueva conversación
 */
export const emitNewConversation = (
  io: SocketIOServer,
  empresaId: number,
  directorId: number,
  conversacion: any
) => {
  // Notificar a la empresa
  io.to(`user-${empresaId}`).emit("new-conversation", conversacion);

  // Notificar al director
  io.to(`user-${directorId}`).emit("new-conversation", conversacion);
};

/**
 * Emite un evento cuando un usuario se conecta/desconecta
 */
export const emitUserStatus = (
  io: SocketIOServer,
  userId: number,
  status: "online" | "offline"
) => {
  io.emit("user-status", {
    userId,
    status,
    timestamp: new Date(),
  });
};

/**
 * Notifica a un usuario específico
 */
export const notifyUser = (
  io: SocketIOServer,
  userId: number,
  notification: {
    type: string;
    message: string;
    data?: any;
  }
) => {
  io.to(`user-${userId}`).emit("notification", notification);
};

/**
 * Obtiene usuarios conectados en una conversación
 */
export const getConversationUsers = async (
  io: SocketIOServer,
  conversacionId: number
): Promise<string[]> => {
  const room = `conversation-${conversacionId}`;
  const sockets = await io.in(room).fetchSockets();
  return sockets.map((socket) => socket.id);
};

/**
 * Obtiene el número de usuarios conectados
 */
export const getConnectedUsersCount = async (
  io: SocketIOServer
): Promise<number> => {
  const sockets = await io.fetchSockets();
  return sockets.length;
};
