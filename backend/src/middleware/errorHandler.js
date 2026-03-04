// =============================================
// MIDDLEWARE DE MANEJO GLOBAL DE ERRORES
// FITAIID - PLATAFORMA FITNESS
// =============================================

const logger = require('../config/logger');

/**
 * Clase personalizada para errores de la aplicación
 * Uso: throw new AppError('Mensaje', 400)
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware principal de manejo de errores
 * Debe estar al final de todas las rutas
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Error interno del servidor';

  // Log del error
  logger.error(`
    ❌ Error: ${err.message}
    📍 Ruta: ${req.method} ${req.originalUrl}
    👤 Usuario: ${req.user?.id || 'Anónimo'}
    🔍 Tipo: ${err.name}
    ${process.env.NODE_ENV === 'development' ? `📚 Stack: ${err.stack}` : ''}
  `);

  // =============================================
  // ERRORES DE MONGODB/MONGOOSE
  // =============================================

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
    
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: messages,
      timestamp: new Date().toISOString()
    });
  }

  // Error de duplicado (índice único)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    return res.status(400).json({
      success: false,
      message: `${field} ya existe en el sistema`,
      field,
      timestamp: new Date().toISOString()
    });
  }

  // Error de casting (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `ID inválido: ${err.value}`,
      field: err.path,
      timestamp: new Date().toISOString()
    });
  }

  // =============================================
  // ERRORES DE AUTENTICACIÓN JWT
  // =============================================

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido. Por favor inicia sesión nuevamente',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Sesión expirada. Por favor inicia sesión nuevamente',
      timestamp: new Date().toISOString()
    });
  }

  // =============================================
  // ERRORES PERSONALIZADOS DE FITAIID
  // =============================================

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // =============================================
  // ERROR GENÉRICO (No operacional)
  // =============================================

  res.status(err.statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Algo salió mal en el servidor' 
      : err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      error: err.name,
      stack: err.stack
    })
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res, next) => {
  const message = `Ruta ${req.method} ${req.originalUrl} no encontrada`;
  
  logger.warn(`🔍 ${message}`);

  res.status(404).json({
    success: false,
    message,
    request: {
      method: req.method,
      url: req.originalUrl
    },
    timestamp: new Date().toISOString(),
    suggestion: 'Verifica la URL y el método HTTP. Consulta /api/docs para ver la documentación completa'
  });
};

/**
 * Middleware para validar que el usuario esté autenticado
 */
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  errorHandler,
  notFound,
  requireAuth,
  AppError
};