// =============================================
// APLICACIÓN PRINCIPAL - FITAIID FITNESS PLATFORM
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
const OpenAI = require("openai");
const User = require('./models/User'); // ⭐ IMPORTAR MODELO USER

logger.info('🚀 Iniciando FitAiid Backend...');

// Crear aplicación Express
const app = express();

// =============================================
// HELMET - HEADERS DE SEGURIDAD
// =============================================
app.use(helmet({
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
    hsts: {
        maxAge: 31536000,
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
// MIDDLEWARE DE LOGGING PERSONALIZADO
// =============================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    let requestType = '📡';
    if (url.includes('/products')) requestType = '📱';
    if (url.includes('/users')) requestType = '👤';
    if (url.includes('/orders')) requestType = '🛒';
    if (url.includes('/auth')) requestType = '🔐';
    if (url.includes('/health')) requestType = '💚';
    if (url.includes('/questionnaire')) requestType = '📋';
    if (url.includes('/chat')) requestType = '💬';
    
    console.log(`${requestType} ${timestamp} - ${method} ${url} - IP: ${ip}`);
    next();
});

const morganMiddleware = require('./config/morganConfig');
app.use(morganMiddleware);
logger.info('📊 Morgan HTTP logging activado');

// =============================================
// RATE LIMITING
// =============================================
app.use('/api/', generalLimiter);
console.log('🛡️  Rate Limiting activado: 100 peticiones/15min por IP');

// =============================================
// CORS CONFIGURACIÓN
// =============================================
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://techstore-pro.vercel.app',
        'https://www.techstore-pro.com',
        process.env.FRONTEND_URL
    ].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501',
        'http://127.0.0.1:5502',
        'http://localhost:5500',
        'http://localhost:5501',
        'http://localhost:5502',
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:4200'
    ];

app.use(cors({
    origin: function (origin, callback) {
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
    maxAge: 86400
}));

logger.info('✅ CORS configurado', { 
    environment: process.env.NODE_ENV || 'development',
    originsCount: allowedOrigins.length 
});
console.log(`   📍 Orígenes permitidos: ${allowedOrigins.length}`);

// =============================================
// MIDDLEWARE DE PARSEO
// =============================================
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        if (buf.length > 1000000) {
            console.log(`📁 Request grande detectado: ${(buf.length / 1024 / 1024).toFixed(2)}MB`);
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// =============================================
// SANITIZACIÓN DE DATOS
// =============================================
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.log(`🧹 Sanitización NoSQL: campo "${key}" limpiado`);
    }
}));
console.log('🛡️  Sanitización NoSQL activada');

app.use(xss());
console.log('🛡️  Sanitización XSS activada');

const { sanitizeInput } = require('./middleware/sanitize');
app.use(sanitizeInput);
console.log('🛡️  Sanitización personalizada activada');

// =============================================
// CONECTAR A MONGODB
// =============================================
connectDB();

// =============================================
// RUTAS PRINCIPALES
// =============================================

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🏋️ FitAiid API funcionando correctamente',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: {
                description: 'Autenticación y registro',
                routes: {
                    register: 'POST /api/auth/register',
                    login: 'POST /api/auth/login',
                    google: 'POST /api/auth/google'
                }
            },
            questionnaire: {
                description: 'Cuestionario fitness personalizado',
                routes: {
                    save: 'POST /api/questionnaire',
                    get: 'GET /api/questionnaire/:userId'
                }
            },
            chat: {
                description: 'Chat con IA fitness coach',
                routes: {
                    chat: 'POST /api/chat'
                }
            },
            health: 'GET /api/health'
        },
        features: [
            'Sistema de autenticación seguro con JWT',
            'Cuestionario fitness personalizado',
            'Chat IA con coach personal (GPT-4o-mini)',
            'Planes de entrenamiento personalizados',
            'Seguimiento de progreso fitness'
        ]
    });
});

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
        service: 'FitAiid API',
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
// RUTAS DE LA API
// =============================================

// Rutas de productos
app.use('/api/products', require('./routes/products'));
// Rutas de autenticación
app.use('/api/auth', require('./routes/auth'));
// Ruta para verificar correo electrónico
app.use('/api/verify', require('./routes/verifyEmail'));

app.use('/api/questionnaire', require('./routes/questionnaire')); // ⭐ Debe estar aquí
console.log('✅ Rutas API configuradas:');
console.log('   🔐 /api/auth - Autenticación');
console.log('   📱 /api/products - Productos');
console.log('   📋 /api/questionnaire - Cuestionario fitness')
// =============================================
// RUTAS DE CUESTIONARIO FITNESS
// =============================================

app.post("/api/questionnaire", async (req, res) => {
  try {
    const {
      userId,
      gender,
      age,
      height,
      weight,
      fitnessLevel,
      mainGoal,
      medicalConditions,
      trainingLocation,
      trainingDaysPerWeek,
      sessionDuration
    } = req.body;

    console.log(`📋 Guardando cuestionario para usuario: ${userId}`);

    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`❌ Usuario NO encontrado con ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    if (!age || !height || !weight || !fitnessLevel || !mainGoal) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios del cuestionario"
      });
    }

    user.fitnessProfile = {
      gender: gender || null,
      age: parseInt(age),
      height: parseInt(height),
      weight: parseInt(weight),
      fitnessLevel: fitnessLevel.toLowerCase(),
      mainGoal: mainGoal.toLowerCase(),
      medicalConditions: medicalConditions || '',
      trainingLocation: trainingLocation ? trainingLocation.toLowerCase() : null,
      trainingDaysPerWeek: trainingDaysPerWeek ? parseInt(trainingDaysPerWeek) : null,
      sessionDuration: sessionDuration || null,
      questionnaireCompleted: true,
      questionnaireCompletedAt: new Date()
    };

    await user.save();

    console.log(`✅ Cuestionario guardado para: ${user.email}`);
    console.log(`   🎯 Objetivo: ${user.fitnessProfile.mainGoal}`);
    console.log(`   📊 Nivel: ${user.fitnessProfile.fitnessLevel}`);
    console.log(`   💪 IMC: ${user.bmi} (${user.bmiCategory})`);

    res.json({
      success: true,
      message: "Cuestionario guardado exitosamente",
      data: {
        userId: user._id,
        fitnessProfile: user.fitnessProfile,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory
      }
    });

  } catch (error) {
    console.error("❌ Error guardando cuestionario:", error.message);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error al guardar el cuestionario"
    });
  }
});

app.get("/api/questionnaire/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('firstName lastName email fitnessProfile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        fitnessProfile: user.fitnessProfile,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory,
        hasCompletedQuestionnaire: user.fitnessProfile?.questionnaireCompleted || false
      }
    });

  } catch (error) {
    console.error("❌ Error obteniendo perfil fitness:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al obtener el perfil fitness"
    });
  }
});

console.log('✅ Rutas de cuestionario fitness configuradas');

// =============================================
// RUTA PARA VERIFICACIÓN EXITOSA
// =============================================
const path = require("path");

app.get("/verificacion-exitosa", (req, res) => {
  const filePath = path.join(__dirname, "../frontend/src/pages/verificacion-exitosa.html");
  res.sendFile(filePath);
});

// =============================================
// ALMACENAMIENTO TEMPORAL PARA HISTORIAL
// =============================================
const conversationHistory = {}; // Memoria de conversaciones por usuario

// =============================================
// RUTA PARA CHAT IA (GPT-4o-mini) - MEJORADA
// =============================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId, user_id } = req.body;
    const finalUserId = userId || user_id || "anonymous";

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        error: "Por favor escribe un mensaje válido" 
      });
    }

    // Inicializar historial si no existe
    if (!conversationHistory[finalUserId]) {
      conversationHistory[finalUserId] = [];
    }

    // Obtener contexto del usuario si tiene perfil fitness
    let systemPrompt = `Eres Fitty, un asistente experto en fitness y nutrición llamado FitAiid.

🚨 REGLAS ESTRICTAS:
1. SOLO respondes preguntas relacionadas con: fitness, ejercicio, nutrición, dieta, salud física, entrenamiento, gym, pérdida de peso, ganancia muscular, rutinas de ejercicio, suplementos, deportes, bienestar físico.

2. Si te preguntan algo NO relacionado con estos temas (como programación, historia, matemáticas, política, etc.), responde:
   "Lo siento, solo puedo ayudarte con temas de fitness, ejercicio y nutrición 💪. ¿Tienes alguna pregunta sobre entrenamiento, dieta o salud física?"

3. Sé motivador, amigable y profesional. Usa emojis fitness ocasionalmente (💪, 🏋️, 🥗, 🔥).

4. Da respuestas concisas (máximo 4 párrafos).

5. Si el usuario saluda, responde brevemente y pregunta cómo puedes ayudar con fitness.`;
    
    if (finalUserId !== "anonymous") {
      try {
        const user = await User.findById(finalUserId).select('firstName fitnessProfile');
        if (user && user.fitnessProfile?.questionnaireCompleted) {
          systemPrompt += `

📋 PERFIL DEL USUARIO:
- Nombre: ${user.firstName}
- Nivel: ${user.fitnessProfile.fitnessLevel}
- Objetivo: ${user.fitnessProfile.mainGoal}
- Entrena en: ${user.fitnessProfile.trainingLocation}
- Días por semana: ${user.fitnessProfile.trainingDaysPerWeek}

Personaliza tus respuestas considerando este perfil específico.`;
        }
      } catch (error) {
        console.log("⚠️ No se pudo cargar perfil, usando prompt genérico");
      }
    }

    // Agregar mensaje del usuario al historial
    conversationHistory[finalUserId].push({
      role: "user",
      content: message
    });

    // Mantener solo últimos 10 mensajes
    if (conversationHistory[finalUserId].length > 10) {
      conversationHistory[finalUserId] = conversationHistory[finalUserId].slice(-10);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...conversationHistory[finalUserId] // Incluir historial
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const reply = completion.choices[0].message.content;

    // Agregar respuesta al historial
    conversationHistory[finalUserId].push({
      role: "assistant",
      content: reply
    });

    console.log(`💬 Fitty respondió a ${finalUserId} (${reply.length} caracteres)`);
    
    res.json({ reply });
    
  } catch (error) {
    console.error("❌ Error en el chat:", error.message);
    
    if (error.code === 'insufficient_quota') {
      return res.status(503).json({ 
        error: "El servicio de IA está temporalmente no disponible." 
      });
    }
    
    res.status(500).json({ 
      error: "Hubo un problema al procesar tu mensaje. Intenta de nuevo." 
    });
  }
});

console.log('✅ Rutas API configuradas:');
console.log('   📱 /api/products - Gestión de productos');
console.log('   🔐 /api/auth - Autenticación y usuarios');
console.log('   📋 /api/questionnaire - Cuestionario fitness');
console.log('   💬 /api/chat - Chat IA fitness coach');
console.log('   🏥 /api/health - Estado del servidor');

// =============================================
// MIDDLEWARE DE MANEJO DE ERRORES (AL FINAL)
// =============================================

// Middleware para rutas no encontradas (404)
app.use(notFound);
// Middleware de manejo global de errores
app.use(errorHandler);

module.exports = app;