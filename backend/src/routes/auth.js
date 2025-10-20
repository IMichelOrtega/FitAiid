// =============================================
// RUTAS DE AUTENTICACIÓN - TECHSTORE PRO
// =============================================

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

module.exports = router;