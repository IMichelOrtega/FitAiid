// =============================================
// CONTROLADOR DE PRODUCTOS - TECHSTORE PRO
// =============================================

const Product = require('../models/Product');
const AppError = require('../config/AppError');

console.log('🎮 Controlador de productos TechStore inicializado');

// =============================================
// FUNCIÓN 1: OBTENER TODOS LOS PRODUCTOS
// =============================================

const getAllProducts = async (req, res) => {
    console.log(`📱 Obteniendo productos:`, req.query);

    // Construir filtros
    const filters = {};
    
    if (req.query.category) {
        filters.category = req.query.category.toLowerCase();
    }
    
    if (req.query.brand) {
        filters.brand = new RegExp(req.query.brand, 'i');
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
        filters.price = {};
        if (req.query.minPrice) filters.price.$gte = parseInt(req.query.minPrice);
        if (req.query.maxPrice) filters.price.$lte = parseInt(req.query.maxPrice);
    }
    
    if (req.query.inStock !== undefined) {
        filters.inStock = req.query.inStock === 'true';
    }
    
    if (req.query.search) {
        const searchText = req.query.search.trim();
        filters.$or = [
            { name: new RegExp(searchText, 'i') },
            { description: new RegExp(searchText, 'i') },
            { brand: new RegExp(searchText, 'i') }
        ];
    }

    // Configurar ordenamiento
    let sortBy = {};
    switch (req.query.sortBy) {
        case 'price_asc': sortBy = { price: 1 }; break;
        case 'price_desc': sortBy = { price: -1 }; break;
        case 'name': sortBy = { name: 1 }; break;
        case 'newest': sortBy = { createdAt: -1 }; break;
        case 'rating': sortBy = { 'rating.average': -1 }; break;
        default: sortBy = { createdAt: -1 };
    }

    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const products = await Product.find(filters)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select('-keywords');

    const total = await Product.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ ${products.length} productos de ${total} total`);

    res.status(200).json({
        success: true,
        count: products.length,
        total,
        pagination: {
            currentPage: page,
            totalPages,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        },
        data: products
    });
};

// =============================================
// FUNCIÓN 2: OBTENER PRODUCTO POR ID
// =============================================

const getProductById = async (req, res) => {
    const { id } = req.params;
    console.log(`🔍 Buscando producto: ${id}`);

    const product = await Product.findById(id);

    if (!product) {
        throw new AppError('El producto no existe en nuestro catálogo', 404);
    }

    // Incrementar vistas
    await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    console.log(`✅ Producto encontrado: ${product.name}`);

    res.status(200).json({
        success: true,
        data: product
    });
};

// =============================================
// FUNCIÓN 3: CREAR PRODUCTO
// =============================================

const createProduct = async (req, res) => {
    console.log(`📱 Creando producto: ${req.body.name}`);

    // Validar nombre único
    if (req.body.name) {
        const existing = await Product.findOne({ 
            name: new RegExp(`^${req.body.name.trim()}$`, 'i') 
        });
        
        if (existing) {
            throw new AppError(`Ya existe: "${req.body.name}"`, 400);
        }
    }

    // Validar precio
    if (req.body.price && (req.body.price < 10000 || req.body.price > 50000000)) {
        throw new AppError('Precio debe estar entre $10,000 y $50,000,000', 400);
    }

    const product = new Product(req.body);
    await product.save();

    console.log(`✅ Producto creado: ${product.name} - ID: ${product._id}`);

    res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product.toObject()
    });
};

// =============================================
// FUNCIÓN 4: ACTUALIZAR PRODUCTO
// =============================================

const updateProduct = async (req, res) => {
    const { id } = req.params;
    console.log(`✏️ Actualizando producto: ${id}`);

    // Validar nombre único (excluyendo el actual)
    if (req.body.name) {
        const existing = await Product.findOne({ 
            name: new RegExp(`^${req.body.name.trim()}$`, 'i'),
            _id: { $ne: id }
        });
        
        if (existing) {
            throw new AppError(`Ya existe otro producto: "${req.body.name}"`, 400);
        }
    }

    const product = await Product.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!product) {
        throw new AppError('Producto no encontrado', 404);
    }

    console.log(`✅ Producto actualizado: ${product.name}`);

    res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product
    });
};

// =============================================
// FUNCIÓN 5: ELIMINAR PRODUCTO
// =============================================

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ Eliminando producto: ${id}`);

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
        throw new AppError('Producto no encontrado', 404);
    }

    console.log(`✅ Producto eliminado: ${product.name}`);

    res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente',
        deleted: {
            id: product._id,
            name: product.name,
            price: product.formattedPrice
        }
    });
};

// =============================================
// EXPORTAR FUNCIONES
// =============================================

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};

console.log('✅ Controlador exportado: 5 funciones CRUD disponibles');