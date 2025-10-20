// backend/src/config/logger.js

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// =====================================================
// CONFIGURACIÓN DE FORMATOS
// =====================================================

// Formato para consola (desarrollo) - con colores
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        
        // Agregar metadata si existe
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        
        return msg;
    })
);

// Formato para archivos (producción) - JSON estructurado
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// =====================================================
// TRANSPORTS (DONDE SE GUARDAN LOS LOGS)
// =====================================================

// Transport para errores (logs/error-YYYY-MM-DD.log)
const errorFileTransport = new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',        // Mantener logs por 30 días
    maxSize: '20m',         // Máximo 20MB por archivo
    format: fileFormat
});

// Transport para todo (logs/combined-YYYY-MM-DD.log)
const combinedFileTransport = new DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',        // Mantener logs por 14 días
    maxSize: '20m',
    format: fileFormat
});

// Transport para peticiones HTTP (logs/http-YYYY-MM-DD.log)
const httpFileTransport = new DailyRotateFile({
    filename: path.join('logs', 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxFiles: '7d',         // Mantener logs HTTP por 7 días
    maxSize: '50m',         // HTTP genera más logs
    format: fileFormat
});

// Transport para consola (solo en desarrollo)
const consoleTransport = new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

// =====================================================
// CREAR LOGGER PRINCIPAL
// =====================================================

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    defaultMeta: { 
        service: 'techstore-api',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        errorFileTransport,
        combinedFileTransport,
        httpFileTransport,
        consoleTransport
    ],
    exitOnError: false
});

// =====================================================
// LOGGER DE AUDITORÍA (ACCIONES CRÍTICAS)
// =====================================================

const auditLogger = winston.createLogger({
    format: fileFormat,
    transports: [
        new DailyRotateFile({
            filename: path.join('logs', 'audit-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '90d',    // Guardar auditoría por 90 días
            maxSize: '50m'
        })
    ]
});

// =====================================================
// MÉTODOS DE UTILIDAD
// =====================================================

/**
 * Log de auditoría para acciones críticas
 */
logger.audit = (action, details) => {
    const auditLog = {
        timestamp: new Date().toISOString(),
        action,
        ...details
    };
    
    auditLogger.info(auditLog);
    logger.info(`AUDIT: ${action}`, details);
};

/**
 * Log de petición HTTP
 */
logger.http = (message, metadata) => {
    logger.log('http', message, metadata);
};

// =====================================================
// EVENTOS DE ROTACIÓN
// =====================================================

errorFileTransport.on('rotate', (oldFilename, newFilename) => {
    logger.info('Log file rotated', { oldFilename, newFilename });
});

// =====================================================
// EXPORTAR LOGGER
// =====================================================

module.exports = logger;

console.log('✅ Logger Winston configurado');
console.log('   📁 Logs en carpeta: logs/');
console.log('   📄 error-YYYY-MM-DD.log - Solo errores');
console.log('   📄 combined-YYYY-MM-DD.log - Todos los logs');
console.log('   📄 http-YYYY-MM-DD.log - Peticiones HTTP');
console.log('   📄 audit-YYYY-MM-DD.log - Auditoría');