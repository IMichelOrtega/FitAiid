// =============================================
// RUTAS DE ENTRENAMIENTOS - FITAIID
// Conecta las rutas con el controlador
// =============================================

const express = require('express');
const router = express.Router();
const entrenamientosController = require('../controllers/entrenamientos_c');
const catchAsync = require('../utils/catchAsync');
const { protect } = require('../middleware/auth');

// POST /api/entrenamientos/registrar - Registrar entrenamiento completado (JWT requerido)
router.post('/registrar', protect, catchAsync(entrenamientosController.registrarEntrenamiento));

// GET /api/entrenamientos/historial/:userId - Obtener historial (JWT requerido)
router.get('/historial/:userId', protect, catchAsync(entrenamientosController.getHistorial));

module.exports = router;
