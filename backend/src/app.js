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
const rutinaRoutes = require('./routes/rutinaRoutes');
const notificationRoutes = require('./routes/notifications'); //Notificaciones push
const notificationService = require('./services/notificationService'); // Servicio de notificaciones push
const notificationScheduler = require('./services/notificationScheduler'); // Cron jobs
const { protect } = require('./middleware/auth'); // ✅ Importar protect middleware
const AppError = require('./config/AppError'); // ✅ Importar AppError
const catchAsync = require('./utils/catchAsync'); // ✅ Importar catchAsync

logger.info('🚀 Iniciando FitAiid Backend...');
// =============================================
// CONFIGURACIÓN SEMANA FITNESS
// =============================================

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];

const DISTRIBUCION_ENTRENO = {
  1: ["Lunes"],
  2: ["Lunes", "Jueves"],
  3: ["Lunes", "Miércoles", "Viernes"],
  4: ["Lunes", "Martes", "Jueves", "Viernes"],
  5: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  6: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
};
function construirSemanaCompleta(rutinaIA, trainingDaysPerWeek) {
  const diasEntreno = DISTRIBUCION_ENTRENO[trainingDaysPerWeek] || DISTRIBUCION_ENTRENO[3];
  let indexEntreno = 0;

  return DIAS_SEMANA.map(dia => {
    if (diasEntreno.includes(dia)) {
      const diaEntreno = rutinaIA.dias[indexEntreno];
      indexEntreno++;

      return {
        nombre: dia,
        esDescanso: false,
        ...diaEntreno
      };
    }

    return {
      nombre: dia,
      esDescanso: true,
      mensaje: "DÍA DE DESCANSO"
    };
  });
}

// Crear aplicación Express
const app = express();
// =============================================
// CORS CONFIGURACIÓN
// =============================================
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
    process.env.FRONTEND_URL,
    'https://techstore-pro.vercel.app',
    'https://www.techstore-pro.com'
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
    // Permitir peticiones sin origen (como apps móviles o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS: Origen ${origin} no permitido.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

logger.info('✅ CORS configurado', {
  environment: process.env.NODE_ENV || 'development',
  originsCount: allowedOrigins.length
});
console.log(`   📍 Orígenes permitidos: ${allowedOrigins.length}`);

// =============================================
// HELMET - HEADERS DE SEGURIDAD
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://kit.fontawesome.com"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", process.env.FRONTEND_URL].filter(Boolean),
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://ka-f.fontawesome.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
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
// SWAGGER DOCUMENTATION
// =============================================
const { swaggerUi, swaggerSpec } = require('./swagger/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true
  },
  customCss: '.topbar { display: none }',
  customSiteTitle: 'FitAiid API Documentation'
}));

console.log('✅ Swagger documentation disponible en: /api/docs');

// Después de las otras importaciones
const avatarRoutes = require('../src/routes/avatarRoutes'); // ⭐ NUEVO

// Después de la configuración de middleware, ANTES de las rutas existentes
app.use('/api', avatarRoutes); // ⭐ NUEVO
app.use('/api/rutina', rutinaRoutes); // ⭐ SISTEMA DE CICLO AUTOMÁTICO

console.log('✅ Rutas de Avatar configuradas:');
console.log('   📸 POST /api/avatar/:userId - Subir avatar');
console.log('   🖼️ GET /api/avatar/:userId - Obtener avatar');
console.log('   🗑️ DELETE /api/avatar/:userId - Eliminar avatar');
//Rutas de notificaciones push
app.use('/api/notifications', notificationRoutes);

// =============================================
// INICIALIZAR SISTEMA DE NOTIFICACIONES AUTOMÁTICAS
// =============================================
notificationScheduler.initializeScheduledJobs();
console.log('✅ Sistema de notificaciones automáticas inicializado');

//
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
// Ruta para rutinas de entrenamiento
app.use('/api/rutina', rutinaRoutes);

app.use('/api/questionnaire', require('./routes/questionnaire')); // ⭐ Debe estar aquí
console.log('✅ Rutas API configuradas:');
console.log('   🔐 /api/auth - Autenticación');
console.log('   📱 /api/products - Productos');
console.log('   📋 /api/questionnaire - Cuestionario fitness')
// Importar rutas
const estadisticasRoutes = require('./routes/estadisticas_r');
const entrenamientosRoutes = require('./routes/entrenamientos_r');
const logrosRoutes = require('./routes/logros_r');

// Usar rutas
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/entrenamientos', entrenamientosRoutes);
app.use('/api/logros', logrosRoutes);

// Logs de confirmación
console.log('✅ Rutas configuradas:');
console.log('   📊 /api/estadisticas/:userId');
console.log('   📈 /api/estadisticas/graficos/:userId');
console.log('   📝 /api/entrenamientos/registrar');
console.log('   📅 /api/entrenamientos/historial/:userId');
console.log('   🏆 /api/logros/:userId');

// ❌ ENDPOINTS DUPLICADOS ELIMINADOS:
// - app.post("/api/questionnaire") - Usar routes/questionnaire.js
// - app.get("/api/questionnaire/:userId") - Usar routes/questionnaire.js
// - app.put("/api/questionnaire/:userId") - Usar routes/questionnaire.js
// Los endpoints están centralizados en routes/questionnaire.js con autenticación correcta

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
    console.error("   Código de error:", error.code);
    console.error("   Status:", error.status);

    // 🔴 ERROR 429: CUOTA AGOTADA
    if (error.status === 429 || error.code === 'rate_limit_exceeded' || error.message.includes('exceeded your current quota')) {
      console.error("💳 ERROR: Cuota de OpenAI agotada o límite excedido");
      return res.status(503).json({
        success: false,
        error: "⚠️ El servicio de IA está temporalmente no disponible.",
        details: "Se ha excedido la cuota de la API de OpenAI. Por favor verifica:",
        actions: [
          "1. Accede a https://platform.openai.com/account/billing/overview",
          "2. Verifica tu saldo y límites de uso",
          "3. Si es necesario, agrega un método de pago",
          "4. Aumenta los límites de uso en Settings"
        ]
      });
    }

    // 🔴 ERROR de insufficient_quota (código antiguo)
    if (error.code === 'insufficient_quota') {
      console.error("💳 ERROR: Fondos insuficientes en OpenAI");
      return res.status(503).json({
        success: false,
        error: "El servicio de IA está temporalmente no disponible.",
        details: "Por favor verifica tu billing en https://platform.openai.com/account/billing"
      });
    }

    // ⚠️ ERROR GENÉRICO
    res.status(500).json({
      success: false,
      error: "Hubo un problema al procesar tu mensaje. Intenta de nuevo.",
      hint: "Si el problema persiste, contacta con soporte."
    });
  }
});
// =============================================
// RUTAS DE ENTRENADOR IA - AGREGAR A app.js
// =============================================
// Copia este código y pégalo en tu archivo app.js
// después de la ruta /api/chat

// =============================================
// RUTA PARA GENERAR RUTINA CON IA
// =============================================
app.post("/api/generar-rutina", protect, catchAsync(async (req, res) => {
  const { userId, profile } = req.body;

  // ✅ SECURITY: Validar que el usuario autenticado solo puede generar para sí mismo
  if (!userId) {
    throw new AppError('userId requerido', 400);
  }
  if (req.user._id.toString() !== userId) {
    throw new AppError('No autorizado para generar rutina para otro usuario', 403);
  }

  console.log('🏋️ Generando rutina para usuario:', userId);

    // Obtener perfil del usuario si no viene en el request
    let userProfile = profile;

    if (!userProfile && userId && userId !== 'anonymous') {
      try {
        const user = await User.findById(userId).select('firstName fitnessProfile');
        if (user && user.fitnessProfile) {
          userProfile = user.fitnessProfile;
        }
      } catch (error) {
        console.log('⚠️ No se pudo cargar perfil desde DB');
      }
    }

    // Perfil por defecto si no hay datos
    if (!userProfile) {
      userProfile = {
        mainGoal: 'tonificar',
        fitnessLevel: 'principiante',
        trainingDaysPerWeek: 3,
        trainingLocation: 'casa',
        sessionDuration: '45 min',
        medicalConditions: 'ninguna'
      };
    }
    //Prompt de la IA
    const prompt = `
Eres un ENTRENADOR PERSONAL PROFESIONAL.

Genera una rutina semanal de entrenamiento.

REGLAS OBLIGATORIAS:
- Objetivo: ${userProfile.mainGoal}
- Nivel: ${userProfile.fitnessLevel}
- Dias de entrenamiento EXACTOS: ${userProfile.trainingDaysPerWeek}
- Lugar: ${userProfile.trainingLocation}
- Duracion por sesion: ${userProfile.sessionDuration}

IMPORTANTE:
- Debes generar EXACTAMENTE ${userProfile.trainingDaysPerWeek} dias de ENTRENAMIENTO.
- NO generes dias adicionales.
- NO generes entrenamientos parciales.
- Todos los dias deben ser entrenamientos completos.
- Los dias deben estar entre Lunes y Sabado.
- Domingo siempre es descanso.

SI el objetivo es TONIFICAR:
- Cada día debe trabajar GRUPOS MUSCULARES DIFERENTES
- Alterna: tren superior, tren inferior, full body, espalda, core
- Repeticiones: 12 a 15
- Descansos cortos
- Cardio ligero SOLO como complemento
- ❌ PROHIBIDO repetir el mismo enfoque dos días
REGLA CRÍTICA:
- El campo "enfoque" DEBE ser distinto en cada día
- El enfoque debe indicar QUÉ MÚSCULOS se entrenan
- Ejemplos válidos:
  - "Pecho, hombros y tríceps"
  - "Piernas y glúteos"
  - "Espalda y bíceps"
  - "Full body + core"


GANAR MASA MUSCULAR:
- 8 a 12 repeticiones
- descansos 60 a 90 segundos
- ejercicios compuestos
- sin cardio intenso

BAJAR DE PESO:
- circuitos o full body
- cardio todos los dias
- descansos cortos
- alto gasto calorico

FORMATO DE RESPUESTA (OBLIGATORIO):
Devuelve UNICO JSON con esta estructura EXACTA:

{
  "nombreRutina": "string",
  "descripcion": "string",
  "dias": [
    {
      "nombre": "Lunes",
      "esDescanso": false,
      "enfoque": "string",
      "duracionTotal": number,
      "caloriasEstimadas": number,
      "ejercicios": [
        {
          "nombre": "string",
          "series": number,
          "repeticiones": "string",
          "descanso": "string"
        }
      ]
    }
  ]
}

NO incluyas texto fuera del JSON.
`;


    // Llamar a OpenAI (con fallback en caso de fallo)
    let rutina;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un entrenador personal experto. Siempre respondes con JSON válido sin ningún texto adicional, sin markdown, sin explicaciones. Solo el JSON puro."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      const responseText = completion.choices[0].message.content;

      try {
        // Limpiar la respuesta de posibles marcadores de código
        let cleanResponse = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        console.log('🧠 RESPUESTA IA RAW:\n', responseText);

        rutina = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('❌ Error parseando JSON de la IA:', parseError);
        console.log('Respuesta raw:', responseText);

        // Generar rutina de fallback
        rutina = generarRutinaFallback(userProfile);
      }
    } catch (openaiError) {
      console.error('⚠️ Error calling OpenAI API:', openaiError.message);
      console.log('Usando rutina fallback');
      // Generar rutina de fallback cuando OpenAI falla
      rutina = generarRutinaFallback(userProfile);
    }

    // Guardar la rutina en el usuario (opcional)
    if (userId && userId !== 'anonymous') {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: { 'currentRoutine': rutina },
          $push: {
            'routineHistory': {
              rutina: rutina,
              generatedAt: new Date()
            }
          }
        });
      } catch (error) {
        console.log('⚠️ No se pudo guardar rutina en DB');
      }
    }

    // 🔥 CONSTRUIR SEMANA COMPLETA (ENTRENO + DESCANSO)
    const semanaCompleta = construirSemanaCompleta(
      rutina,
      userProfile.trainingDaysPerWeek
    );

    rutina.dias = semanaCompleta;

    console.log('✅ Rutina generada exitosamente (semana completa)');

    res.json({
      success: true,
      message: "Rutina generada exitosamente",
      rutina: rutina
    });
}));

// =============================================
// FUNCIÓN DE RUTINA FALLBACK
// =============================================
function generarRutinaFallback(profile) {
  const esCasa = profile.trainingLocation === 'casa';
  const diasEntrenamiento = profile.trainingDaysPerWeek || 3;

  const ejerciciosCasa = {
    trenSuperior: [
      { nombre: "Flexiones", descripcion: "Flexiones de pecho en el suelo", series: 3, repeticiones: "10-15", descanso: "60 seg", musculos: ["pecho", "triceps"] },
      { nombre: "Flexiones diamante", descripcion: "Manos juntas en forma de diamante", series: 3, repeticiones: "8-12", descanso: "60 seg", musculos: ["triceps", "pecho"] },
      { nombre: "Fondos en silla", descripcion: "Apoya las manos en una silla y baja el cuerpo", series: 3, repeticiones: "10-12", descanso: "60 seg", musculos: ["triceps", "hombros"] },
      { nombre: "Pike push-ups", descripcion: "Flexiones en V invertida para hombros", series: 3, repeticiones: "8-10", descanso: "60 seg", musculos: ["hombros", "triceps"] },
      { nombre: "Plancha", descripcion: "Mantén la posición de plancha", series: 3, repeticiones: "30-45 seg", descanso: "45 seg", musculos: ["core", "hombros"] }
    ],
    trenInferior: [
      { nombre: "Sentadillas", descripcion: "Sentadillas con peso corporal", series: 4, repeticiones: "15-20", descanso: "60 seg", musculos: ["cuádriceps", "glúteos"] },
      { nombre: "Zancadas", descripcion: "Zancadas alternadas", series: 3, repeticiones: "12 cada pierna", descanso: "60 seg", musculos: ["cuádriceps", "glúteos"] },
      { nombre: "Sentadilla sumo", descripcion: "Piernas abiertas, puntas hacia afuera", series: 3, repeticiones: "15", descanso: "60 seg", musculos: ["aductores", "glúteos"] },
      { nombre: "Puente de glúteos", descripcion: "Eleva la cadera acostado boca arriba", series: 3, repeticiones: "15-20", descanso: "45 seg", musculos: ["glúteos", "isquiotibiales"] },
      { nombre: "Elevación de talones", descripcion: "De pie, sube y baja los talones", series: 3, repeticiones: "20", descanso: "45 seg", musculos: ["pantorrillas"] }
    ],
    fullBody: [
      { nombre: "Burpees", descripcion: "Ejercicio completo de cuerpo", series: 3, repeticiones: "8-10", descanso: "90 seg", musculos: ["full body"] },
      { nombre: "Mountain climbers", descripcion: "Escaladores en posición de plancha", series: 3, repeticiones: "30 seg", descanso: "60 seg", musculos: ["core", "cardio"] },
      { nombre: "Jumping jacks", descripcion: "Saltos abriendo brazos y piernas", series: 3, repeticiones: "30", descanso: "45 seg", musculos: ["cardio", "full body"] },
      { nombre: "Sentadilla con salto", descripcion: "Sentadilla explosiva con salto", series: 3, repeticiones: "10-12", descanso: "60 seg", musculos: ["piernas", "cardio"] },
      { nombre: "Plancha lateral", descripcion: "Plancha de lado, alterna", series: 3, repeticiones: "30 seg cada lado", descanso: "45 seg", musculos: ["oblicuos", "core"] }
    ]
  };

  const ejerciciosGym = {
    trenSuperior: [
      { nombre: "Press de banca", descripcion: "Press con barra o mancuernas", series: 4, repeticiones: "10-12", descanso: "90 seg", musculos: ["pecho", "triceps"] },
      { nombre: "Remo con barra", descripcion: "Remo inclinado con barra", series: 4, repeticiones: "10-12", descanso: "90 seg", musculos: ["espalda", "biceps"] },
      { nombre: "Press militar", descripcion: "Press de hombros con barra", series: 3, repeticiones: "10-12", descanso: "90 seg", musculos: ["hombros", "triceps"] },
      { nombre: "Curl de bíceps", descripcion: "Curl con mancuernas", series: 3, repeticiones: "12-15", descanso: "60 seg", musculos: ["biceps"] },
      { nombre: "Extensión de tríceps", descripcion: "Extensión en polea", series: 3, repeticiones: "12-15", descanso: "60 seg", musculos: ["triceps"] }
    ],
    trenInferior: [
      { nombre: "Sentadilla con barra", descripcion: "Sentadilla trasera con barra", series: 4, repeticiones: "8-10", descanso: "120 seg", musculos: ["cuádriceps", "glúteos"] },
      { nombre: "Peso muerto rumano", descripcion: "Peso muerto con piernas semi-rectas", series: 4, repeticiones: "10-12", descanso: "90 seg", musculos: ["isquiotibiales", "glúteos"] },
      { nombre: "Prensa de piernas", descripcion: "Prensa en máquina", series: 3, repeticiones: "12-15", descanso: "90 seg", musculos: ["cuádriceps", "glúteos"] },
      { nombre: "Extensión de cuádriceps", descripcion: "Extensión en máquina", series: 3, repeticiones: "12-15", descanso: "60 seg", musculos: ["cuádriceps"] },
      { nombre: "Curl de isquiotibiales", descripcion: "Curl en máquina", series: 3, repeticiones: "12-15", descanso: "60 seg", musculos: ["isquiotibiales"] }
    ],
    fullBody: [
      { nombre: "Peso muerto", descripcion: "Peso muerto convencional", series: 4, repeticiones: "6-8", descanso: "120 seg", musculos: ["espalda", "piernas", "core"] },
      { nombre: "Dominadas", descripcion: "Dominadas o jalón al pecho", series: 3, repeticiones: "8-10", descanso: "90 seg", musculos: ["espalda", "biceps"] },
      { nombre: "Press inclinado", descripcion: "Press con mancuernas inclinado", series: 3, repeticiones: "10-12", descanso: "90 seg", musculos: ["pecho superior"] },
      { nombre: "Zancadas con mancuernas", descripcion: "Zancadas caminando", series: 3, repeticiones: "12 cada pierna", descanso: "60 seg", musculos: ["piernas", "glúteos"] },
      { nombre: "Plancha con peso", descripcion: "Plancha con disco en la espalda", series: 3, repeticiones: "45-60 seg", descanso: "60 seg", musculos: ["core"] }
    ]
  };

  const ejercicios = esCasa ? ejerciciosCasa : ejerciciosGym;

  // Distribuir días de entrenamiento
  const distribucion = {
    3: [0, 2, 4], // Lunes, Miércoles, Viernes
    4: [0, 1, 3, 4], // Lunes, Martes, Jueves, Viernes
    5: [0, 1, 2, 3, 4], // Lunes a Viernes
    6: [0, 1, 2, 3, 4, 5] // Lunes a Sábado
  };
  // ===============================
  // MAPA DE ENFOQUES POR OBJETIVO
  // ===============================
  const enfoquePorDia = {
    tonificar: [
      'Tren superior (pecho, hombros y tríceps)',
      'Tren inferior (piernas y glúteos)',
      'Full body + core',
      'Espalda y bíceps',
      'Piernas + cardio ligero',
      'Full body metabólico'
    ],
    'ganar masa muscular': [
      'Pecho y tríceps',
      'Espalda y bíceps',
      'Piernas completas',
      'Hombros y core',
      'Piernas y glúteos',
      'Upper body'
    ],
    'bajar de peso': [
      'Full body + cardio HIIT',
      'Piernas + cardio',
      'Full body metabólico',
      'Core + cardio',
      'Circuito quema grasa',
      'HIIT + abdomen'
    ]
  };

  const diasEntreno = distribucion[diasEntrenamiento] || distribucion[3];
  const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const enfoques = [
    'Tren superior (pecho, hombros y tríceps)',
    'Tren inferior (piernas y glúteos)',
    'Full body + core',
    'Espalda y bíceps',
    'Piernas y glúteos',
    'Full body metabólico'
  ];
  const tiposEjercicio = ['trenSuperior', 'trenInferior', 'fullBody', 'trenSuperior', 'trenInferior', 'fullBody'];

  const dias = [];
  let contadorEntreno = 0;

  for (let i = 0; i < 7; i++) {
    if (diasEntreno.includes(i)) {
      const tipoHoy = tiposEjercicio[contadorEntreno % tiposEjercicio.length];
      const objetivo = profile.mainGoal || 'tonificar';
      const enfoquesObjetivo = enfoquePorDia[objetivo] || enfoquePorDia.tonificar;

      dias.push({
        dia: i + 1,
        nombre: nombresDias[i],
        esDescanso: false,
        enfoque: enfoquesObjetivo[contadorEntreno % enfoquesObjetivo.length],
        descripcion: `Entrenamiento enfocado en ${enfoquesObjetivo[contadorEntreno % enfoquesObjetivo.length].toLowerCase()}`,
          duracionTotal: 45,
          caloriasEstimadas: 300,
          ejercicios: ejercicios[tipoHoy]
        });
      contadorEntreno++;
    } else {
      dias.push({
        dia: i + 1,
        nombre: nombresDias[i],
        esDescanso: true,
        mensaje: "Día de recuperación. Descansa, hidrátate y prepárate para tu próximo entrenamiento. 💪"
      });
    }
  }

  return {
    nombreRutina: `Rutina ${profile.mainGoal || 'Fitness'} - ${diasEntrenamiento} días`,
    descripcion: `Rutina personalizada para ${profile.mainGoal || 'mejorar tu condición física'} entrenando en ${esCasa ? 'casa' : 'gimnasio'}`,
    dias: dias
  };
}
app.post("/api/guardar-rutina", protect, catchAsync(async (req, res) => {
  const { userId, rutina } = req.body;

  console.log('📥 Guardando rutina...');

  if (!userId || !rutina) {
    throw new AppError('Faltan datos: userId y rutina requeridos', 400);
  }

  // ✅ SECURITY: Validar ownership
  if (req.user._id.toString() !== userId) {
    throw new AppError('No autorizado para guardar rutina de otro usuario', 403);
  }

  // 🔥 USAR findByIdAndUpdate EN VEZ DE user.save()
  // Esto NO valida todo el documento, solo actualiza los campos
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        rutinaSemanal: rutina.dias || rutina,
        diaActualIndex: 0,
        cicloActual: 1,
        diasCompletadosEsteCiclo: 0,
        fechaInicioRutina: new Date()
      }
    },
    {
      new: true,
      runValidators: false,  // ← NO valida el documento completo
      strict: false
    }
  );

  console.log('✅ Rutina guardada en MongoDB');
  console.log(`   📊 Total días: ${updated.rutinaSemanal.length}`);

  res.json({
    success: true,
    message: "Rutina guardada exitosamente",
    data: {
      totalDias: updated.rutinaSemanal.length
    }
  });
}));

// =============================================
// OBTENER RUTINA GUARDADA DEL USUARIO
// =============================================
app.get("/api/obtener-rutina/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🔍 Buscando rutina guardada para usuario: ${userId}`);

    const user = await User.findById(userId).select('rutinaSemanal cicloActual diaEnRutina');

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.rutinaSemanal || user.rutinaSemanal.length === 0) {
      console.log(`ℹ️ Usuario ${userId} no tiene rutina guardada`);
      return res.status(404).json({
        success: false,
        message: 'Usuario no tiene rutina guardada'
      });
    }

    const rutinaCompleta = {
      nombreRutina: `Mi Rutina Personalizada`,
      descripcion: 'Rutina generada con IA',
      dias: user.rutinaSemanal,
      cicloActual: user.cicloActual || 1,
      diaEnRutina: user.diaEnRutina || 1
    };

    console.log(`✅ Rutina encontrada: ${user.rutinaSemanal.length} días`);

    res.json({
      success: true,
      message: 'Rutina cargada exitosamente',
      rutina: rutinaCompleta
    });

  } catch (error) {
    console.error('❌ Error al obtener rutina:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

console.log('✅ Endpoint de obtener rutina configurado');

// =============================================
// 🏆 RUTA: OBTENER LOGROS DEL USUARIO
// =============================================
app.get("/api/logros/:userId", protect, catchAsync(async (req, res) => {
  const { userId } = req.params;

  // ✅ SECURITY: Validar que el usuario autenticado solo puede acceder a sus propios datos
  if (req.user._id.toString() !== userId) {
    throw new AppError('No autorizado para acceder a estos datos', 403);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Lista completa de logros posibles
  const todosLosLogros = [
    {
      id: 'first_workout',
      icon: '🎯',
      nombre: 'Primera Rutina',
      descripcion: 'Completaste tu primera sesión',
      condition: user.fitnessStats.totalWorkouts >= 1
    },
    {
      id: 'week_streak',
      icon: '🔥',
      nombre: 'Racha de 7 días',
      descripcion: 'Una semana sin parar',
      condition: user.fitnessStats.currentStreak >= 7
    },
    {
      id: 'ten_workouts',
      icon: '💪',
      nombre: 'Dedicación',
      descripcion: '10 rutinas completadas',
      condition: user.fitnessStats.totalWorkouts >= 10
    },
    {
      id: 'fifty_workouts',
      icon: '👑',
      nombre: 'Guerrero',
      descripcion: '50 rutinas completadas',
      condition: user.fitnessStats.totalWorkouts >= 50
    },
    {
      id: 'month_streak',
      icon: '🌟',
      nombre: 'Leyenda',
      descripcion: 'Racha de 30 días',
      condition: user.fitnessStats.currentStreak >= 30
    },
    {
      id: 'hundred_exercises',
      icon: '🏆',
      nombre: 'Incansable',
      descripcion: '100 ejercicios completados',
      condition: user.fitnessStats.totalExercises >= 100
    },
    {
      id: 'consistency',
      icon: '📅',
      nombre: 'Consistente',
      descripcion: '4 semanas seguidas entrenando',
      condition: user.fitnessStats.maxStreak >= 28
    }
  ];

  // Marcar cuáles están desbloqueados
  const logrosConEstado = todosLosLogros.map(logro => {
    const desbloqueado = user.fitnessStats.achievements.find(
      a => a.achievementId === logro.id
    );

    return {
      ...logro,
      unlocked: logro.condition,
      unlockedAt: desbloqueado?.unlockedAt || null
    };
  });

  res.json({
    success: true,
    data: {
      achievements: logrosConEstado,
      totalUnlocked: logrosConEstado.filter(l => l.unlocked).length,
      totalPossible: todosLosLogros.length
    }
  });
}));

// =============================================
// 📊 RUTA: DATOS PARA GRÃFICOS
// =============================================
app.get("/api/estadisticas/graficos/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const workouts = user.fitnessStats.workoutHistory;

    // Datos para gráfico semanal (por día de la semana)
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const countsPorDia = [0, 0, 0, 0, 0, 0, 0];

    workouts.forEach(w => {
      const day = new Date(w.date).getDay();
      const adjustedDay = day === 0 ? 6 : day - 1;
      countsPorDia[adjustedDay]++;
    });

    // Datos para gráfico mensual (últimas 4 semanas)
    const now = new Date();
    const semanasCounts = [0, 0, 0, 0];

    workouts.forEach(w => {
      const workoutDate = new Date(w.date);
      const weeksDiff = Math.floor((now - workoutDate) / (1000 * 60 * 60 * 24 * 7));

      if (weeksDiff >= 0 && weeksDiff < 4) {
        semanasCounts[3 - weeksDiff]++;
      }
    });

    // Distribución por enfoque
    const enfoques = {};
    workouts.forEach(w => {
      const enfoque = w.enfoque;
      enfoques[enfoque] = (enfoques[enfoque] || 0) + 1;
    });

    // Distribución por horario
    const horarios = {
      'Mañana (5-12)': 0,
      'Mediodía (12-17)': 0,
      'Tarde (17-21)': 0,
      'Noche (21-5)': 0
    };

    workouts.forEach(w => {
      const hour = new Date(w.date).getHours();

      if (hour >= 5 && hour < 12) {
        horarios['Mañana (5-12)']++;
      } else if (hour >= 12 && hour < 17) {
        horarios['Mediodía (12-17)']++;
      } else if (hour >= 17 && hour < 21) {
        horarios['Tarde (17-21)']++;
      } else {
        horarios['Noche (21-5)']++;
      }
    });

    res.json({
      success: true,
      data: {
        weekly: {
          labels: diasSemana,
          data: countsPorDia
        },
        monthly: {
          labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
          data: semanasCounts
        },
        focus: {
          labels: Object.keys(enfoques),
          data: Object.values(enfoques)
        },
        time: {
          labels: Object.keys(horarios),
          data: Object.values(horarios)
        }
      }
    });

  } catch (error) {
    console.error("❌ Error obteniendo datos de gráficos:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos de gráficos"
    });
  }
});

console.log('✅ Endpoints de estadísticas configurados:');
console.log('   📝 POST /api/entrenamientos/registrar - Registrar entrenamiento');
console.log('   📊 GET /api/estadisticas/:userId - Obtener estadísticas');
console.log('   📅 GET /api/entrenamientos/historial/:userId - Historial');
console.log('   🏆 GET /api/logros/:userId - Obtener logros');
console.log('   📈 GET /api/estadisticas/graficos/:userId - Datos gráficos');

console.log('✅ Rutas de Entrenador IA configuradas:');
console.log('   🏋️ POST /api/generar-rutina - Genera rutina con IA');
console.log('   💾 POST /api/guardar-rutina - Guarda rutina del usuario');

console.log('✅ Rutas API configuradas:');
console.log('   📱 /api/products - Gestión de productos');
console.log('   🔐 /api/auth - Autenticación y usuarios');
console.log('   📋 /api/questionnaire - Cuestionario fitness');
console.log('   💬 /api/chat - Chat IA fitness coach');
console.log('   🏥 /api/health - Estado del servidor');

// =============================================
// MIDDLEWARE DE MANEJO DE ERRORES (AL FINAL)
// =============================================
// =============================================
// RUTAS PARA EDICIÓN DE PERFIL - FITAIID
// Pegar en app.js ANTES de app.use(notFound)
// =============================================

// ─── GET datos del usuario (nombre, email) ──────────────────────────────────
app.get("/api/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('firstName lastName email username');

    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username || ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT actualizar datos personales ────────────────────────────────────────
app.put("/api/user/:userId", async (req, res) => {
  try {
    const { name, username, firstName, lastName } = req.body;

    // Verificar username único
    if (username) {
      const existe = await User.findOne({
        username,
        _id: { $ne: req.params.userId }
      });
      if (existe) {
        return res.json({ success: false, message: "Ese username ya está en uso" });
      }
    }

    // Construir objeto de actualización
    const actualizacion = {};
    if (username !== undefined) actualizacion.username = username;
    if (firstName !== undefined) actualizacion.firstName = firstName;
    if (lastName !== undefined) actualizacion.lastName = lastName;

    // Si viene "name" como string completo, separarlo
    if (name && !firstName && !lastName) {
      const partes = name.trim().split(' ');
      actualizacion.firstName = partes[0];
      actualizacion.lastName = partes.slice(1).join(' ') || '';
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: actualizacion },
      { new: true, runValidators: false }
    ).select('firstName lastName email username');

    if (!user) return res.json({ success: false, message: "Usuario no encontrado" });

    res.json({
      success: true,
      message: "Datos personales actualizados",
      data: {
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ❌ ENDPOINT PUT DUPLICADO ELIMINADO:
// - app.put("/api/questionnaire/:userId") - Usar routes/questionnaire.js
// Este endpoint está centralizado en routes/questionnaire.js con autenticación JWT
// Usuario admin: 
const jwt = require('jsonwebtoken');

// ─── MIDDLEWARE: Verificar que el usuario es admin ──────────────────────────
function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
    }

    req.adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

// ─── GET /api/admin/users — Listar todos los usuarios ───────────────────────
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const { role, status, level, search, page = 1, limit = 50 } = req.query;

    // Construir filtros dinámicos
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (level && level !== 'all') filter['fitnessProfile.fitnessLevel'] = level;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -verificationToken -verificationCode -resetPasswordCode -verificationCodeExpires -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    console.log(`✅ Admin solicitó usuarios: ${users.length} resultados`);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (err) {
    console.error('❌ Error en GET /api/admin/users:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/stats — KPIs del dashboard ──────────────────────────────
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      profileCompleted,
      totalWorkoutsAgg,
      levelDistrib,
      goalDistrib,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ 'fitnessProfile.questionnaireCompleted': true }),

      // Total de rutinas completadas en toda la plataforma
      User.aggregate([
        { $group: { _id: null, total: { $sum: '$fitnessStats.totalWorkouts' } } }
      ]),

      // Distribución por nivel fitness
      User.aggregate([
        { $match: { 'fitnessProfile.questionnaireCompleted': true } },
        { $group: { _id: '$fitnessProfile.fitnessLevel', count: { $sum: 1 } } }
      ]),

      // Distribución por objetivo
      User.aggregate([
        { $match: { 'fitnessProfile.questionnaireCompleted': true } },
        { $group: { _id: '$fitnessProfile.mainGoal', count: { $sum: 1 } } }
      ]),

      // Últimos 5 registrados
      User.find()
        .select('firstName lastName email role createdAt isActive fitnessProfile.fitnessLevel')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calcular racha promedio
    const streakAgg = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgStreak: { $avg: '$fitnessStats.currentStreak' } } }
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          profileCompleted,
          totalWorkouts: totalWorkoutsAgg[0]?.total || 0,
          avgStreak: parseFloat((streakAgg[0]?.avgStreak || 0).toFixed(1))
        },
        levelDistribution: levelDistrib,
        goalDistribution: goalDistrib,
        recentUsers
      }
    });

  } catch (err) {
    console.error('❌ Error en GET /api/admin/stats:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/admin/users/:userId/status — Activar/Suspender usuario ───────
app.patch('/api/admin/users/:userId/status', verifyAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { isActive } },
      { new: true }
    ).select('firstName lastName email isActive');

    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    console.log(`✅ Admin ${isActive ? 'activó' : 'suspendió'} a: ${user.email}`);
    res.json({ success: true, message: `Usuario ${isActive ? 'activado' : 'suspendido'}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/admin/users/:userId/role — Cambiar rol de usuario ─────────
app.patch('/api/admin/users/:userId/role', verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    const validRoles = ['customer', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { role } },
      { new: true }
    ).select('firstName lastName email role');

    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    console.log(`✅ Admin cambió rol de ${user.email} a: ${role}`);
    res.json({ success: true, message: `Rol actualizado a ${role}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

console.log('✅ Rutas ADMIN configuradas:');
console.log('   👥 GET    /api/admin/users           — Listar usuarios');
console.log('   📊 GET    /api/admin/stats           — KPIs del dashboard');
console.log('   ⛔ PATCH  /api/admin/users/:id/status — Activar/Suspender');
console.log('   🎭 PATCH  /api/admin/users/:id/role   — Cambiar rol');

// Middleware para rutas no encontradas (404)
app.use(notFound);
// Middleware de manejo global de errores
app.use(errorHandler);


// =============================================
// ENDPOINT: REGISTRAR ENTRENAMIENTO
// =============================================
app.post('/api/entrenamientos/registrar', async (req, res) => {
  try {
    console.log('📝 Registrando entrenamiento...');

    const { userId, entrenamientoData } = req.body;

    // Validaciones
    if (!userId || !entrenamientoData) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    // Buscar usuario
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log(`👤 Usuario: ${user.name}`);
    console.log(`🏋️ Entrenamiento: ${entrenamientoData.enfoque}`);

    // ========================================
    // GUARDAR ENTRENAMIENTO EN LA BASE DE DATOS
    // ========================================

    const nuevoEntrenamiento = {
      date: new Date(),
      enfoque: entrenamientoData.enfoque || 'General',
      duracion: entrenamientoData.duracion || 0,
      ejerciciosCompletados: entrenamientoData.ejercicios || []
    };

    // Agregar al historial
    if (!user.fitnessStats.workoutHistory) {
      user.fitnessStats.workoutHistory = [];
    }
    user.fitnessStats.workoutHistory.push(nuevoEntrenamiento);

    // Actualizar estadísticas
    const statsAnteriores = {
      totalWorkouts: user.fitnessStats.totalWorkouts || 0,
      currentStreak: user.fitnessStats.currentStreak || 0,
      totalExercises: user.fitnessStats.totalExercises || 0
    };

    user.fitnessStats.totalWorkouts = (user.fitnessStats.totalWorkouts || 0) + 1;
    user.fitnessStats.totalExercises = (user.fitnessStats.totalExercises || 0) +
      (entrenamientoData.ejercicios?.length || 0);
    user.fitnessStats.lastWorkoutDate = new Date();

    // Calcular racha
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const ultimoEntrenamiento = user.fitnessStats.workoutHistory
      .filter(w => w.date < hoy)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (ultimoEntrenamiento) {
      const ultimaFecha = new Date(ultimoEntrenamiento.date);
      ultimaFecha.setHours(0, 0, 0, 0);

      if (ultimaFecha.getTime() === ayer.getTime()) {
        // Continúa la racha
        user.fitnessStats.currentStreak = (user.fitnessStats.currentStreak || 0) + 1;
      } else if (ultimaFecha.getTime() < ayer.getTime()) {
        // Racha rota
        user.fitnessStats.currentStreak = 1;
      }
    } else {
      // Primer entrenamiento
      user.fitnessStats.currentStreak = 1;
    }

    // Actualizar racha máxima
    if (user.fitnessStats.currentStreak > (user.fitnessStats.maxStreak || 0)) {
      user.fitnessStats.maxStreak = user.fitnessStats.currentStreak;
    }

    // Guardar en base de datos
    await user.save();
    // =============================================
    // 🔄 LÓGICA DE RESET DE CICLO SEMANAL
    // =============================================
    const diaRutinaIndex = req.body.workoutData?.diaIndex ?? -1;

    if (user.rutinaSemanal && user.rutinaSemanal.length > 0 && diaRutinaIndex >= 0) {
      // Marcar el día completado en la rutina semanal
      if (user.rutinaSemanal[diaRutinaIndex]) {
        user.rutinaSemanal[diaRutinaIndex].completado = true;
        user.rutinaSemanal[diaRutinaIndex].fechaCompletado = new Date();
        user.markModified('rutinaSemanal');
      }

      // Verificar si TODOS los días de entrenamiento están completados
      const diasEntrenamiento = user.rutinaSemanal.filter(d => !d.esDescanso);
      const todosCompletados = diasEntrenamiento.every(d => d.completado === true);

      if (todosCompletados) {
        console.log('🔄 ¡Ciclo semanal completado! Reiniciando rutina...');

        // Guardar semana completada en historial
        if (!user.routineHistory) user.routineHistory = [];
        user.routineHistory.push({
          fechaCompletado: new Date(),
          semana: user.rutinaSemanal.map(d => ({
            nombre: d.nombre,
            enfoque: d.enfoque || 'Descanso',
            completado: d.completado,
            fechaCompletado: d.fechaCompletado
          }))
        });

        // Reiniciar todos los días
        user.rutinaSemanal = user.rutinaSemanal.map(dia => {
          const diaObj = dia.toObject ? dia.toObject() : { ...dia };
          diaObj.completado = false;
          diaObj.fechaCompletado = null;
          diaObj.registrado = false;
          if (diaObj.ejercicios) {
            diaObj.ejercicios = diaObj.ejercicios.map(ej => ({
              ...(ej.toObject ? ej.toObject() : { ...ej }),
              completado: false
            }));
          }
          return diaObj;
        });

        user.markModified('rutinaSemanal');
        await user.save();

        console.log('✅ Rutina reiniciada exitosamente');

        // ⚠️ Responder aquí con cicloReiniciado: true y salir
        return res.status(201).json({
          success: true,
          cicloReiniciado: true,
          message: '¡Semana completada! La rutina se reinició para la próxima semana 🔄',
          data: {
            totalWorkouts: user.fitnessStats.totalWorkouts,
            currentStreak: user.fitnessStats.currentStreak,
            maxStreak: user.fitnessStats.maxStreak,
            totalExercises: user.fitnessStats.totalExercises
          }
        });
      }

      // Si no se completó el ciclo, guardar el día marcado
      await user.save();
    }
    console.log('✅ Entrenamiento guardado en DB');
    console.log(`📊 Stats actualizadas:`);
    console.log(`   Total entrenamientos: ${statsAnteriores.totalWorkouts} → ${user.fitnessStats.totalWorkouts}`);
    console.log(`   Racha actual: ${statsAnteriores.currentStreak} → ${user.fitnessStats.currentStreak}`);

    // ========================================
    // DISPARAR NOTIFICACIONES AUTOMÁTICAS
    // ========================================

    console.log('');
    console.log('================================');
    console.log('🔔 INICIANDO SISTEMA DE NOTIFICACIONES');
    console.log('================================');
    console.log('📋 UserId:', userId);
    console.log('📋 Entrenamiento:', entrenamientoData);

    try {
      console.log('');
      console.log('⏳ Cargando notificationTriggers...');
      const notificationTriggers = require('./services/notificationTriggers');
      console.log('✅ notificationTriggers cargado correctamente');

      console.log('');
      console.log('⏳ Ejecutando onEntrenamientoCompletado...');

      const resultado = await notificationTriggers.onEntrenamientoCompletado(userId, {
        id: nuevoEntrenamiento._id,
        nombre: entrenamientoData.nombre || 'Entrenamiento',
        duracion: entrenamientoData.duracionTotal || entrenamientoData.duracion || 0,
        calorias: entrenamientoData.caloriasEstimadas || 0,
        tipo: entrenamientoData.enfoque || 'General'
      });

      console.log('✅ onEntrenamientoCompletado ejecutado');
      console.log('📋 Resultado:', resultado);

    } catch (error) {
      console.error('');
      console.error('❌❌❌ ERROR EN TRIGGER ❌❌❌');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }

    console.log('');
    console.log('================================');
    console.log('✅ FIN SISTEMA DE NOTIFICACIONES');
    console.log('================================');
    console.log('');

    // ========================================
    // RESPONDER AL CLIENTE
    // ========================================

    res.status(201).json({
      success: true,
      message: 'Entrenamiento registrado exitosamente',
      data: {
        totalWorkouts: user.fitnessStats.totalWorkouts,
        currentStreak: user.fitnessStats.currentStreak,
        maxStreak: user.fitnessStats.maxStreak,
        totalExercises: user.fitnessStats.totalExercises
      }
    });

  } catch (error) {
    console.error('❌ Error registrando entrenamiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

console.log('✅ Endpoint de entrenamientos configurado con notificaciones');
console.log('   📍 POST /api/entrenamientos/registrar');
console.log('   🔔 Notificaciones automáticas: rutina completada, rachas, logros');


module.exports = app;

// =============================================
// MANEJO DE CIERRE GRACEFUL
// =============================================

process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor gracefully...');
  notificationScheduler.stopAllJobs();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor gracefully...');
  notificationScheduler.stopAllJobs();
  process.exit(0);
});