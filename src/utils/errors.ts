/**
 * Errores personalizados con códigos HTTP
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "No tienes permiso para realizar esta acción") {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Solicitud inválida") {
    super(message, 400);
  }
}
