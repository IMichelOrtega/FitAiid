// backend/src/validators/authValidators.js

const { body, validationResult } = require('express-validator');

console.log('🔍 Inicializando validadores de autenticación');

// =====================================================
// REGLAS DE VALIDACIÓN PARA REGISTRO
// =====================================================

const registerValidation = [
    // VALIDAR NOMBRE
    body('firstName')
        .trim()  // Eliminar espacios al inicio/final
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios')
        .escape(),  // Sanitizar caracteres HTML
    
    // VALIDAR APELLIDO
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('El apellido es obligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios')
        .escape(),
    
    // VALIDAR EMAIL
    body('email')
        .trim()
        .notEmpty()
        .withMessage('El email es obligatorio')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail()  // Convertir a formato estándar
        .isLength({ max: 100 })
        .withMessage('El email no puede exceder 100 caracteres')
        .toLowerCase(),  // Convertir a minúsculas
    
    // VALIDAR PASSWORD
    body('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isLength({ min: 8, max: 100 })
        .withMessage('La contraseña debe tener entre 8 y 100 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
        .not()
        .isIn(['12345678', 'password', 'Password123', 'qwerty'])
        .withMessage('Contraseña muy común, elige una más segura'),
    
    // VALIDAR TELÉFONO (OPCIONAL)
    body('phone')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage('El teléfono debe tener 10 dígitos numéricos')
];

// =====================================================
// REGLAS DE VALIDACIÓN PARA LOGIN
// =====================================================

const loginValidation = [
    // VALIDAR EMAIL
    body('email')
        .trim()
        .notEmpty()
        .withMessage('El email es obligatorio')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail()
        .toLowerCase(),
    
    // VALIDAR PASSWORD
    body('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isLength({ min: 1 })
        .withMessage('La contraseña no puede estar vacía')
];

// =====================================================
// REGLAS DE VALIDACIÓN PARA ACTUALIZAR PERFIL
// =====================================================

const updateProfileValidation = [
    // TODOS LOS CAMPOS SON OPCIONALES
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios')
        .escape(),
    
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios')
        .escape(),
    
    body('phone')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage('El teléfono debe tener 10 dígitos numéricos'),
    
    body('address')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres')
        .escape()
];

// =====================================================
// MIDDLEWARE PARA MANEJAR ERRORES DE VALIDACIÓN
// =====================================================

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        console.log('❌ Errores de validación encontrados:');
        console.log(JSON.stringify(errors.array(), null, 2));
        
        // Formatear errores de forma más amigable
        const formattedErrors = errors.array().map(error => ({
            campo: error.path,
            mensaje: error.msg,
            valorRecibido: error.value
        }));
        
        return res.status(400).json({
            success: false,
            error: 'Error de validación',
            message: 'Los datos proporcionados no son válidos',
            errores: formattedErrors,
            total: formattedErrors.length
        });
    }
    
    console.log('✅ Validación exitosa - Datos correctos');
    next();
};

// =====================================================
// EXPORTAR VALIDADORES
// =====================================================

module.exports = {
    registerValidation,
    loginValidation,
    updateProfileValidation,
    handleValidationErrors
};

console.log('✅ Validadores de autenticación exportados');
console.log('📋 Validaciones disponibles:');
console.log('   • registerValidation - Para registro de usuarios');
console.log('   • loginValidation - Para login');
console.log('   • updateProfileValidation - Para actualizar perfil');
console.log('   • handleValidationErrors - Middleware de manejo de errores');