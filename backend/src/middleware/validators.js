// =============================================
// MIDDLEWARE: VALIDACIONES CENTRALIZADAS
// Express-validator para todas las rutas
// =============================================

const { body, param, query, validationResult } = require('express-validator');

// =============================================
// VALIDACIONES: AUTENTICACIÓN
// =============================================

const validateRegister = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres')
    .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
];

const validatePasswordReset = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
];

// =============================================
// VALIDACIONES: CUESTIONARIO FITNESS
// =============================================

const validateQuestionnaire = [
  param('userId')
    .notEmpty().withMessage('userId es requerido')
    .matches(/^[0-9a-fA-F]{24}$/).withMessage('userId debe ser un MongoDB ID válido'),
  
  body('gender')
    .notEmpty().withMessage('El género es obligatorio')
    .isIn(['hombre', 'mujer']).withMessage('Género debe ser "hombre" o "mujer"'),
  
  body('age')
    .notEmpty().withMessage('La edad es obligatoria')
    .isInt({ min: 14, max: 100 }).withMessage('La edad debe estar entre 14 y 100 años'),
  
  body('height')
    .notEmpty().withMessage('La altura es obligatoria')
    .isInt({ min: 100, max: 250 }).withMessage('La altura debe estar entre 100 y 250 cm'),
  
  body('weight')
    .notEmpty().withMessage('El peso es obligatorio')
    .isInt({ min: 30, max: 300 }).withMessage('El peso debe estar entre 30 y 300 kg'),
  
  body('fitnessLevel')
    .notEmpty().withMessage('El nivel de fitness es obligatorio')
    .isIn(['principiante', 'intermedio', 'avanzado']).withMessage('Nivel inválido'),
  
  body('mainGoal')
    .notEmpty().withMessage('El objetivo es obligatorio')
    .isIn(['tonificar', 'ganar masa muscular', 'bajar de peso']).withMessage('Objetivo inválido'),
  
  body('medicalConditions')
    .trim()
    .notEmpty().withMessage('Las condiciones médicas son necesarias'),
  
  body('trainingLocation')
    .notEmpty().withMessage('La ubicación de entrenamiento es obligatoria')
    .isIn(['casa', 'gym']).withMessage('Ubicación debe ser "casa" o "gym"'),
  
  body('trainingDaysPerWeek')
    .notEmpty().withMessage('Los días de entrenamiento son obligatorios')
    .isInt({ min: 1, max: 7 }).withMessage('Días debe estar entre 1 y 7'),
  
  body('sessionDuration')
    .notEmpty().withMessage('La duración de sesión es obligatoria')
    .matches(/^(\d+\s)?(min|hr)$/).withMessage('Formato: "30 min" o "1 hr"')
];

// =============================================
// VALIDACIONES: GENERACIÓN DE RUTINA
// =============================================

const validateGenerateRoutine = [
  body('userId')
    .notEmpty().withMessage('userId es requerido')
    .matches(/^[0-9a-fA-F]{24}$/).withMessage('userId debe ser un MongoDB ID válido'),
  
  body('profile')
    .notEmpty().withMessage('El perfil es obligatorio')
    .isObject().withMessage('El perfil debe ser un objeto')
];

// =============================================
// VALIDACIONES: ENTRENAMIENTOS
// =============================================

const validateWorkoutRegistration = [
  body('userId')
    .notEmpty().withMessage('userId es requerido')
    .matches(/^[0-9a-fA-F]{24}$/).withMessage('userId debe ser un MongoDB ID válido'),
  
  body('workoutData.nombre')
    .notEmpty().withMessage('El nombre del entrenamiento es obligatorio'),
  
  body('workoutData.duracionTotal')
    .notEmpty().withMessage('La duración es obligatoria')
    .isInt({ min: 1 }).withMessage('La duración debe ser positiva'),
  
  body('workoutData.ejercicios')
    .notEmpty().withMessage('Los ejercicios son obligatorios')
    .isArray().withMessage('Los ejercicios deben ser un array')
];

// =============================================
// VALIDACIONES: PERFIL DE USUARIO
// =============================================

const validateUpdateProfile = [
  param('userId')
    .notEmpty().withMessage('userId es requerido')
    .matches(/^[0-9a-fA-F]{24}$/).withMessage('userId debe ser un MongoDB ID válido'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener 2-50 caracteres'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('age')
    .optional()
    .isInt({ min: 14, max: 100 }).withMessage('La edad debe estar entre 14 y 100')
];

// =============================================
// VALIDACIONES: CHAT/MENSAJES
// =============================================

const validateChatMessage = [
  body('message')
    .trim()
    .notEmpty().withMessage('El mensaje no puede estar vacío')
    .isLength({ min: 1, max: 1000 }).withMessage('El mensaje debe tener 1-1000 caracteres'),
  
  body('userId')
    .notEmpty().withMessage('userId es requerido')
    .matches(/^[0-9a-fA-F]{24}$/).withMessage('userId debe ser un MongoDB ID válido')
];

// =============================================
// MIDDLEWARE: MANEJO DE ERRORES DE VALIDACIÓN
// =============================================

/**
 * Middleware que valida los errores y retorna respuesta JSON
 * Debe usarse DESPUÉS de los validadores
 * 
 * Uso: router.post('/endpoint', validateXXX, handleValidationErrors, controller)
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: formattedErrors
    });
  }
  
  next();
};

// =============================================
// EXPORTAR VALIDACIONES
// =============================================

module.exports = {
  // Auth
  validateRegister,
  validateLogin,
  validatePasswordReset,
  
  // Questionnaire
  validateQuestionnaire,
  
  // Routine
  validateGenerateRoutine,
  
  // Workouts
  validateWorkoutRegistration,
  
  // Profile
  validateUpdateProfile,
  
  // Chat
  validateChatMessage,
  
  // Middleware
  handleValidationErrors
};
