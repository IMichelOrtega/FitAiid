// =============================================
// SETUP PARA TESTS
// =============================================

// Ignorar advertencias de deprecación en tests
process.env.NODE_ENV = 'test';

// Aumentar timeout para operaciones de BD
jest.setTimeout(30000);

// Mock de variables de entorno
process.env.MONGODB_URI = 'mongodb://localhost:27017/fitaiid-test';
process.env.JWT_SECRET = 'test-secret-key-123456789';
process.env.OPENAI_API_KEY = 'sk-test-key';

// Cleanup después de todos los tests
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
