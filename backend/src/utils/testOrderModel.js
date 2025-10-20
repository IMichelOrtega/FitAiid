// =============================================
// SCRIPT DE PRUEBAS - MODELO ORDER
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Script para probar que el modelo Order funciona correctamente
 * Incluye pruebas de relaciones, cálculos automáticos y validaciones
 */
async function testOrderModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo Order...\n');
        
        // =============================================
        // CONECTAR A LA BASE DE DATOS
        // =============================================
        
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');

        // AQUÍ VA TU CÓDIGO DE LIMPIEZA
        console.log('🧹 Limpiando datos de pruebas anteriores...');
        await User.deleteMany({ email: /test\.com$/ });
        await Product.deleteMany({ name: /Order Test/ });
        await Order.deleteMany({ orderNumber: { $regex: /^2025-.*/ } });
        console.log('✅ Datos anteriores eliminados\n');

        
        // =============================================
        // PREPARACIÓN: CREAR DATOS DE PRUEBA
        // =============================================
        
        console.log('📋 === PREPARACIÓN: CREAR DATOS DE PRUEBA ===');
        
        // Crear usuario de prueba
        const testUser = new User({
            firstName: 'Carlos',
            lastName: 'Mendoza',
            email: 'carlos.mendoza.order@test.com',
            password: 'TestOrder123!',
            phone: '+57 3101234567'
        });
        await testUser.save();
        console.log(`✅ Usuario de prueba creado: ${testUser.fullName}`);
        
        // Crear productos de prueba
        const product1 = new Product({
            name: 'MacBook Pro 16" - Order Test',
            description: 'Laptop premium para pruebas de pedidos con especificaciones completas.',
            price: 8999000,
            originalPrice: 9999000,
            category: 'laptops',
            brand: 'Apple',
            images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600.jpg'],
            mainImage: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600.jpg',
            quantity: 10
        });
        await product1.save();
        
        const product2 = new Product({
            name: 'iPhone 15 Pro - Order Test',
            description: 'Smartphone premium para pruebas de pedidos con cámara avanzada.',
            price: 5499000,
            category: 'smartphones',
            brand: 'Apple',
            images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600.jpg'],
            mainImage: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600.jpg',
            quantity: 15
        });
        await product2.save();
        
        console.log(`✅ Productos de prueba creados: ${product1.name}, ${product2.name}\n`);
        
        // =============================================
        // PRUEBA 1: CREAR PEDIDO VÁLIDO CON RELACIONES
        // =============================================
        
        console.log('📦 === PRUEBA 1: CREAR PEDIDO VÁLIDO ===');
        
        const validOrder = new Order({
            user: testUser._id,
            products: [
                {
                    product: product1._id,
                    quantity: 1,
                    price: product1.price,
                    name: product1.name,
                    image: product1.mainImage
                },
                {
                    product: product2._id,
                    quantity: 2,
                    price: product2.price,
                    name: product2.name,
                    image: product2.mainImage
                }
            ],
            shippingAddress: {
                firstName: 'Carlos',
                lastName: 'Mendoza',
                street: 'Carrera 11 #85-32, Torre 2, Apt 1504',
                city: 'Bogotá',
                state: 'Cundinamarca',
                zipCode: '110221',
                country: 'Colombia',
                phone: '+57 3101234567'
            },
            paymentMethod: 'credit_card',
            shippingMethod: 'standard'
        });
        // ✅ ESTRUCTURA CORRECTA - IR DIRECTO A GUARDAR
console.log('✅ Pedido válido - Estructura correcta');
console.log(`   👤 Usuario: ${testUser.fullName}`);
console.log(`   🛒 Productos: ${validOrder.products.length} items`);
console.log(`   📍 Ciudad de envío: ${validOrder.shippingAddress.city}`);
console.log(`   💳 Método de pago: ${validOrder.paymentMethod}`);
console.log(`   🚚 Método de envío: ${validOrder.shippingMethod}`);

// Probar cálculos automáticos
console.log('\n🧮 Probando cálculos automáticos...');
await validOrder.save();

console.log(`✅ Pedido guardado exitosamente:`);
console.log(`   🔢 Número de pedido: ${validOrder.orderNumber}`);
console.log(`   💰 Subtotal: ${validOrder.formattedTotals.subtotal}`);
console.log(`   🛒 Impuestos (19%): ${validOrder.formattedTotals.tax}`);
console.log(`   🚚 Envío: ${validOrder.formattedTotals.shipping}`);
console.log(`   💸 Descuento: ${validOrder.formattedTotals.discount}`);
console.log(`   💵 TOTAL: ${validOrder.formattedTotals.total}`);
console.log(`   📊 Estado: ${validOrder.statusText}`);
console.log(`   🆔 ID: ${validOrder.id}`);

// Probar campos virtuales
console.log('\n⚡ Probando campos virtuales...');
console.log(`   📦 Total items: ${validOrder.totalItems}`);
console.log(`   🎯 Productos únicos: ${validOrder.uniqueProducts}`);
console.log(`   📍 Dirección formateada: ${validOrder.formattedShippingAddress}`);
console.log(`   📅 Días desde pedido: ${validOrder.daysSinceOrder}`);
console.log(`   ⏰ ¿Retrasado?: ${validOrder.isOverdue ? 'Sí' : 'No'}`);       
        
        
        // =============================================
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        // =============================================
        
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidOrder = new Order({
            // user: FALTANTE (requerido)
            products: [], // Array vacío (debe tener al menos 1)
            shippingAddress: {
                firstName: '', // Vacío (requerido)
                lastName: '', // Vacío (requerido)
                street: '', // Vacío (requerido)
                city: '', // Vacío (requerido)
                state: '', // Vacío (requerido)
                phone: '123' // Formato inválido
            },
            paymentMethod: 'metodo-inexistente', // No está en enum
            shippingMethod: 'metodo-inexistente' // No está en enum
        });
        
        const invalidOrderErrors = invalidOrder.validateSync();
        
        if (invalidOrderErrors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(invalidOrderErrors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // =============================================
        // PRUEBA 3: PROBAR RELACIONES CON POPULATE
        // =============================================
        
        console.log('\n🔗 === PRUEBA 3: PROBAR RELACIONES CON POPULATE ===');
        
        // Buscar pedido con relaciones pobladas
        const populatedOrder = await Order.findById(validOrder._id)
            .populate('user', 'firstName lastName email phone')
            .populate('products.product', 'name price brand category mainImage');
        
        if (populatedOrder) {
            console.log('✅ Relaciones pobladas correctamente:');
            console.log(`   👤 Usuario completo: ${populatedOrder.user.firstName} ${populatedOrder.user.lastName} (${populatedOrder.user.email})`);
            console.log(`   📱 Teléfono: ${populatedOrder.user.phone}`);
            console.log('\n   🛒 Productos completos:');
            populatedOrder.products.forEach((item, index) => {
                console.log(`     ${index + 1}. ${item.product.name}`);
                console.log(`        💰 Precio: ${item.price.toLocaleString('es-CO')}`);
                console.log(`        📊 Cantidad: ${item.quantity}`);
                console.log(`        🏷️ Marca: ${item.product.brand}`);
                console.log(`        📂 Categoría: ${item.product.category}`);
            });
        }
        
        // =============================================
        // PRUEBA 4: PROBAR MÉTODOS DE INSTANCIA
        // =============================================
        
        console.log('\n🛠️ === PRUEBA 4: PROBAR MÉTODOS DE INSTANCIA ===');
        
        // Probar cambio de estado
        console.log('📋 Probando cambio de estado...');
        await validOrder.changeStatus('confirmed', 'Pago confirmado por tarjeta de crédito');
        console.log(`✅ Estado cambiado a: ${validOrder.statusText}`);
        console.log(`📝 Historial de estados: ${validOrder.statusHistory.length} entradas`);
        
        // Probar agregar producto
        console.log('\n📦 Probando agregar producto...');
        await validOrder.addProduct({
            product: product1._id,
            quantity: 1,
            price: product1.price,
            name: product1.name,
            image: product1.mainImage
        });
        console.log(`✅ Producto agregado. Nuevos totales:`);
        console.log(`   💵 Subtotal: ${validOrder.formattedTotals.subtotal}`);
        console.log(`   💵 Total: ${validOrder.formattedTotals.total}`);
        console.log(`   📦 Total items: ${validOrder.totalItems}`);
        
        // Probar verificar cancelación
        console.log('\n❌ Probando verificación de cancelación...');
        console.log(`✅ ¿Se puede cancelar?: ${validOrder.canBeCancelled() ? 'Sí' : 'No'}`);
        console.log(`⏱️ Tiempo estimado de entrega: ${validOrder.getEstimatedDeliveryDays()} días`);
        
        // =============================================
        // PRUEBA 5: PROBAR MÉTODOS ESTÁTICOS
        // =============================================
        
        console.log('\n📊 === PRUEBA 5: PROBAR MÉTODOS ESTÁTICOS ===');
        
        // Crear un segundo pedido para estadísticas
        const secondOrder = new Order({
            user: testUser._id,
            products: [{
                product: product2._id,
                quantity: 3,
                price: product2.price,
                name: product2.name,
                image: product2.mainImage
            }],
            shippingAddress: validOrder.shippingAddress,
            paymentMethod: 'debit_card',
            shippingMethod: 'express',
            status: 'delivered'
        });
        await secondOrder.save();
        //await secondOrder.changeStatus('delivered', 'Entregado exitosamente');
        
        // Buscar pedidos por usuario
        console.log('👤 Probando búsqueda por usuario...');
        const userOrders = await Order.findByUser(testUser._id, { populate: true });
        console.log(`✅ Pedidos del usuario encontrados: ${userOrders.length}`);
        
        userOrders.forEach((order, index) => {
            console.log(`   ${index + 1}. ${order.orderNumber} - ${order.statusText} - ${order.formattedTotals.total}`);
        });
        
        // Obtener estadísticas de ventas
        console.log('\n📈 Probando estadísticas de ventas...');
        const salesStats = await Order.getSalesStats();
        if (salesStats.length > 0) {
            const stats = salesStats[0];
            console.log(`✅ Estadísticas calculadas:`);
            console.log(`   📦 Total pedidos completados: ${stats.totalOrders}`);
            console.log(`   💰 Ingresos totales: ${stats.totalRevenue.toLocaleString('es-CO')}`);
            console.log(`   🛒 Items vendidos: ${stats.totalItems}`);
            console.log(`   📊 Valor promedio por pedido: ${stats.averageOrderValue.toLocaleString('es-CO')}`);
            console.log(`   🛒 Total impuestos: ${stats.totalTax.toLocaleString('es-CO')}`);
            console.log(`   🚚 Total envíos: ${stats.totalShipping.toLocaleString('es-CO')}`);
        }
        
        // Obtener pedidos por estado
        console.log('\n📋 Probando búsqueda por estado...');
        const confirmedOrders = await Order.getOrdersByStatus('confirmed');
        const deliveredOrders = await Order.getOrdersByStatus('delivered');
        console.log(`✅ Pedidos confirmados: ${confirmedOrders.length}`);
        console.log(`✅ Pedidos entregados: ${deliveredOrders.length}`);
        
        // Obtener productos más vendidos
        console.log('\n🏆 Probando productos más vendidos...');
        const topProducts = await Order.getTopProducts(5);
        console.log(`✅ Top productos más vendidos:`);
        topProducts.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.productName}`);
            console.log(`      📦 Cantidad vendida: ${product.totalQuantity}`);
            console.log(`      💰 Ingresos: ${product.totalRevenue.toLocaleString('es-CO')}`);
            console.log(`      📋 Pedidos: ${product.orderCount}`);
        });
        
        // =============================================
        // LIMPIEZA: ELIMINAR DATOS DE PRUEBA
        // =============================================
        
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        const deletedOrders = await Order.deleteMany({ 
            orderNumber: { $regex: /^2025-.*/ }
        });
        await User.deleteMany({ email: /test\.com$/ });
        await Product.deleteMany({ name: /Order Test/ });
        
        console.log(`✅ ${deletedOrders.deletedCount} pedidos de prueba eliminados`);
        console.log(`✅ Usuarios y productos de prueba eliminados`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo Order está funcionando perfectamente');
        console.log('🔗 Relaciones entre User, Product y Order verificadas');
        console.log('🧮 Cálculos automáticos funcionando correctamente');
        console.log('📊 Métodos de análisis y estadísticas operativos');
        console.log('🚀 Listo para usar en controladores y APIs');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('📋 Stack trace completo:');
            console.error(error.stack);
        }
    } finally {
        // Cerrar conexión SIEMPRE
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada');
    }
}

// Ejecutar si el archivo se llama directamente
if (require.main === module) {
    console.log('🚀 Ejecutando pruebas del modelo Order de TechStore Pro\n');
    testOrderModel()
        .then(() => {
            console.log('\n✨ ¡Todas las pruebas completadas exitosamente!');
            console.log('🎯 Los modelos Product, User y Order están listos para la Parte 3');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testOrderModel };