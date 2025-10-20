// =============================================
// MIDDLEWARE DE MANEJO GLOBAL DE ERRORES
// TECHSTORE PRO - ECOMMERCE
// =============================================

/**
 * ¿QUÉ HACE ESTE ARCHIVO?
 * 
 * Maneja TODOS los errores que pueden ocurrir en TechStore Pro:
 * - Producto no encontrado (MacBook, iPhone, etc.)
 * - Datos inválidos al crear productos
 * - Problemas de conexión a MongoDB
 * - Errores de validación de Mongoose
 * - IDs malformados de productos/usuarios
 * 
 * ¿POR QUÉ ES IMPORTANTE?
 * - Experiencia consistente para el usuario
 * - Mensajes de error claros y útiles
 * - Logs detallados para debugging
 * - Código más limpio en controladores
 */

const errorHandler = (err, req, res, next) => {
    console.error(`🚨 Error en TechStore Pro - ${req.method} ${req.originalUrl}:`);
    console.error(`   📍 Tipo: ${err.name}`);
    console.error(`   💬 Mensaje: ${err.message}`);
    
    // Error por defecto
    let error = { ...err };
    error.message = err.message;

    // =============================================
    // ERRORES ESPECÍFICOS DE MONGODB/MONGOOSE
    // =============================================

    // Error de validación de Mongoose
    // Ejemplo: Admin intenta crear MacBook sin nombre o precio
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(error => error.message).join(', ');
        error = {
            statusCode: 400,
            message: `Error de validación: ${message}`
        };
        console.error(`   🔍 Campos con error: ${Object.keys(err.errors).join(', ')}`);
    }

    // Error de duplicado (índice único)
    // Ejemplo: Admin intenta crear producto con nombre que ya existe
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        error = {
            statusCode: 400,
            message: `Ya existe un elemento con ${field}: '${value}'`
        };
        console.error(`   🔍 Campo duplicado: ${field} = ${value}`);
    }

    // Error de casting (ID inválido)
    // Ejemplo: Usuario busca producto con ID "abc123" en lugar de ObjectId válido
    if (err.name === 'CastError') {
        error = {
            statusCode: 400,
            message: `ID de ${err.path} inválido: ${err.value}`
        };
        console.error(`   🔍 ID inválido: ${err.value}`);
    }

    // Error de documento no encontrado
    // Ejemplo: Usuario intenta ver MacBook que fue eliminado
    if (err.name === 'DocumentNotFoundError') {
        error = {
            statusCode: 404,
            message: 'Producto no encontrado en TechStore'
        };
    }

    // =============================================
    // ERRORES DE AUTENTICACIÓN JWT
    // =============================================

    // Token JWT inválido
    // Ejemplo: Admin intenta acceder con token malformado
    if (err.name === 'JsonWebTokenError') {
        error = {
            statusCode: 401,
            message: 'Token de acceso inválido. Por favor inicia sesión nuevamente.'
        };
    }

    // Token JWT expirado
    // Ejemplo: Admin intenta crear producto con sesión expirada
    if (err.name === 'TokenExpiredError') {
        error = {
            statusCode: 401,
            message: 'Sesión expirada. Por favor inicia sesión nuevamente.'
        };
    }

    // =============================================
    // ERRORES PERSONALIZADOS DE TECHSTORE
    // =============================================

    // Error de stock insuficiente (implementaremos después)
    if (err.message.includes('insufficient stock')) {
        error = {
            statusCode: 400,
            message: 'Stock insuficiente para completar la compra'
        };
    }

    // Error de producto inactivo
    if (err.message.includes('product inactive')) {
        error = {
            statusCode: 404,
            message: 'Este producto ya no está disponible'
        };
    }

    // =============================================
    // CONSTRUIR RESPUESTA FINAL
    // =============================================

    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Error interno del servidor';

    // Respuesta estándar de TechStore Pro
    const errorResponse = {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // Solo en desarrollo incluir stack trace y detalles técnicos
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = {
            originalError: err.name,
            mongoCode: err.code,
            validationErrors: err.errors
        };
    }

    // En producción, agregar ID de error para soporte
    if (process.env.NODE_ENV === 'production') {
        errorResponse.errorId = `TS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    console.error(`   📤 Respuesta enviada: ${statusCode} - ${message}`);
    
    res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para rutas no encontradas (404)
 * Ejemplo: Usuario intenta acceder a /api/productos (en lugar de /api/products)
 */
const notFound = (req, res, next) => {
    const message = `Ruta ${req.method} ${req.originalUrl} no encontrada en TechStore API`;
    console.error(`🔍 ${message}`);
    
    res.status(404).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
        suggestion: 'Verifica la URL y método HTTP',
        availableRoutes: {
            products: {
                getAll: 'GET /api/products',
                getById: 'GET /api/products/:id',
                create: 'POST /api/products',
                update: 'PUT /api/products/:id',
                delete: 'DELETE /api/products/:id'
            },
            users: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/users/profile'
            },
            orders: {
                getAll: 'GET /api/orders',
                create: 'POST /api/orders'
            }
        }
    });
};

module.exports = {
    errorHandler,
    notFound
};

/**
 * EJEMPLOS DE USO EN TECHSTORE PRO:
 * 
 * 1. Usuario busca MacBook inexistente:
 *    GET /api/products/invalid-id
 *    → CastError → 400 "ID de producto inválido"
 * 
 * 2. Admin crea iPhone sin precio:
 *    POST /api/products { name: "iPhone 15" }
 *    → ValidationError → 400 "El precio es obligatorio"
 * 
 * 3. Usuario accede a ruta incorrecta:
 *    GET /api/productos
 *    → 404 con sugerencias de rutas correctas
 * 
 * 4. Problema de conexión a MongoDB:
 *    → 500 "Error interno del servidor"
 */