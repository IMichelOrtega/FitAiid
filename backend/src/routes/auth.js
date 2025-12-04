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
} = require('../validators/authValidators');

// Importar controladores
const {
    register,
    login,
    getProfile,
    updateProfile
} = require('../controllers/authController');

console.log('🔧 Inicializando rutas de autenticación');

// =============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// =============================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Público
 */
router.post('/register', 
    authLimiter,
    registerValidation,
    handleValidationErrors,
    authController.register
);

/**
 * @route   POST /api/auth/register-with-code
 * @desc    Registrar usuario con código de verificación
 * @access  Público
 */
router.post('/register-with-code',
    authLimiter,
    registerValidation,
    handleValidationErrors,
    authController.registerWithCode
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Público
 */
router.post('/login', 
    authLimiter,
    loginValidation,
    handleValidationErrors,
    authController.login
);

/**
 * @route   POST /api/auth/google
 * @desc    Login o registro con Google
 * @access  Público
 */
router.post('/google', authController.googleLogin);
router.post('/google-register', authController.googleRegister);
/**
 * @route   POST /api/auth/verify-registration
 * @desc    Verificar código de registro
 * @access  Público
 */
router.post('/verify-registration',
    authLimiter,
    authController.verifyRegistrationCode
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Reenviar código de verificación
 * @access  Público
 */
router.post('/resend-verification',
    authLimiter,
    authController.resendVerificationCode
);

// =============================================
// 🔐 RUTAS DE RECUPERACIÓN DE CONTRASEÑA
// =============================================

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Enviar código de recuperación al email
 * @access  Público
 */
router.post('/forgot-password', 
    authLimiter,
    authController.forgotPassword
);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Verificar código de recuperación
 * @access  Público
 */
router.post('/verify-code',
    authLimiter,
    authController.verifyResetCode
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con código válido
 * @access  Público
 */
router.post('/reset-password',
    authLimiter,
    authController.resetPassword
);

// =============================================
// RUTAS PRIVADAS (REQUIEREN AUTENTICACIÓN)
// =============================================

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Privado
 */
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
console.log('   📝 POST /api/auth/register-with-code - Registro con código');
console.log('   🔑 POST /api/auth/login - Iniciar sesión');
console.log('   🔵 POST /api/auth/google - Login con Google');
console.log('   ✅ POST /api/auth/verify-registration - Verificar registro');
console.log('   📧 POST /api/auth/resend-verification - Reenviar código');
console.log('   🔐 POST /api/auth/forgot-password - Solicitar código recuperación');
console.log('   ✅ POST /api/auth/verify-code - Verificar código recuperación');
console.log('   🔄 POST /api/auth/reset-password - Nueva contraseña');
console.log('   👤 GET /api/auth/profile - Ver perfil');
console.log('   ✏️ PUT /api/auth/profile - Actualizar perfil');

// =============================================
// ⚠️ IMPORTANTE: EXPORTAR AL FINAL
// =============================================
module.exports = router;