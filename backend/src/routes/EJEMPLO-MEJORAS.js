// =============================================
// EJEMPLO DE MEJORA: USO DE VALIDADORES Y CATCHASYNC
// Aplica este patrón a todas las rutas
// =============================================

/**
 * ANTES (❌ Sin validación ni error handling)
 * 
 * router.post('/api/questionnaire/:userId', (req, res) => {
 *   const { age, height, weight } = req.body;
 *   // Sin validar, datos inválidos llegan a la BD
 *   User.updateOne({ _id: req.params.userId }, { fitnessProfile: req.body });
 *   res.json({ success: true });
 * });
 */

/**
 * DESPUÉS (✅ Con validación y error handling)
 */

const express = require('express');
const router = express.Router();
const { validateQuestionnaire, handleValidationErrors } = require('../middleware/validators');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const User = require('../models/User');

/**
 * @route   POST /api/questionnaire/:userId
 * @desc    Guardar cuestionario fitness completo
 * @access  Private
 */
router.post(
  '/:userId',
  validateQuestionnaire,           // 1. VALIDAR ENTRADA
  handleValidationErrors,           // 2. MANEJAR ERRORES DE VALIDACIÓN
  catchAsync(async (req, res) => {  // 3. ENVOLVER EN CATCHASYNC
    // Aquí ya sabes que los datos son válidos
    const { userId } = req.params;
    const questionnaireData = req.body;

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Guardar cuestionario
    user.fitnessProfile = questionnaireData;
    await user.save();

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Cuestionario guardado correctamente',
      data: {
        userId: user._id,
        fitnessProfile: user.fitnessProfile
      }
    });
  })
);

/**
 * @route   GET /api/questionnaire/:userId
 * @desc    Obtener cuestionario guardado
 * @access  Private
 */
router.get(
  '/:userId',
  catchAsync(async (req, res) => {
    const { userId } = req.params;

    // Validar MongoDB ID manualmente si no usas validator
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('ID de usuario inválido', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (!user.fitnessProfile) {
      throw new AppError('Este usuario aún no ha completado el cuestionario', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Cuestionario obtenido correctamente',
      data: {
        userId: user._id,
        fitnessProfile: user.fitnessProfile
      }
    });
  })
);

module.exports = router;

/**
 * =============================================
 * PATRÓN A SEGUIR EN TODAS LAS RUTAS
 * =============================================
 * 
 * 1. VALIDAR ENTRADA
 *    - Usar express-validator
 *    - Definir en /middleware/validators.js
 *    - Aplicar al principio de la ruta
 * 
 * 2. MANEJAR ERRORES DE VALIDACIÓN
 *    - handleValidationErrors proporciona respuestas consistentes
 * 
 * 3. LOGIC CON CATCHASYNC
 *    - catchAsync(async (req, res) => { ... })
 *    - Cualquier error en el async se pasa a errorHandler automáticamente
 *    - Throw AppError para errores custom
 * 
 * 4. RESPUESTAS CONSISTENTES
 *    {
 *      success: boolean,
 *      message: string,
 *      data: {...}
 *    }
 * 
 * =============================================
 * EJEMPLO: REGISTRAR ENTRENAMIENTO
 * =============================================
 */

// EJEMPLO COMPLETO CON TODAS LAS MEJORAS
const { validateWorkoutRegistration } = require('../middleware/validators');

router.post(
  '/registrar',
  validateWorkoutRegistration,       // Validar entrada
  handleValidationErrors,             // Manejar errores de validación
  catchAsync(async (req, res) => {    // Envolver en catchAsync
    const { userId, workoutData } = req.body;

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Guardar entrenamiento completado
    user.completedWorkouts.push({
      date: new Date(),
      ...workoutData
    });

    await user.save();

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Entrenamiento registrado correctamente',
      data: {
        workoutId: user.completedWorkouts[user.completedWorkouts.length - 1]._id,
        workoutData
      }
    });
  })
);

/**
 * =============================================
 * ERRORES QUE SERÁ MANEJADO AUTOMÁTICAMENTE
 * =============================================
 * 
 * ✅ CastError (MongoDB ID inválido)
 * ✅ ValidationError (Validación de Mongoose)
 * ✅ Duplicado (Error código 11000)
 * ✅ JWT expirado
 * ✅ JWT inválido
 * ✅ Cualquier excepción en el async
 * ✅ AppError personalizado
 * 
 * Todas retornarán respuestas JSON consistentes
 */
