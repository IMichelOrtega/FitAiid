// =============================================
// RUTAS DE RUTINAS - FITAIID
// =============================================

const express = require('express');
const router = express.Router();
const rutinaController = require('../controllers/rutinaController');
const catchAsync = require('../utils/catchAsync');

// Obtener el día actual de entrenamiento
router.get('/:userId/dia-actual', catchAsync(rutinaController.obtenerDiaActual));

// Completar día y avanzar al siguiente (CON REINICIO AUTOMÁTICO)
router.post('/:userId/completar-dia', catchAsync(rutinaController.completarDia));

// Obtener progreso general de la rutina
router.get('/:userId/progreso', catchAsync(rutinaController.obtenerProgreso));

// Reiniciar rutina manualmente
router.post('/:userId/reiniciar', catchAsync(rutinaController.reiniciarRutina));

// Saltar al siguiente día sin completar el actual
router.post('/:userId/siguiente-dia', catchAsync(rutinaController.saltarSiguienteDia));

module.exports = router;