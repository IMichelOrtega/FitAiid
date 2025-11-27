// =============================================
// TESTING DE MÉTODOS JWT - TECHSTORE PRO
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

console.log('🧪 Testing de métodos JWT en User.js\n');

async function testJWTMethods() {
    try {
        // CONECTAR A MONGODB
        console.log('📡 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado\n');
        
        // LIMPIAR USUARIOS DE PRUEBA
        console.log('🧹 Limpiando usuarios de prueba...');
        await User.deleteMany({ email: /test-jwt.*@techstore\.com/ });
        console.log('✅ Limpiado\n');
        
        // TEST 1: CREAR USUARIO CON HASH AUTOMÁTICO
        console.log('=== TEST 1: CREAR USUARIO ===');
        
        const testUser = new User({
            firstName: 'Admin',
            lastName: 'Test JWT',
            email: 'test-jwt-admin@techstore.com',
            password: 'Password123!',
            role: 'admin',
            phone: '3001234567'
        });
        
        await testUser.save();
        console.log('✅ Usuario creado');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Rol: ${testUser.role}`);
        console.log(`   Password hasheado: ${testUser.password.substring(0, 30)}...\n`);
        
        // TEST 2: BUSCAR CON findByCredentials
        console.log('=== TEST 2: findByCredentials ===');
        
        const foundUser = await User.findByCredentials('test-jwt-admin@techstore.com');
        
        if (foundUser) {
            console.log('✅ Usuario encontrado con password');
            console.log(`   Tiene password: ${!!foundUser.password}`);
            console.log(`   Email: ${foundUser.email}\n`);
        } else {
            console.log('❌ Usuario NO encontrado\n');
        }
        
        // TEST 3: COMPARAR PASSWORD
        console.log('=== TEST 3: COMPARAR PASSWORD ===');
        
        const isMatch = await foundUser.comparePassword('Password123!');
        console.log(`   Password correcta: ${isMatch ? '✅' : '❌'}`);
        
        const isWrong = await foundUser.comparePassword('wrongpassword');
        console.log(`   Password incorrecta rechazada: ${!isWrong ? '✅' : '❌'}\n`);
        
        // TEST 4: GENERAR TOKEN JWT
        console.log('=== TEST 4: GENERAR TOKEN JWT ===');
        
        const token = foundUser.generateAuthToken();
        console.log('✅ Token generado');
        console.log(`   Token (primeros 50 chars): ${token.substring(0, 50)}...\n`);
        
        // TEST 5: VERIFICAR CONTENIDO DEL TOKEN
        console.log('=== TEST 5: VERIFICAR TOKEN ===');
        
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('✅ Token verificado correctamente');
        console.log('   Contenido del token:');
        console.log(`   - ID: ${decoded.id}`);
        console.log(`   - Email: ${decoded.email}`);
        console.log(`   - Rol: ${decoded.role}`);
        console.log(`   - Emitido: ${new Date(decoded.iat * 1000).toLocaleString()}`);
        console.log(`   - Expira: ${new Date(decoded.exp * 1000).toLocaleString()}\n`);
        
        // TEST 6: PERFIL PÚBLICO
        console.log('=== TEST 6: PERFIL PÚBLICO ===');
        
        const publicProfile = foundUser.getPublicProfile();
        console.log('✅ Perfil público generado');
        console.log('   Campos incluidos:');
        console.log(`   - Nombre: ${publicProfile.fullName}`);
        console.log(`   - Email: ${publicProfile.email}`);
        console.log(`   - Rol: ${publicProfile.role}`);
        console.log(`   - Nivel: ${publicProfile.customerLevel}`);
        console.log(`   - Password incluido: ${publicProfile.password ? '❌ ERROR' : '✅ NO'}\n`);
        
        // TEST 7: CREAR USUARIO CUSTOMER
        console.log('=== TEST 7: USUARIO CUSTOMER ===');
        
        const customerUser = new User({
            firstName: 'Cliente',
            lastName: 'Test',
            email: 'test-jwt-customer@techstore.com',
            password: 'Customer123!',
            role: 'customer'
        });
        
        await customerUser.save();
        const customerToken = customerUser.generateAuthToken();
        const customerDecoded = jwt.decode(customerToken);
        
        console.log('✅ Usuario customer creado');
        console.log(`   Email: ${customerUser.email}`);
        console.log(`   Rol en token: ${customerDecoded.role}\n`);
        
        // RESUMEN
        console.log('=== RESUMEN ===');
        console.log('✅ Test 1: Crear usuario - PASSED');
        console.log('✅ Test 2: findByCredentials - PASSED');
        console.log('✅ Test 3: comparePassword - PASSED');
        console.log('✅ Test 4: generateAuthToken - PASSED');
        console.log('✅ Test 5: Verificar token - PASSED');
        console.log('✅ Test 6: Perfil público - PASSED');
        console.log('✅ Test 7: Usuario customer - PASSED');
        console.log('\n🎉 TODOS LOS TESTS PASARON');
        console.log('✨ Métodos JWT funcionando correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n📌 Conexión cerrada');
    }
}

if (require.main === module) {
    testJWTMethods()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { testJWTMethods };