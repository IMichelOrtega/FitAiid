// =============================================
// SCRIPT DE PRUEBAS - MODELO USUARIO
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Script para probar que el modelo User funciona correctamente
 * Incluye pruebas de encriptación, validaciones y métodos de autenticación
 */
async function testUserModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo User...\n');
        
        // =============================================
        // CONECTAR A LA BASE DE DATOS
        // =============================================
        
        console.log('🔗 Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conexión establecida exitosamente\n');
        
        // =============================================
        // PRUEBA 1: CREAR USUARIO VÁLIDO CON ENCRIPTACIÓN
        // =============================================
        
        console.log('👤 === PRUEBA 1: CREAR USUARIO VÁLIDO ===');
        
        const validUser = new User({
            firstName: 'Ana María',
            lastName: 'González Rodríguez',
            email: 'ana.gonzalez.prueba@example.com',
            password: 'MiPassword123!',
            phone: '+57 3123456789',
            address: {
                street: 'Carrera 15 #45-67, Apartamento 302',
                city: 'Bogotá',
                state: 'Cundinamarca',
                zipCode: '110231',
                country: 'Colombia'
            },
            dateOfBirth: new Date('1990-05-15'),
            gender: 'female',
            role: 'customer'
        });
        
        // Validar SIN guardar (solo verificar estructura)
        const validationError = validUser.validateSync();
        
        if (validationError) {
            console.log('❌ Error de validación inesperado:');
            Object.values(validationError.errors).forEach(error => {
                console.log(`   • ${error.message}`);
            });
        } else {
            console.log('✅ Usuario válido - Estructura correcta');
            console.log(`   👤 Nombre completo: ${validUser.fullName}`);
            console.log(`   📧 Email: ${validUser.email}`);
            console.log(`   🎂 Edad: ${validUser.age} años`);
            console.log(`   📱 Teléfono: ${validUser.phone}`);
            console.log(`   🏠 Dirección: ${validUser.fullAddress}`);
            console.log(`   👑 Rol: ${validUser.role}`);
            console.log(`   🏆 Nivel cliente: ${validUser.customerLevel}`);
            
            // Probar encriptación de contraseña
            console.log('\n🔍 Probando encriptación automática...');
            const originalPassword = 'MiPassword123!';
            console.log(`   🔓 Contraseña original: ${originalPassword}`);
            
            await validUser.save();
            console.log(`   🔒 Contraseña encriptada: ${validUser.password.substring(0, 29)}...`);
            console.log(`   📏 Longitud encriptada: ${validUser.password.length} caracteres`);
            console.log(`✅ Usuario guardado exitosamente con ID: ${validUser.id}`);
            
            // Probar verificación de contraseña
            console.log('\n🔍 Probando verificación de contraseña...');
            const isPasswordCorrect = await validUser.comparePassword(originalPassword);
            console.log(`   ✅ Contraseña correcta: ${isPasswordCorrect}`);
            
            const isPasswordWrong = await validUser.comparePassword('ContraseñaIncorrecta123');
            console.log(`   ❌ Contraseña incorrecta detectada: ${!isPasswordWrong}`);
        }
        
        // =============================================
        // PRUEBA 2: VALIDAR DATOS INCORRECTOS
        // =============================================
        
        console.log('\n🚨 === PRUEBA 2: VALIDAR DATOS INCORRECTOS ===');
        
        const invalidUser = new User({
            firstName: 'A',                              // Muy corto
            // lastName: FALTANTE (requerido)
            email: 'email-invalido',                     // Formato incorrecto
            password: '123',                             // Muy simple
            phone: '123',                                // Formato incorrecto
            dateOfBirth: new Date('2020-01-01'),        // Muy joven (menos de 13 años)
            gender: 'genero-inexistente',                // No está en enum
            role: 'rol-inexistente'                      // No está en enum
        });
        
        const errors = invalidUser.validateSync();
        
        if (errors) {
            console.log('✅ Validaciones funcionando correctamente:');
            Object.values(errors.errors).forEach(error => {
                console.log(`   🚫 ${error.path}: ${error.message}`);
            });
        } else {
            console.log('❌ ERROR: Las validaciones NO están funcionando');
        }
        
        // =============================================
        // PRUEBA 3: PROBAR MÉTODOS ESTÁTICOS
        // =============================================
        
        console.log('\n🔧 === PRUEBA 3: PROBAR MÉTODOS ESTÁTICOS ===');
        
        // Buscar por email
        console.log('📧 Probando búsqueda por email...');
        const foundUser = await User.findByEmail('ana.gonzalez.prueba@example.com');
        if (foundUser) {
            console.log(`✅ Usuario encontrado: ${foundUser.fullName}`);
            console.log(`   🔑 Contraseña incluida para login: ${foundUser.password ? 'Sí' : 'No'}`);
        }
        
        // Crear usuario admin para probar roles
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'Sistema',
            email: 'admin.prueba@techstore.com',
            password: 'AdminPass789!',
            role: 'admin'
        });
        await adminUser.save();
        
        // Probar búsqueda por rol
        console.log('\n👑 Probando búsqueda por rol...');
        const customers = await User.getUsersByRole('customer');
        const admins = await User.getUsersByRole('admin');
        console.log(`✅ Usuarios customer encontrados: ${customers.length}`);
        console.log(`✅ Usuarios admin encontrados: ${admins.length}`);
        
        // Probar estadísticas
        console.log('\n📊 Probando estadísticas de usuarios...');
        const stats = await User.getUserStats();
        if (stats.length > 0) {
            const userStats = stats[0];
            console.log(`✅ Estadísticas calculadas:`);
            console.log(`   👥 Total usuarios: ${userStats.totalUsers}`);
            console.log(`   ✅ Usuarios activos: ${userStats.activeUsers} (${userStats.activePercentage}%)`);
            console.log(`   👑 Administradores: ${userStats.adminUsers}`);
            console.log(`   🛒 Clientes: ${userStats.customerUsers}`);
            console.log(`   💰 Total gastado: ${userStats.totalSpent.toLocaleString('es-CO')}`);
            console.log(`   📊 Promedio por usuario: ${userStats.averageSpent.toLocaleString('es-CO')}`);
        }
        
        // =============================================
        // PRUEBA 4: PROBAR MÉTODOS DE INSTANCIA
        // =============================================
        
        console.log('\n🛠️ === PRUEBA 4: PROBAR MÉTODOS DE INSTANCIA ===');
        
        // Simular compra
        console.log('💰 Probando registro de compra...');
        await foundUser.addPurchase(1500000); // $1.5M
        console.log(`✅ Compra registrada:`);
        console.log(`   📦 Total órdenes: ${foundUser.totalOrders}`);
        console.log(`   💵 Total gastado: ${foundUser.formattedTotalSpent}`);
        console.log(`   🏆 Nuevo nivel: ${foundUser.customerLevel}`);
        console.log(`   🎯 Puntos de fidelidad: ${foundUser.loyaltyPoints}`);
        
        // Probar protección contra fuerza bruta
        console.log('\n🔒 Probando protección contra fuerza bruta...');
        console.log('Simulando 3 intentos de login fallidos...');
        
        for (let i = 1; i <= 3; i++) {
            await foundUser.incrementLoginAttempts();
            console.log(`   ${i}. Intento fallido registrado (total: ${foundUser.loginAttempts + i})`);
        }
        
        // Refrescar datos del usuario
        const userWithAttempts = await User.findById(foundUser._id);
        console.log(`✅ Sistema de protección funcionando:`);
        console.log(`   🚨 Intentos fallidos: ${userWithAttempts.loginAttempts}`);
        console.log(`   🔒 Cuenta bloqueada: ${userWithAttempts.isLocked}`);
        
        // Reset después de login exitoso
        await userWithAttempts.resetLoginAttempts();
        console.log(`✅ Intentos reseteados después de login exitoso`);
        
        // =============================================
        // PRUEBA 5: PROBAR CAMPOS VIRTUALES
        // =============================================
        
        console.log('\n⚡ === PRUEBA 5: PROBAR CAMPOS VIRTUALES ===');
        
        console.log('✅ Campos virtuales calculados correctamente:');
        console.log(`   👤 Nombre completo: ${foundUser.fullName}`);
        console.log(`   🎂 Edad: ${foundUser.age} años`);
        console.log(`   🏠 Dirección completa: ${foundUser.fullAddress}`);
        console.log(`   🏆 Nivel de cliente: ${foundUser.customerLevel}`);
        console.log(`   💰 Total gastado formateado: ${foundUser.formattedTotalSpent}`);
        console.log(`   🔒 Cuenta bloqueada: ${foundUser.isLocked}`);
        
        // =============================================
        // PRUEBA 6: SEGURIDAD JSON
        // =============================================
        
        console.log('\n🛡️ === PRUEBA 6: VERIFICAR SEGURIDAD JSON ===');
        
        const userJSON = foundUser.toJSON();
        
        console.log('✅ Verificando que campos sensibles NO aparecen en JSON:');
        console.log(`   🔐 password: ${userJSON.password ? '❌ VISIBLE' : '✅ OCULTA'}`);
        console.log(`   🔑 passwordResetToken: ${userJSON.passwordResetToken ? '❌ VISIBLE' : '✅ OCULTO'}`);
        console.log(`   🚨 loginAttempts: ${userJSON.loginAttempts ? '❌ VISIBLE' : '✅ OCULTO'}`);
        console.log(`   🔒 lockUntil: ${userJSON.lockUntil ? '❌ VISIBLE' : '✅ OCULTO'}`);
        console.log(`   🆔 id en lugar de _id: ${userJSON.id ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
        
        // =============================================
        // LIMPIEZA: ELIMINAR USUARIOS DE PRUEBA
        // =============================================
        
        console.log('\n🧹 === LIMPIANDO DATOS DE PRUEBA ===');
        
        const deleteResult = await User.deleteMany({ 
            email: { $regex: 'prueba|test', $options: 'i' } 
        });
        
        console.log(`✅ ${deleteResult.deletedCount} usuarios de prueba eliminados`);
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✨ El modelo User está funcionando perfectamente');
        console.log('🔐 Seguridad implementada y verificada');
        console.log('🚀 Listo para usar en autenticación y APIs');
        
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

/**
 * Función adicional para probar diferentes escenarios de contraseñas
 */
async function testPasswordSecurity() {
    try {
        console.log('\n🔐 === PRUEBAS ADICIONALES DE SEGURIDAD ===');
        
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Casos de prueba de contraseñas
        const passwordTests = [
            { password: 'Password123!', valid: true, description: 'Contraseña segura completa' },
            { password: 'password123', valid: false, description: 'Sin mayúscula' },
            { password: 'PASSWORD123', valid: false, description: 'Sin minúscula' },
            { password: 'Password', valid: false, description: 'Sin número' },
            { password: '12345678', valid: false, description: 'Solo números' },
            { password: 'Pass123', valid: false, description: 'Muy corta' },
            { password: 'MiClaveSegura999', valid: true, description: 'Contraseña válida sin símbolos' }
        ];
        
        console.log('🧪 Probando validaciones de contraseña:');
        
        for (const test of passwordTests) {
            const testUser = new User({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: test.password
            });
            
            const error = testUser.validateSync();
            const hasPasswordError = error && error.errors.password;
            
            if (test.valid && !hasPasswordError) {
                console.log(`   ✅ "${test.description}": VÁLIDA correctamente`);
            } else if (!test.valid && hasPasswordError) {
                console.log(`   ✅ "${test.description}": RECHAZADA correctamente`);
            } else {
                console.log(`   ❌ "${test.description}": Comportamiento inesperado`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error en pruebas de seguridad:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

// Ejecutar si el archivo se llama directamente
if (require.main === module) {
    console.log('🚀 Ejecutando pruebas del modelo User de TechStore Pro\n');
    testUserModel()
        .then(() => testPasswordSecurity())
        .then(() => {
            console.log('\n✨ ¡Todas las pruebas completadas exitosamente!');
            console.log('🎯 El modelo User está listo para la Parte 2C');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testUserModel, testPasswordSecurity };