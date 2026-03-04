// =============================================
// UTILITY: CATCH ASYNC
// Envuelve funciones async para manejo automático de errores
// =============================================

/**
 * Wrapper para async functions que captura errores automáticamente
 * @param {Function} fn - Función async a envolver
 * @returns {Function} - Middleware con manejo de errores
 * 
 * Uso: router.get('/ruta', catchAsync(async (req, res) => { ... }))
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
