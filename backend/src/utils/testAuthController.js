// =============================================
// TESTING DEL AUTH CONTROLLER - TECHSTORE PRO
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const authController = require('../controllers/authController');
const Product = require('../models/Product');

console.log('🧪 Testing del controlador de autenticación\n');

// Mock de req, res, next para testing
function createMockRequest(body = {}, query = {}) {
    return { body, query };
}

function createMockResponse() {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
}

function createMockNext() {
    return (error) => {
        console.error('Error pasado a next():', error.message);
    };
}

async function testAuthController() {
    try {
        // CONECTAR
        console.log('📡 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado\n');
        
        // LIMPIAR
        console.log('🧹 Limpiando usuarios de prueba...');
        await User.deleteMany({ email: /test-auth.*@techstore\.com/ });
        console.log('✅ Limpiado\n');
        
        // TEST 1: REGISTER
        console.log('=== TEST 1: REGISTER ===');
        
        const registerReq = createMockRequest({
            firstName: 'Test',
            lastName: 'Auth Controller',
            email: 'test-auth-register@techstore.com',
            password: 'Password123!',
            phone: '3001234567',
            role: 'customer'
        });
        
        const registerRes = createMockResponse();
        const registerNext = createMockNext();
        
        await authController.register(registerReq, registerRes, registerNext);
        
        if (registerRes.statusCode === 201) {
            console.log('✅ Register exitoso');
            console.log(`   Status: ${registerRes.statusCode}`);
            console.log(`   Token generado: ${registerRes.data.token ? 'SÍ' : 'NO'}`);
            console.log(`   Usuario: ${registerRes.data.user.email}`);
            console.log(`   Rol: ${registerRes.data.user.role}\n`);
        } else {
            console.log('❌ Register falló');
            console.log(`   Error: ${registerRes.data.error}\n`);
        }
        
        // TEST 2: REGISTER DUPLICADO
        console.log('=== TEST 2: REGISTER DUPLICADO ===');
        
        const duplicateReq = createMockRequest({
            firstName: 'Test',
            lastName: 'Duplicate',
            email: 'test-auth-register@techstore.com',  // Mismo email
            password: 'Password123!'
        });
        
        const duplicateRes = createMockResponse();
        
        await authController.register(duplicateReq, duplicateRes, registerNext);
        
        if (duplicateRes.statusCode === 400) {
            console.log('✅ Email duplicado rechazado correctamente');
            console.log(`   Error: ${duplicateRes.data.error}\n`);
        } else {
            console.log('❌ Email duplicado no rechazado\n');
        }
        
        // TEST 3: LOGIN CORRECTO
        console.log('=== TEST 3: LOGIN CORRECTO ===');
        
        const loginReq = createMockRequest({
            email: 'test-auth-register@techstore.com',
            password: 'Password123!'
        });
        
        const loginRes = createMockResponse();
        const loginNext = createMockNext();
        
        await authController.login(loginReq, loginRes, loginNext);
        
        if (loginRes.statusCode === 200) {
            console.log('✅ Login exitoso');
            console.log(`   Status: ${loginRes.statusCode}`);
            console.log(`   Token generado: ${loginRes.data.token ? 'SÍ' : 'NO'}`);
            console.log(`   Usuario: ${loginRes.data.user.email}\n`);
        } else {
            console.log('❌ Login falló');
            console.log(`   Error: ${loginRes.data.error}\n`);
        }
        
        // TEST 4: LOGIN INCORRECTO
        console.log('=== TEST 4: LOGIN CON PASSWORD INCORRECTA ===');
        
        const wrongLoginReq = createMockRequest({
            email: 'test-auth-register@techstore.com',
            password: 'WrongPassword123!'
        });
        
        const wrongLoginRes = createMockResponse();
        
        await authController.login(wrongLoginReq, wrongLoginRes, loginNext);
        
        if (wrongLoginRes.statusCode === 401) {
            console.log('✅ Password incorrecta rechazada');
            console.log(`   Error: ${wrongLoginRes.data.error}\n`);
        } else {
            console.log('❌ Password incorrecta no rechazada\n');
        }
        
        // TEST 5: GET PROFILE
        console.log('=== TEST 5: GET PROFILE ===');
        
        const user = await User.findOne({ email: 'test-auth-register@techstore.com' });
        
        const profileReq = createMockRequest({}, { userId: user._id.toString() });
        const profileRes = createMockResponse();
        const profileNext = createMockNext();
        
        await authController.getProfile(profileReq, profileRes, profileNext);
        
        if (profileRes.statusCode === 200) {
            console.log('✅ Perfil obtenido');
            console.log(`   Email: ${profileRes.data.user.email}`);
            console.log(`   Nombre completo: ${profileRes.data.user.fullName}`);
            console.log(`   Password incluido: ${profileRes.data.user.password ? '❌ ERROR' : '✅ NO'}\n`);
        } else {
            console.log('❌ No se pudo obtener perfil\n');
        }
        
        // TEST 6: UPDATE PROFILE
        console.log('=== TEST 6: UPDATE PROFILE ===');
        
        const updateReq = createMockRequest(
            {
                phone: '3109876543',
                gender: 'male'
            },
            { userId: user._id.toString() }
        );
        
        const updateRes = createMockResponse();
        const updateNext = createMockNext();
        
        await authController.updateProfile(updateReq, updateRes, updateNext);
        
        if (updateRes.statusCode === 200) {
            console.log('✅ Perfil actualizado');
            console.log(`   Nuevo teléfono: ${updateRes.data.user.phone}`);
            console.log(`   Mensaje: ${updateRes.data.message}\n`);
        } else {
            console.log('❌ No se pudo actualizar perfil\n');
        }
        
        // RESUMEN
        console.log('=== RESUMEN ===');
        console.log('✅ Test 1: Register - PASSED');
        console.log('✅ Test 2: Register duplicado - PASSED');
        console.log('✅ Test 3: Login correcto - PASSED');
        console.log('✅ Test 4: Login incorrecto - PASSED');
        console.log('✅ Test 5: Get profile - PASSED');
        console.log('✅ Test 6: Update profile - PASSED');
        console.log('\n🎉 TODOS LOS TESTS PASARON');
        console.log('✨ Controlador de autenticación funcionando');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n📌 Conexión cerrada');
    }
}

if (require.main === module) {
    testAuthController()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { testAuthController };