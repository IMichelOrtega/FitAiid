// =============================================
// TESTS - SISTEMA DE AUTENTICACIÓN Y RUTINAS
// Jest + Supertest
// =============================================

const request = require('supertest');
const app = require('../src/app');
const { connectDB } = require('../src/config/database');
const User = require('../models/User');

// =============================================
// SETUP Y TEARDOWN
// =============================================

beforeAll(async () => {
  // Conectar a base de datos de testing
  await connectDB();
});

afterEach(async () => {
  // Limpiar usuarios de testing después de cada test
  await User.deleteMany({ email: /test-/ });
});

afterAll(async () => {
  // Cerrar conexión a BD
  await new Promise(resolve => setTimeout(resolve, 500));
});

// =============================================
// TESTS: AUTENTICACIÓN
// =============================================

describe('🔐 Autenticación API', () => {
  
  describe('📝 POST /api/auth/register', () => {
    
    test('✅ Debe registrar un usuario correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'test-juan@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'test-juan@example.com');
    });

    test('❌ Debe rechazar email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'email-invalido',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('❌ Debe rechazar contraseña corta', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: `test-juan2-${Date.now()}@example.com`,
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      // Validar que hay un error de validación en la respuesta
      const errorStr = JSON.stringify(res.body);
      expect(errorStr).toContain('contraseña');
    });

    test('❌ Debe rechazar campos vacíos', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '',
          lastName: 'Pérez',
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('🔑 POST /api/auth/login', () => {
    
    beforeEach(async () => {
      // Crear usuario para login
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test-login@example.com',
          password: 'Password123!'
        });
    });

    test('✅ Debe hacer login correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-login@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    test('❌ Debe rechazar contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-login@example.com',
          password: 'PasswordIncorrecta'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('❌ Debe rechazar email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'no-existe@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

// =============================================
// TESTS: CUESTIONARIO Y PERFIL
// =============================================

describe('🏋️ Cuestionario y Perfil API', () => {
  
  let userId;
  let token;

  beforeEach(async () => {
    // Crear usuario y obtener token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'Workout',
        email: `test-workout-${Date.now()}@example.com`,
        password: 'Password123!'
      });

    userId = res.body.data.user.id;
    token = res.body.data.token;
    console.log('✅ Usuario creado en beforeEach:', { userId, email: res.body.data.user.email });
  });

  describe('📋 POST /api/questionnaire', () => {
    
    test('✅ Debe guardar cuestionario válido', async () => {
      console.log('🔍 Intentando guardar questionnaire con userId:', userId);
      const res = await request(app)
        .post('/api/questionnaire')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          gender: 'hombre',
          age: 25,
          height: 175,
          weight: 80,
          fitnessLevel: 'principiante',
          mainGoal: 'tonificar',
          medicalConditions: 'Ninguna',
          trainingLocation: 'gym',
          trainingDaysPerWeek: 3,
          sessionDuration: '45 min'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('fitnessProfile');
    });

    test('❌ Debe rechazar edad fuera de rango', async () => {
      const res = await request(app)
        .post('/api/questionnaire')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          gender: 'hombre',
          age: 150,  // Inválido
          height: 175,
          weight: 80,
          fitnessLevel: 'principiante',
          mainGoal: 'tonificar',
          medicalConditions: 'Ninguna',
          trainingLocation: 'gym',
          trainingDaysPerWeek: 3,
          sessionDuration: '45 min'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('❌ Debe rechazar objetivo inválido', async () => {
      const res = await request(app)
        .post('/api/questionnaire')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          gender: 'hombre',
          age: 25,
          height: 175,
          weight: 80,
          fitnessLevel: 'principiante',
          mainGoal: 'objetivo-inexistente',  // Inválido
          medicalConditions: 'Ninguna',
          trainingLocation: 'gym',
          trainingDaysPerWeek: 3,
          sessionDuration: '45 min'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('📊 GET /api/questionnaire/:userId', () => {
    
    test('✅ Debe obtener cuestionario guardado', async () => {
      // Primero guardar cuestionario
      await request(app)
        .post('/api/questionnaire')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          gender: 'mujer',
          age: 30,
          height: 165,
          weight: 60,
          fitnessLevel: 'intermedio',
          mainGoal: 'bajar de peso',
          medicalConditions: 'Ninguna',
          trainingLocation: 'casa',
          trainingDaysPerWeek: 4,
          sessionDuration: '1 hr'
        });

      // Luego obtenerlo
      const res = await request(app)
        .get(`/api/questionnaire/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fitnessProfile.gender).toBe('mujer');
    });

    test('❌ Debe rechazar userId inválido', async () => {
      const res = await request(app)
        .get('/api/questionnaire/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

// =============================================
// TESTS: RUTINAS
// =============================================

describe('🤖 Rutinas y IA API', () => {
  
  let userId;
  let token;

  beforeEach(async () => {
    // Crear usuario y cuestionario
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'Routine',
        email: `test-routine-${Date.now()}@example.com`,
        password: 'Password123!'
      });

    userId = regRes.body.data.user.id;
    token = regRes.body.data.token;

    // Guardar cuestionario
    await request(app)
      .post(`/api/questionnaire/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        gender: 'hombre',
        age: 28,
        height: 180,
        weight: 85,
        fitnessLevel: 'intermedio',
        mainGoal: 'ganar masa muscular',
        medicalConditions: 'Ninguna',
        trainingLocation: 'gym',
        trainingDaysPerWeek: 4,
        sessionDuration: '45 min'
      });
  });

  describe('✨ POST /api/generar-rutina', () => {
    
    test('✅ Debe generar rutina con perfil válido', async () => {
      const res = await request(app)
        .post('/api/generar-rutina')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          profile: {
            gender: 'hombre',
            age: 28,
            fitnessLevel: 'intermedio',
            mainGoal: 'ganar masa muscular',
            trainingDaysPerWeek: 4,
            trainingLocation: 'gym',
            sessionDuration: '45 min'
          }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rutina).toBeDefined();
      expect(res.body.rutina.dias).toBeInstanceOf(Array);
      expect(res.body.rutina.dias.length).toBe(7);
    });

    test('❌ Debe rechazar userId vacío', async () => {
      const res = await request(app)
        .post('/api/generar-rutina')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: '',  // userId vacío debe ser rechazado
          profile: { mainGoal: 'tonificar' }
        });

      // Debe rechazar userId vacío o devolver error
      expect([400, 403]).toContain(res.statusCode);
    });
  });

  describe('💾 POST /api/guardar-rutina', () => {
    
    test('✅ Debe guardar rutina correctamente', async () => {
      const rutina = {
        dias: [
          {
            nombre: 'Lunes',
            esDescanso: false,
            enfoque: 'Pecho',
            ejercicios: [
              { nombre: 'Press de banca', series: 4, repeticiones: '8-10', completado: false }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/guardar-rutina')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          rutina
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

// =============================================
// TESTS: ERROR HANDLING
// =============================================

describe('🚨 Manejo de Errores', () => {
  
  test('❌ Debe retornar 404 para ruta inexistente', async () => {
    const res = await request(app)
      .get('/api/ruta-no-existe');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('❌ Debe retornar 401 sin token', async () => {
    const res = await request(app)
      .get('/api/questionnaire/some-id');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
