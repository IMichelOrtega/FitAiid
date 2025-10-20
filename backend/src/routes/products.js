// =============================================
// RUTAS REST PARA PRODUCTOS - TECHSTORE PRO
// =============================================

const express = require('express');
const router = express.Router();

// Importar controladores
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Importar middleware de autenticación
const { protect, authorize } = require('../middleware/auth');

console.log('🛣️ Inicializando rutas de productos TechStore Pro');

// =============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// =============================================

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con filtros
 * @access  Público
 * @params  ?category=laptops&brand=apple&minPrice=1000000&maxPrice=10000000
 *          ?search=MacBook&sortBy=price_asc&page=1&limit=12
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto por ID
 * @access  Público
 * @params  id (MongoDB ObjectId)
 */
router.get('/:id', getProductById);

// =============================================
// RUTAS DE ADMINISTRACIÓN (PROTEGIDAS - SOLO ADMIN)
// =============================================

/**
 * @route   POST /api/products
 * @desc    Crear nuevo producto
 * @access  Privado (Admin)
 * @body    { name, description, price, category, brand, etc. }
 */
router.post('/', protect, authorize('admin'), createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar producto existente
 * @access  Privado (Admin)
 * @body    { name?, description?, price?, etc. }
 */
router.put('/:id', protect, authorize('admin'), updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar producto
 * @access  Privado (Admin)
 * @params  id (MongoDB ObjectId)
 */
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// =============================================
// RUTAS ESPECIALES PARA ECOMMERCE
// =============================================

/**
 * @route   GET /api/products/category/:category
 * @desc    Obtener productos por categoría
 * @access  Público
 * @params  category: laptops|smartphones|tablets|components
 */
router.get('/category/:category', (req, res, next) => {
    // Agregar categoría a query params y usar controlador principal
    req.query.category = req.params.category;
    getAllProducts(req, res, next);
});

/**
 * @route   GET /api/products/brand/:brand
 * @desc    Obtener productos por marca
 * @access  Público
 * @params  brand: apple|samsung|asus|etc
 */
router.get('/brand/:brand', (req, res, next) => {
    req.query.brand = req.params.brand;
    getAllProducts(req, res, next);
});

/**
 * @route   GET /api/products/search/:query
 * @desc    Búsqueda de productos por texto
 * @access  Público
 * @params  query: texto a buscar
 */
router.get('/search/:query', (req, res, next) => {
    req.query.search = req.params.query;
    getAllProducts(req, res, next);
});

console.log('✅ Rutas de productos configuradas:');
console.log('   📱 GET /api/products - Lista con filtros');
console.log('   🔍 GET /api/products/:id - Detalle individual');
console.log('   ➕ POST /api/products - Crear producto');
console.log('   ✏️ PUT /api/products/:id - Actualizar producto');
console.log('   🗑️ DELETE /api/products/:id - Eliminar producto');
console.log('   🏷️ GET /api/products/category/:category - Por categoría');
console.log('   🏢 GET /api/products/brand/:brand - Por marca');
console.log('   🔎 GET /api/products/search/:query - Búsqueda');

module.exports = router;