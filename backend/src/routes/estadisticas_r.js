// =============================================
// RUTAS DE ESTADÍSTICAS - FITAIID
// Conecta las rutas con el controlador
// =============================================

const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticas_c');
const catchAsync = require('../utils/catchAsync');
const { protect } = require('../middleware/auth');

// GET /api/estadisticas/:userId - Obtener estadísticas completas (JWT requerido)
router.get('/:userId', protect, catchAsync(estadisticasController.getEstadisticas));

// GET /api/estadisticas/graficos/:userId - Obtener datos para gráficos (JWT requerido)
router.get('/graficos/:userId', protect, catchAsync(estadisticasController.getGraficos));

module.exports = router;