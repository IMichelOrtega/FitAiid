// =============================================
// SCRIPT DE PRUEBAS - MIDDLEWARE TECHSTORE PRO
// =============================================

require('dotenv').config({ path: '../../.env' });
const express = require('express');
const request = require('supertest');
const { errorHandler, notFound } = require('../middleware/errorHandler');
const { 
    validateObjectId, 
    validatePagination, 
    validateProductFilters 
} = require('../middleware/validation');

/**
 * Crear aplicación de pruebas con nuestro middleware
 */
function createTestApp() {
    const app = express();
    
    app.use(express.json());
    
    // Ruta de prueba para errores
    app.get('/test/error/:type', (req, res, next) => {
        const { type } = req.params;
        
        switch (type) {
            case 'validation':
                const error = new Error('Test validation error');
                error.name = 'ValidationError';
                error.errors = {
                    name: { message: 'El nombre es obligatorio' },
                    price: { message: 'El precio debe ser mayor a 0' }
                };
                return next(error);
                
            case 'cast':
                const castError = new Error('Cast to ObjectId failed');
                castError.name = 'CastError';
                castError.value = 'invalid-id';
                castError.path = 'product';
                return next(castError);
                
            case 'duplicate':
                const duplicateError = new Error('E11000 duplicate key');
                duplicateError.code = 11000;
                duplicateError.keyValue = { email: 'test@test.com' };
                return next(duplicateError);
                
            case 'jwt':
                const jwtError = new Error('invalid signature');
                jwtError.name = 'JsonWebTokenError';
                return next(jwtError);
                
            default:
                return next(new Error('Error genérico de prueba'));
        }
    });
    
    // Ruta para probar validación de ObjectId
    app.get('/test/product/:id', validateObjectId, (req, res) => {
        res.json({ success: true, id: req.params.id });
    });
    
    // Ruta para probar paginación
    app.get('/test/products', validatePagination, (req, res) => {
        res.json({ 
            success: true, 
            pagination: req.pagination 
        });
    });
    
    // Ruta para probar filtros
    app.get('/test/filter', validateProductFilters, (req, res) => {
        res.json({ success: true, filters: req.query });
    });
    
    // Middleware de errores
    app.use(notFound);
    app.use(errorHandler);
    
    return app;
}

/**
 * Ejecutar todas las pruebas del middleware
 */
async function runMiddlewareTests() {
    console.log('🧪 Iniciando pruebas del middleware TechStore Pro...\n');
    
    const app = createTestApp();
    let testsPassed = 0;
    let totalTests = 0;
    
    try {
        // =============================================
        // PRUEBA 1: MANEJO DE ERRORES DE VALIDACIÓN
        // =============================================
        
        console.log('📋 === PRUEBA 1: ERRORES DE VALIDACIÓN ===');
        totalTests++;
        
        const validationResponse = await request(app)
            .get('/test/error/validation')
            .expect(400);
            
        if (validationResponse.body.success === false && 
            validationResponse.body.error.includes('validación')) {
            console.log('✅ Error de validación manejado correctamente');
            testsPassed++;
        } else {
            console.log('❌ Error de validación no manejado correctamente');
        }
        
        // =============================================
        // PRUEBA 2: MANEJO DE ERRORES DE CAST
        // =============================================
        
        console.log('\n🔍 === PRUEBA 2: ERRORES DE CAST (ID INVÁLIDO) ===');
        totalTests++;
        
        const castResponse = await request(app)
            .get('/test/error/cast')
            .expect(400);
            
        if (castResponse.body.success === false && 
            castResponse.body.error.includes('inválido')) {
            console.log('✅ Error de cast manejado correctamente');
            testsPassed++;
        } else {
            console.log('❌ Error de cast no manejado correctamente');
        }
        
        // =============================================
        // PRUEBA 3: VALIDACIÓN DE OBJECT ID
        // =============================================
        
        console.log('\n🆔 === PRUEBA 3: VALIDACIÓN DE OBJECT ID ===');
        
        // ID válido
        totalTests++;
        const validIdResponse = await request(app)
            .get('/test/product/64f1a2b3c4d5e6f789012345')
            .expect(200);
            
        if (validIdResponse.body.success === true) {
            console.log('✅ ID válido aceptado correctamente');
            testsPassed++;
        } else {
            console.log('❌ ID válido rechazado incorrectamente');
        }
        
        // ID inválido
        totalTests++;
        const invalidIdResponse = await request(app)
            .get('/test/product/invalid-id')
            .expect(400);
            
        if (invalidIdResponse.body.success === false && 
            invalidIdResponse.body.error.includes('inválido')) {
            console.log('✅ ID inválido rechazado correctamente');
            testsPassed++;
        } else {
            console.log('❌ ID inválido no rechazado correctamente');
        }
        
        // =============================================
        // PRUEBA 4: VALIDACIÓN DE PAGINACIÓN
        // =============================================
        
        console.log('\n📄 === PRUEBA 4: VALIDACIÓN DE PAGINACIÓN ===');
        
        // Paginación válida
        totalTests++;
        const validPaginationResponse = await request(app)
            .get('/test/products?page=2&limit=10')
            .expect(200);
            
        if (validPaginationResponse.body.pagination.page === 2 && 
            validPaginationResponse.body.pagination.limit === 10) {
            console.log('✅ Paginación válida procesada correctamente');
            testsPassed++;
        } else {
            console.log('❌ Paginación válida no procesada correctamente');
        }
        
        // Paginación inválida
        totalTests++;
        const invalidPaginationResponse = await request(app)
            .get('/test/products?page=-1&limit=200')
            .expect(400);
            
        if (invalidPaginationResponse.body.success === false) {
            console.log('✅ Paginación inválida rechazada correctamente');
            testsPassed++;
        } else {
            console.log('❌ Paginación inválida no rechazada correctamente');
        }
        
        // =============================================
        // PRUEBA 5: RUTAS NO ENCONTRADAS (404)
        // =============================================
        
        console.log('\n🔍 === PRUEBA 5: RUTAS NO ENCONTRADAS ===');
        totalTests++;
        
        const notFoundResponse = await request(app)
            .get('/ruta/que/no/existe')
            .expect(404);
            
        if (notFoundResponse.body.success === false && 
            notFoundResponse.body.availableRoutes) {
            console.log('✅ Ruta no encontrada manejada correctamente');
            testsPassed++;
        } else {
            console.log('❌ Ruta no encontrada no manejada correctamente');
        }
        
        // =============================================
        // RESUMEN DE RESULTADOS
        // =============================================
        
        console.log('\n📊 === RESUMEN DE PRUEBAS ===');
        console.log(`✅ Pruebas pasadas: ${testsPassed}/${totalTests}`);
        console.log(`📈 Porcentaje de éxito: ${((testsPassed/totalTests)*100).toFixed(1)}%`);
        
        if (testsPassed === totalTests) {
            console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
            console.log('✨ El middleware de TechStore Pro está funcionando correctamente');
            console.log('🚀 Listo para implementar controladores en la Parte 3B');
        } else {
            console.log('\n⚠️ Algunas pruebas fallaron');
            console.log('🔧 Revisa la implementación del middleware');
        }
        
    } catch (error) {
        console.error('\n❌ Error ejecutando pruebas del middleware:', error.message);
        console.error('🔍 Stack trace:', error.stack);
    }
}

// Ejecutar si el archivo se llama directamente
if (require.main === module) {
    console.log('🚀 Ejecutando pruebas del middleware TechStore Pro\n');
    runMiddlewareTests()
        .then(() => {
            console.log('\n✨ Pruebas del middleware completadas');
            console.log('🎯 Continúa con la Parte 3B para crear controladores');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en pruebas:', error);
            process.exit(1);
        });
}

module.exports = { runMiddlewareTests };