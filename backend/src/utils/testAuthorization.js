const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const AUTH_URL = `${API_BASE}/auth`;
const PRODUCTS_URL = `${API_BASE}/products`;

console.log('🧪 Testing de sistema de autorización completo\n');

const api = axios.create({
    timeout: 10000,
    validateStatus: () => true
});

let adminToken = null;
let customerToken = null;
let testProductId = null;

async function testCreateAdminUser() {
    console.log('=== TEST 1: CREAR USUARIO ADMIN ===');
    
    const adminData = {
        firstName: 'Admin',
        lastName: 'Test Auth',
        email: `admin-auth-${Date.now()}@techstore.com`,
        password: 'Admin123!',
        role: 'admin'
    };
    
    try {
        const response = await api.post(`${AUTH_URL}/register`, adminData);
        
        if (response.status === 201) {
            console.log('✅ Admin creado exitosamente');
            console.log(`   Email: ${response.data.user.email}`);
            console.log(`   Rol: ${response.data.user.role}`);
            adminToken = response.data.token;
            console.log(`   Token guardado\n`);
            return true;
        } else {
            console.log('❌ Error creando admin\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testCreateCustomerUser() {
    console.log('=== TEST 2: CREAR USUARIO CUSTOMER ===');
    
    const customerData = {
        firstName: 'Customer',
        lastName: 'Test Auth',
        email: `customer-auth-${Date.now()}@techstore.com`,
        password: 'Customer123!',
        role: 'customer'
    };
    
    try {
        const response = await api.post(`${AUTH_URL}/register`, customerData);
        
        if (response.status === 201) {
            console.log('✅ Customer creado exitosamente');
            console.log(`   Email: ${response.data.user.email}`);
            console.log(`   Rol: ${response.data.user.role}`);
            customerToken = response.data.token;
            console.log(`   Token guardado\n`);
            return true;
        } else {
            console.log('❌ Error creando customer\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testAdminCreateProduct() {
    console.log('=== TEST 3: ADMIN CREAR PRODUCTO ===');
    
    if (!adminToken) {
        console.log('⚠️ No hay token de admin\n');
        return false;
    }
    
    const productData = {
        name: `Producto Test ${Date.now()}`,
        description: 'Producto de prueba para testing de roles',
        price: 999000,
        category: 'laptops',
        brand: 'Test',
        images: ['https://test.com/image.jpg'],
        mainImage: 'https://test.com/main.jpg',
        quantity: 10
    };
    
    try {
        const response = await api.post(PRODUCTS_URL, productData, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.status === 201) {
            console.log('✅ Admin puede crear productos');
            console.log(`   Producto: ${response.data.data.name}`);
            console.log(`   ID: ${response.data.data._id}`);
            testProductId = response.data.data._id;
            console.log(`   ID guardado para siguientes tests\n`);
            return true;
        } else {
            console.log('❌ Admin no pudo crear producto');
            console.log(`   Status: ${response.status}\n`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testCustomerCreateProduct() {
    console.log('=== TEST 4: CUSTOMER INTENTAR CREAR PRODUCTO ===');
    
    if (!customerToken) {
        console.log('⚠️ No hay token de customer\n');
        return false;
    }
    
    const productData = {
        name: 'Producto No Autorizado',
        description: 'Este producto no debería crearse',
        price: 500000,
        category: 'smartphones',
        brand: 'Test',
        images: ['https://test.com/image.jpg'],
        mainImage: 'https://test.com/main.jpg',
        quantity: 5
    };
    
    try {
        const response = await api.post(PRODUCTS_URL, productData, {
            headers: {
                'Authorization': `Bearer ${customerToken}`
            }
        });
        
        if (response.status === 403) {
            console.log('✅ Customer correctamente bloqueado');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}`);
            console.log(`   Rol usuario: ${response.data.userRole}`);
            console.log(`   Roles requeridos: ${response.data.requiredRoles.join(', ')}\n`);
            return true;
        } else {
            console.log('❌ Customer no fue bloqueado (PROBLEMA DE SEGURIDAD)\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testNoTokenCreateProduct() {
    console.log('=== TEST 5: SIN TOKEN INTENTAR CREAR PRODUCTO ===');
    
    const productData = {
        name: 'Producto Sin Autorización',
        description: 'Sin token',
        price: 300000,
        category: 'tablets',
        brand: 'Test',
        images: ['https://test.com/image.jpg'],
        mainImage: 'https://test.com/main.jpg',
        quantity: 3
    };
    
    try {
        const response = await api.post(PRODUCTS_URL, productData);
        
        if (response.status === 401) {
            console.log('✅ Petición sin token correctamente bloqueada');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${response.data.error}\n`);
            return true;
        } else {
            console.log('❌ Petición sin token no fue bloqueada\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testAdminUpdateProduct() {
    console.log('=== TEST 6: ADMIN ACTUALIZAR PRODUCTO ===');
    
    if (!adminToken || !testProductId) {
        console.log('⚠️ Faltan datos para este test\n');
        return false;
    }
    
    const updateData = {
        price: 899000,
        quantity: 15
    };
    
    try {
        const response = await api.put(`${PRODUCTS_URL}/${testProductId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.status === 200) {
            console.log('✅ Admin puede actualizar productos');
            console.log(`   Nuevo precio: ${response.data.data.formattedPrice}\n`);
            return true;
        } else {
            console.log('❌ Admin no pudo actualizar\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testCustomerUpdateProduct() {
    console.log('=== TEST 7: CUSTOMER INTENTAR ACTUALIZAR PRODUCTO ===');
    
    if (!customerToken || !testProductId) {
        console.log('⚠️ Faltan datos para este test\n');
        return false;
    }
    
    const updateData = {
        price: 1
    };
    
    try {
        const response = await api.put(`${PRODUCTS_URL}/${testProductId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${customerToken}`
            }
        });
        
        if (response.status === 403) {
            console.log('✅ Customer correctamente bloqueado en actualización');
            console.log(`   Error: ${response.data.error}\n`);
            return true;
        } else {
            console.log('❌ Customer no fue bloqueado\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testAdminDeleteProduct() {
    console.log('=== TEST 8: ADMIN ELIMINAR PRODUCTO ===');
    
    if (!adminToken || !testProductId) {
        console.log('⚠️ Faltan datos para este test\n');
        return false;
    }
    
    try {
        const response = await api.delete(`${PRODUCTS_URL}/${testProductId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.status === 200) {
            console.log('✅ Admin puede eliminar productos');
            console.log(`   Producto eliminado: ${response.data.deleted.name}\n`);
            return true;
        } else {
            console.log('❌ Admin no pudo eliminar\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function testPublicGetProducts() {
    console.log('=== TEST 9: PÚBLICO VER PRODUCTOS (SIN TOKEN) ===');
    
    try {
        const response = await api.get(PRODUCTS_URL);
        
        if (response.status === 200) {
            console.log('✅ Público puede ver productos sin token');
            console.log(`   Productos encontrados: ${response.data.count}\n`);
            return true;
        } else {
            console.log('❌ Error obteniendo productos\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 INICIANDO TESTING COMPLETO DE AUTORIZACIÓN');
    console.log('='.repeat(60));
    console.log('');
    
    // Verificar servidor
    console.log('🔍 Verificando servidor...');
    try {
        const healthCheck = await api.get(`${API_BASE}/health`);
        if (healthCheck.status === 200) {
            console.log('✅ Servidor respondiendo\n');
        }
    } catch (error) {
        console.log('❌ SERVIDOR NO DISPONIBLE');
        console.log('💡 Ejecuta: npm run dev\n');
        process.exit(1);
    }
    
    let passed = 0;
    const total = 9;
    
    if (await testCreateAdminUser()) passed++;
    if (await testCreateCustomerUser()) passed++;
    if (await testAdminCreateProduct()) passed++;
    if (await testCustomerCreateProduct()) passed++;
    if (await testNoTokenCreateProduct()) passed++;
    if (await testAdminUpdateProduct()) passed++;
    if (await testCustomerUpdateProduct()) passed++;
    if (await testAdminDeleteProduct()) passed++;
    if (await testPublicGetProducts()) passed++;
    
    console.log('='.repeat(60));
    console.log(`📊 RESUMEN: ${passed}/${total} tests pasaron`);
    console.log(`📈 Porcentaje: ${((passed/total)*100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('\n🎉 TODOS LOS TESTS PASARON');
        console.log('✨ Sistema de autorización funcionando perfectamente');
        console.log('🔐 Control de acceso por roles implementado');
        console.log('🚀 TechStore Pro listo para producción');
    } else {
        console.log(`\n⚠️ ${total - passed} tests fallaron`);
        console.log('🔍 Revisa los errores arriba');
    }
}

if (require.main === module) {
    runAllTests()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests };