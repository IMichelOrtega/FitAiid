// =============================================
// APLICACIÓN PRINCIPAL - TECHSTORE PRO BACKEND
// =============================================

require('dotenv').config(); // Cargar variables de entorno PRIMERO
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const logger = require('./config/logger');
//IA 
const OpenAI = require("openai");

logger.info('🚀 Iniciando TechStore Pro Backend...');

// Crear aplicación Express
const app = express();

// =============================================
// HELMET - HEADERS DE SEGURIDAD
// =============================================
// Aplicar Helmet PRIMERO (antes de otros middlewares)
app.use(helmet({
    // Content Security Policy - Protección XSS moderna
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    // Forzar HTTPS en producción
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
    }
}));

logger.info('🛡️  Helmet activado - Headers de seguridad configurados');
console.log('   ✅ Content Security Policy (CSP)');
console.log('   ✅ X-Frame-Options: DENY');
console.log('   ✅ X-Content-Type-Options: nosniff');
console.log('   ✅ Strict-Transport-Security (HSTS)');

// =============================================
// MIDDLEWARE DE LOGGING PERSONALIZADO TECHSTORE
// =============================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    // Identificar tipo de petición con iconos específicos
    let requestType = '📡';
    if (url.includes('/products')) requestType = '📱';
    if (url.includes('/users')) requestType = '👤';
    if (url.includes('/orders')) requestType = '🛒';
    if (url.includes('/auth')) requestType = '🔐';
    if (url.includes('/health')) requestType = '💚';
    
    console.log(`${requestType} ${timestamp} - ${method} ${url} - IP: ${ip}`);
    next();
});

// ✨ NUEVO: Morgan para HTTP logs
const morganMiddleware = require('./config/morganConfig');
app.use(morganMiddleware);
logger.info('📊 Morgan HTTP logging activado');

// =============================================
// RATE LIMITING - PROTECCIÓN CONTRA ABUSO
// =============================================
// Aplicar rate limiting a todas las rutas de la API
app.use('/api/', generalLimiter);
console.log('🛡️  Rate Limiting activado: 100 peticiones/15min por IP');

// =============================================
// CONFIGURACIÓN CORS MEJORADA PARA TECHSTORE
// =============================================

// =============================================
// CORS AVANZADO POR ENTORNO
// =============================================

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://techstore-pro.vercel.app',
        'https://www.techstore-pro.com',
        process.env.FRONTEND_URL
    ].filter(Boolean) // Eliminar undefined
    : [
        'http://localhost:3000',      // React desarrollo
        'http://127.0.0.1:5500',      // Live Server Puerto 1
        'http://127.0.0.1:5501',      // Live Server puerto 2 ✨ NUEVO
        'http://127.0.0.1:5502',      // Live Server puerto 3 ✨ NUEVO
        'http://localhost:5500',      // Live Server puerto 1 ✨ NUEVO
        'http://localhost:5501',      // Live Server puerto 2 ✨ NUEVO
        'http://localhost:5502',      // Live Server puerto 3 ✨ NUEVO
        'http://localhost:8080',      // Webpack
        'http://localhost:5173',      // Vite
        'http://localhost:4200'       // Angular
    ];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (Postman, apps móviles)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `CORS: Origen ${origin} no permitido`;
            console.log(`⛔ ${msg}`);
            return callback(new Error(msg), false);
        }
        
        console.log(`✅ CORS: Origen permitido - ${origin}`);
        return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization',
        'X-Requested-With',
        'Accept'
    ],
    exposedHeaders: [
        'X-Total-Count', 
        'X-Page-Count',
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset'
    ],
    maxAge: 86400 // Cache preflight por 24 horas
}));

logger.info('✅ CORS configurado', { 
    environment: process.env.NODE_ENV || 'development',
    originsCount: allowedOrigins.length 
});
console.log(`   📍 Orígenes permitidos: ${allowedOrigins.length}`);

// =============================================
// MIDDLEWARE DE PARSEO OPTIMIZADO
// =============================================
// Aumentar límite para imágenes de productos
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Log para requests grandes (posibles uploads de imágenes)
        if (buf.length > 1000000) { // > 1MB
            console.log(`📁 Request grande detectado: ${(buf.length / 1024 / 1024).toFixed(2)}MB`);
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// =============================================
// SANITIZACIÓN DE DATOS - SEGURIDAD
// =============================================

// 1. Sanitizar contra inyecciones NoSQL
app.use(mongoSanitize({
    replaceWith: '_',  // Reemplazar caracteres prohibidos con '_'
    onSanitize: ({ req, key }) => {
        console.log(`🧹 Sanitización NoSQL: campo "${key}" limpiado`);
    }
}));
console.log('🛡️  Sanitización NoSQL activada (express-mongo-sanitize)');

// 2. Sanitizar contra ataques XSS
app.use(xss());
console.log('🛡️  Sanitización XSS activada (xss-clean)');

// Sanitización personalizada (opcional)
const { sanitizeInput, preventSQLInjection } = require('./middleware/sanitize');
app.use(sanitizeInput);
// app.use(preventSQLInjection); //
console.log('🛡️  Sanitización personalizada activada');



// =============================================
// CONECTAR A MONGODB ATLAS
// =============================================
connectDB();

// =============================================
// RUTAS PRINCIPALES DE TECHSTORE PRO
// =============================================

// Ruta principal - Información mejorada de la API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🏪 TechStore Pro API funcionando correctamente',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            products: {
                description: 'Catálogo de productos tecnológicos',
                routes: {
                    list: 'GET /api/products',
                    details: 'GET /api/products/:id',
                    create: 'POST /api/products (Admin)',
                    update: 'PUT /api/products/:id (Admin)',
                    delete: 'DELETE /api/products/:id (Admin)',
                    categories: 'GET /api/products/categories',
                    featured: 'GET /api/products/featured',
                    search: 'GET /api/products/search?q=macbook'
                }
            },
            users: {
                description: 'Gestión de usuarios y perfiles',
                routes: {
                    register: 'POST /api/auth/register',
                    login: 'POST /api/auth/login',
                    profile: 'GET /api/users/profile',
                    list: 'GET /api/users (Admin)'
                }
            },
            orders: {
                description: 'Gestión de pedidos y compras',
                routes: {
                    create: 'POST /api/orders',
                    list: 'GET /api/orders',
                    details: 'GET /api/orders/:id',
                    userOrders: 'GET /api/orders/user/:userId'
                }
            },
            health: 'GET /api/health'
        },
        features: [
            'Catálogo completo de productos Apple y tecnología',
            'Sistema de autenticación seguro con JWT',
            'Gestión de pedidos en tiempo real',
            'Filtros avanzados por categoría y precio',
            'Búsqueda inteligente de productos',
            'Manejo profesional de errores',
            'Validaciones automáticas de datos',
            'Rate Limiting contra ataques de fuerza bruta',            
        ]
    });
});

// Ruta de health check mejorada
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    
    const dbStates = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        service: 'TechStore Pro API',
        version: process.env.APP_VERSION || '1.0.0',
        database: {
            status: dbStates[mongoose.connection.readyState],
            name: mongoose.connection.name || 'No conectado',
            host: mongoose.connection.host || 'N/A'
        },
        memory: {
            used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
        },
        uptime: {
            seconds: Math.floor(process.uptime()),
            formatted: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`
        },
        middleware: {
            errorHandler: 'Activo',
            validation: 'Activo',
            cors: 'Configurado',
            logging: 'Personalizado',
            rateLimiting: 'Activo'
        }
    });
});

// =============================================
// RUTAS DE LA API - TECHSTORE PRO
// =============================================

// Rutas de productos
app.use('/api/products', require('./routes/products'));
// Rutas de autenticación
app.use('/api/auth', require('./routes/auth'));
// Ruta para verificar correo electrónico
app.use('/api/verify', require('./routes/verifyEmail'));

console.log('✅ Rutas API configuradas:');
console.log('   📱 /api/products - Gestión de productos');
console.log('   🔐 /api/auth - Autenticación y usuarios');
console.log('   🏥 /api/health - Estado del servidor');

// TODO: Futuras rutas
// app.use('/api/users', require('./routes/users'));
// app.use('/api/orders', require('./routes/orders'));
// app.use('/api/auth', require('./routes/auth'));

// =============================================
// MIDDLEWARE DE MANEJO DE ERRORES (DEBE IR AL FINAL)
// =============================================




/**
 * CONFIGURACIÓN COMPLETADA PARA TECHSTORE PRO ✅
 * 
 * Middleware implementado:
 * ✅ Logging personalizado con iconos por tipo de petición
 * ✅ CORS configurado para desarrollo y producción
 * ✅ Parseo de JSON con límites para imágenes
 * ✅ Rutas de información y health check mejoradas
 * ✅ Manejo global de errores profesional
 * ✅ Respuestas 404 personalizadas con sugerencias
 * 
 * Próximos pasos (Parte 3B):
 * 🎯 Crear controladores de productos
 * 🎯 Implementar rutas REST para productos
 * 🎯 Probar con Postman
 */
const path = require("path");

// Ruta absoluta hacia tu carpeta de frontend
app.get("/verificacion-exitosa", (req, res) => {
  const filePath = path.join(__dirname, "../frontend/src/pages/verificacion-exitosa.html");
  res.sendFile(filePath);
});

//IA 
// ======================================================
// 🔹 RUTA PARA CHAT IA (GPT-4o-mini)
// ======================================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: "Eres un asistente experto en fitness y nutrición llamado FitAiid. Responde de forma clara, motivadora y profesional.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("❌ Error en el chat:", error.message);
    res.status(500).json({ error: "Error interno en la IA" });
  }
});


// Middleware para rutas no encontradas (404)
app.use(notFound);
// Middleware de manejo global de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
