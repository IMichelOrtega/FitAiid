// =============================================
// RUTAS DE LOGROS - FITAIID
// Conecta las rutas con el controlador
// =============================================

const express = require('express');
const router = express.Router();
const logrosController = require('../controllers/logros_c');
const catchAsync = require('../utils/catchAsync');

// GET /api/logros/:userId - Obtener logros del usuario
router.get('/:userId', catchAsync(logrosController.getLogros));

module.exports = router;