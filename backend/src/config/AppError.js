/**
 * @desc    Clase centralizada para errores de aplicación
 * @purpose Lanzar errores con código HTTP específico
 * @usage   throw new AppError('Mensaje de error', 400)
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
