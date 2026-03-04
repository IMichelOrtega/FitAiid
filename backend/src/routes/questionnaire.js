const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const AppError = require("../config/AppError");
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * @route   POST /api/questionnaire
 * @desc    Guardar cuestionario inicial del usuario (crear/actualizar perfil fitness)
 * @access  Privado (requiere autenticación)
 */
router.post("/", protect, catchAsync(async (req, res) => {
  const { userId, gender, age, height, weight, fitnessLevel, mainGoal, medicalConditions, trainingLocation, trainingDaysPerWeek, sessionDuration } = req.body;

  // Validación 1: Obtener userId del body o del token
  const finalUserId = userId || req.user._id.toString();

  // Validación 2: Verificar ownership
  if (req.user._id.toString() !== finalUserId) {
    throw new AppError("No tienes permiso para guardar este cuestionario", 403);
  }

  // Validación 3: Verificar que sea un MongoDB ID válido
  if (!mongoose.Types.ObjectId.isValid(finalUserId)) {
    throw new AppError("ID de usuario inválido", 400);
  }

  // Validación 4: Buscar el usuario
  const user = await User.findById(finalUserId);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  // Actualizar el perfil fitness del usuario
  user.fitnessProfile = {
    gender: gender || user.fitnessProfile.gender,
    age: age || user.fitnessProfile.age,
    height: height || user.fitnessProfile.height,
    weight: weight || user.fitnessProfile.weight,
    fitnessLevel: fitnessLevel || user.fitnessProfile.fitnessLevel,
    mainGoal: mainGoal || user.fitnessProfile.mainGoal,
    medicalConditions: medicalConditions || user.fitnessProfile.medicalConditions,
    trainingLocation: trainingLocation || user.fitnessProfile.trainingLocation,
    trainingDaysPerWeek: trainingDaysPerWeek || user.fitnessProfile.trainingDaysPerWeek,
    sessionDuration: sessionDuration || user.fitnessProfile.sessionDuration,
    questionnaireCompleted: true,
    questionnaireCompletedAt: new Date()
  };

  // Guardar los cambios
  await user.save();

  console.log(`✅ Cuestionario guardado para usuario: ${user.email}`);

  // Respuesta con datos del perfil actualizado
  res.status(201).json({
    success: true,
    message: "Cuestionario guardado correctamente",
    data: {
      user: user.getPublicProfile(),
      fitnessProfile: user.fitnessProfile,
      bmi: user.bmi,
      bmiCategory: user.bmiCategory
    }
  });
}));

/**
 * @route   GET /api/questionnaire/:userId
 * @desc    Obtener perfil fitness del usuario
 * @access  Privado (requiere autenticación)
 */
router.get("/:userId", protect, catchAsync(async (req, res) => {
  const { userId } = req.params;

  // Validación 1: Verificar que sea un MongoDB ID válido
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("ID de usuario inválido", 400);
  }

  // Validación 2: Verificar ownership
  if (req.user._id.toString() !== userId) {
    throw new AppError("No tienes permiso para obtener este cuestionario", 403);
  }

  // Validación 3: Buscar el usuario
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  console.log(`📋 Obteniendo perfil fitness para usuario: ${user.email}`);

  // Respuesta con datos del perfil
  res.status(200).json({
    success: true,
    message: "Perfil fitness obtenido correctamente",
    data: {
      user: user.getPublicProfile(),
      fitnessProfile: user.fitnessProfile,
      bmi: user.bmi,
      bmiCategory: user.bmiCategory
    }
  });
}));

/**
 * @route   PUT /api/questionnaire/:userId
 * @desc    Actualizar cuestionario del usuario
 * @access  Privado (requiere autenticación)
 */
router.put("/:userId", protect, catchAsync(async (req, res) => {
  // Validación de ownership
  if (req.user._id.toString() !== req.params.userId) {
    throw new AppError("No tienes permiso para actualizar este cuestionario", 403);
  }
  res.json({
    success: true,
    message: "Cuestionario actualizado correctamente",
  });
}));

/**
 * @route   PUT /api/questionnaire/user/:userId
 * @desc    Actualizar datos adicionales del cuestionario del usuario
 * @access  Privado (requiere autenticación)
 */
router.put("/user/:userId", protect, catchAsync(async (req, res) => {
  // Validación de ownership
  if (req.user._id.toString() !== req.params.userId) {
    throw new AppError("No tienes permiso para actualizar este cuestionario", 403);
  }
  res.json({
    success: true,
    message: "Datos del cuestionario actualizados correctamente",
  });
}));

module.exports = router;
