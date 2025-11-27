// =============================================
// RUTAS DE AUTENTICACIÓN - TECHSTORE PRO
// =============================================
const User = require('../models/User');
const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');
const { 
    registerValidation, 
    loginValidation, 
    updateProfileValidation,
    handleValidationErrors 
} = require('../validators/authValidators');  // ✨ NUEVO

// Importar controladores
const {
    register,
    login,
    getProfile,
    updateProfile
} = require('../controllers/authController');

console.log('🔐 Inicializando rutas de autenticación');

// =============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// =============================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Público
 * @body    { firstName, lastName, email, password, phone?, role? }
 */
// Registro con validación
    router.post('/register', 
    authLimiter,              // 1. Rate limiting
    registerValidation,        // 2. Validar datos
    handleValidationErrors,    // 3. Manejar errores
    authController.register    // 4. Controlador
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario (devuelve token JWT)
 * @access  Público
 * @body    { email, password }
 */
// Login con validación
    router.post('/login', 
    authLimiter,
    loginValidation,
    handleValidationErrors,
    authController.login
);

// =============================================
// RUTAS PRIVADAS (REQUIEREN AUTENTICACIÓN)
// =============================================
// TODO: En Parte 3C3 agregaremos middleware de autenticación
// Por ahora funcionan sin middleware para testing

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado (requiere token)
 * @query   userId (temporal para testing)
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Privado (requiere token)
 * @query   userId (temporal para testing)
 * @body    { firstName?, lastName?, phone?, address?, etc }
 */
// Actualizar perfil con validación
    router.put('/profile',
    updateProfileValidation,
    handleValidationErrors,
    updateProfile
);

// =============================================
// LOG DE RUTAS CONFIGURADAS
// =============================================

console.log('✅ Rutas de autenticación configuradas:');
console.log('   📝 POST /api/auth/register - Crear cuenta');
console.log('   🔐 POST /api/auth/login - Iniciar sesión');
console.log('   👤 GET /api/auth/profile - Ver perfil');
console.log('   ✏️ PUT /api/auth/profile - Actualizar perfil');
console.log('   🔑 POST /api/auth/forgot-password - Solicitar código');
console.log('   ✅ POST /api/auth/verify-code - Verificar código');
console.log('   🔐 POST /api/auth/reset-password - Nueva contraseña');
module.exports = router;

/**
 * @route   POST /api/auth/google
 * @desc    Login o registro con Google
 * @access  Público
 * @body    { firstName, lastName, email }
 */
console.log("👉 authController.googleLogin =", authController.googleLogin);

router.post('/google', authController.googleLogin);

router.get('/verify-email', authController.verifyEmail);

// =============================================
// RUTAS DE RECUPERACIÓN DE CONTRASEÑA
// =============================================

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Enviar código de recuperación al email
 * @access  Público
 * @body    { email }
 */
router.post('/forgot-password', 
    authLimiter,
    authController.forgotPassword
);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Verificar código de recuperación
 * @access  Público
 * @body    { email, code }
 */
router.post('/verify-code',
    authLimiter,
    authController.verifyResetCode
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con código válido
 * @access  Público
 * @body    { email, code, password }
 */
router.post('/reset-password',
    authLimiter,
    authController.resetPassword
);