// =============================================
// RUTAS DE CUESTIONARIO - FITAIID
// =============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @route   POST /api/questionnaire
 * @desc    Guardar respuestas del cuestionario fitness
 * @access  Público (por ahora)
 */
router.post('/', async (req, res) => {
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

    console.log('📝 Guardando cuestionario fitness para usuario:', userId);
    console.log('📊 Datos recibidos:', req.body);

    // Validar que userId existe
    if (!userId) {
      console.log('❌ userId no proporcionado');
      return res.status(400).json({
        success: false,
        message: 'userId es requerido'
      });
    }

    // Buscar usuario
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ Usuario no encontrado:', userId);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // ⭐ Actualizar fitnessProfile
    user.fitnessProfile = {
      gender: gender || null,
      age: age || null,
      height: height || null,
      weight: weight || null,
      fitnessLevel: fitnessLevel || null,
      mainGoal: mainGoal || null,
      medicalConditions: medicalConditions || '',
      trainingLocation: trainingLocation || null,
      trainingDaysPerWeek: trainingDaysPerWeek || null,
      sessionDuration: sessionDuration || null,
      questionnaireCompleted: true,
      questionnaireCompletedAt: new Date()
    };

    await user.save();

    console.log('✅ Cuestionario fitness guardado para:', user.email);
    console.log('📋 Perfil fitness:', user.fitnessProfile);
    console.log('🏋️ IMC calculado:', user.bmi);
    console.log('📊 Categoría IMC:', user.bmiCategory);

    res.status(200).json({
      success: true,
      message: 'Cuestionario guardado exitosamente',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        fitnessProfile: user.fitnessProfile,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory
      }
    });

  } catch (error) {
    console.error('❌ Error al guardar cuestionario:', error);
    console.error('Stack:', error.stack);
    
    // Manejar errores de validación
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        details: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al guardar el cuestionario',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/questionnaire/:userId
 * @desc    Obtener perfil fitness de un usuario
 * @access  Público (debería ser privado en producción)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Obteniendo perfil fitness para:', userId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.fitnessProfile?.questionnaireCompleted) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no ha completado el cuestionario'
      });
    }

    res.status(200).json({
      success: true,
      fitnessProfile: user.fitnessProfile,
      bmi: user.bmi,
      bmiCategory: user.bmiCategory,
      fitnessContext: user.getFitnessContext()
    });

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil fitness'
    });
  }
});

console.log('✅ Rutas de cuestionario fitness configuradas');

module.exports = router;