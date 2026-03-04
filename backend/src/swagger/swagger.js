// =============================================
// CONFIGURACIÓN SWAGGER - DOCUMENTACIÓN API
// =============================================

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FitAiid API',
      version: '1.0.0',
      description: 'API de Plataforma Fitness con IA - Documentación completa',
      contact: {
        name: 'FitAiid Support',
        email: 'support@fitaiid.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.fitaiid.com' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Servidor de Producción' 
          : 'Servidor Local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token obtenido al hacer login'
        }
      },
      schemas: {
        // =============================================
        // ESQUEMAS: USUARIO
        // =============================================
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'ID único del usuario' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },

        // =============================================
        // ESQUEMAS: AUTENTICACIÓN
        // =============================================
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
            password: { type: 'string', format: 'password', example: 'Password123!' }
          }
        },

        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', minLength: 2, example: 'Juan' },
            lastName: { type: 'string', minLength: 2, example: 'Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'Password123!' }
          }
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'JWT Token' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },

        // =============================================
        // ESQUEMAS: CUESTIONARIO
        // =============================================
        QuestionnaireRequest: {
          type: 'object',
          required: ['gender', 'age', 'height', 'weight', 'fitnessLevel', 'mainGoal'],
          properties: {
            gender: {
              type: 'string',
              enum: ['hombre', 'mujer'],
              example: 'hombre'
            },
            age: {
              type: 'integer',
              minimum: 14,
              maximum: 100,
              example: 25
            },
            height: {
              type: 'integer',
              description: 'En centímetros',
              minimum: 100,
              maximum: 250,
              example: 175
            },
            weight: {
              type: 'integer',
              description: 'En kilogramos',
              minimum: 30,
              maximum: 300,
              example: 80
            },
            fitnessLevel: {
              type: 'string',
              enum: ['principiante', 'intermedio', 'avanzado'],
              example: 'principiante'
            },
            mainGoal: {
              type: 'string',
              enum: ['tonificar', 'ganar masa muscular', 'bajar de peso'],
              example: 'tonificar'
            },
            medicalConditions: {
              type: 'string',
              example: 'Ninguna'
            },
            trainingLocation: {
              type: 'string',
              enum: ['casa', 'gym'],
              example: 'gym'
            },
            trainingDaysPerWeek: {
              type: 'integer',
              minimum: 1,
              maximum: 7,
              example: 3
            },
            sessionDuration: {
              type: 'string',
              pattern: '^\\d+\\s(min|hr)$',
              example: '45 min'
            }
          }
        },

        // =============================================
        // ESQUEMAS: RUTINA
        // =============================================
        Exercise: {
          type: 'object',
          properties: {
            nombre: { type: 'string', example: 'Press de banca' },
            series: { type: 'integer', example: 4 },
            repeticiones: { type: 'string', example: '8-10' },
            descanso: { type: 'string', example: '2 min' },
            descripcion: { type: 'string' },
            completado: { type: 'boolean', default: false }
          }
        },

        WorkoutDay: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            esDescanso: { type: 'boolean' },
            enfoque: { type: 'string' },
            descripcion: { type: 'string' },
            duracionTotal: { type: 'integer', example: 45 },
            caloriasEstimadas: { type: 'integer', example: 300 },
            ejercicios: {
              type: 'array',
              items: { $ref: '#/components/schemas/Exercise' }
            }
          }
        },

        // =============================================
        // ESQUEMAS: RESPUESTAS COMUNES
        // =============================================
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerSpec };
