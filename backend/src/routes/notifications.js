// routes/notifications.js
// Rutas de notificaciones - VERSIÓN ACTUALIZADA con triggers automáticos
// Mantiene compatibilidad con tu código existente y agrega funcionalidad nueva

const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../config/AppError');
const webpush = require('../config/webpush');
const PushSubscription = require('../models/PushSubscription');
const notificationService = require('../services/notificationService');
const notificationTriggers = require('../services/notificationTriggers');

// ========================================
// RUTAS EXISTENTES (MANTENIDAS)
// ========================================

// Endpoint público para obtener la VAPID public key
router.get('/vapid-public-key', catchAsync((req, res) => {
  console.log('📋 Solicitando VAPID public key');
  
  if (!process.env.VAPID_PUBLIC_KEY) {
    console.error('❌ VAPID_PUBLIC_KEY no está configurada en .env');
    throw new AppError('VAPID keys no configuradas en el servidor', 500);
  }
  
  res.json({ 
    publicKey: process.env.VAPID_PUBLIC_KEY 
  });
}));

// Guardar suscripción cuando usuario activa notificaciones
router.post('/subscribe', catchAsync(async (req, res) => {
  console.log('📥 Nueva solicitud de suscripción');
  
  const { subscription } = req.body;
  
  if (!subscription) {
    console.error('❌ No se recibió objeto subscription');
    throw new AppError('Falta el objeto subscription en el body', 400);
  }
  
  // Obtener userId (de req.user si está autenticado, o del body como fallback)
  const userId = req.user?.id || req.body.userId;
  
  if (!userId) {
    console.error('❌ No se pudo obtener userId');
    throw new AppError('Se requiere autenticación o userId en el body', 400);
  }
  
  console.log('👤 Usuario:', userId);
  
  // Guardar o actualizar suscripción
  const savedSubscription = await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys
    },
    { upsert: true, new: true }
  );
  
  console.log('✅ Suscripción guardada exitosamente:', savedSubscription._id);
  
  // ⭐ ACTUALIZAR notificationsEnabled en User a true
  const User = require('../models/User');
  await User.findByIdAndUpdate(userId, {
    notificationsEnabled: true
  });
  
  console.log('✅ notificationsEnabled actualizado a true en User');
  
  res.status(201).json({ 
    success: true,
    message: 'Suscripción guardada exitosamente',
    notificationsEnabled: true
  });
}));

// Enviar notificación manual a un usuario
router.post('/send', catchAsync(async (req, res) => {
  console.log('📤 Solicitud para enviar notificación manual');
  
  const { userId, title, body, url } = req.body;
  
  if (!userId || !title || !body) {
    throw new AppError('Faltan parámetros requeridos: userId, title, body', 400);
  }
  
  const payload = {
    title,
    body,
    icon: '/logo192.png',
    badge: '/badge.png',
    data: { 
      url: url || '/', 
      timestamp: Date.now() 
    }
  };
  
  const result = await notificationService.sendNotificationToUser(userId, payload);
  
  if (!result.success) {
    throw new AppError(result.message || 'Error al enviar notificación', 404);
  }
  
  res.json({ 
    success: true,
    message: `Notificación enviada a ${result.sent || 1} dispositivo(s)` 
  });
}));

// ========================================
// NUEVAS RUTAS - TRIGGERS AUTOMÁTICOS
// ========================================

/**
 * POST /api/notifications/objetivo-completado
 * Notifica cuando el usuario completa un objetivo
 */
router.post('/objetivo-completado', catchAsync(async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const { objetivoId, nombre, descripcion } = req.body;
  
  if (!userId || !objetivoId || !nombre) {
    throw new AppError('Faltan parámetros: userId, objetivoId, nombre', 400);
  }
  
  await notificationTriggers.onObjetivoCompletado(userId, {
    id: objetivoId,
    nombre,
    descripcion
  });
  
  res.json({ 
    success: true, 
    message: 'Notificación de objetivo enviada' 
  });
}));

/**
 * POST /api/notifications/entrenamiento-completado
 * Notifica cuando el usuario completa un entrenamiento
 */
router.post('/entrenamiento-completado', catchAsync(async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const { entrenamientoId, nombre, duracion, calorias, tipo } = req.body;
  
  if (!userId || !nombre || !duracion) {
    throw new AppError('Faltan parámetros: userId, nombre, duracion', 400);
  }
  
  await notificationTriggers.onEntrenamientoCompletado(userId, {
    id: entrenamientoId,
    nombre,
    duracion,
    calorias,
    tipo
  });
  
  res.json({ 
    success: true, 
    message: 'Notificación de entrenamiento enviada y racha actualizada' 
  });
}));

/**
 * POST /api/notifications/logro-desbloqueado
 * Notifica cuando el usuario desbloquea un logro
 */
router.post('/logro-desbloqueado', catchAsync(async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const { logroId, nombre, descripcion, icono } = req.body;
  
  if (!userId || !logroId || !nombre) {
    throw new AppError('Faltan parámetros: userId, logroId, nombre', 400);
  }
  
  await notificationTriggers.onLogroDesbloqueado(userId, {
    id: logroId,
    nombre,
    descripcion,
    icono
  });
  
  res.json({ 
    success: true, 
    message: 'Notificación de logro enviada' 
  });
}));

// ========================================
// RUTAS DE PRUEBA Y ADMINISTRACIÓN
// ========================================

/**
 * POST /api/notifications/test
 * Envía una notificación de prueba (cualquier tipo)
 */
router.post('/test', catchAsync(async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const { tipo } = req.body;
  
  if (!userId) {
    throw new AppError('Se requiere userId', 400);
  }
  
  let resultado;
  
  switch (tipo) {
    case 'objetivo':
      resultado = await notificationService.notifyObjetivoCompletado(userId, {
        id: 'test-objetivo',
        nombre: 'Objetivo de Prueba',
        descripcion: 'Esta es una notificación de prueba'
      });
      break;
      
    case 'logro':
      resultado = await notificationService.notifyLogroDesbloqueado(userId, {
        id: 'test-logro',
        nombre: 'Logro de Prueba',
        descripcion: 'Esta es una notificación de prueba',
        icono: '/logo192.png'
      });
      break;
      
    case 'entrenamiento':
      resultado = await notificationService.notifyEntrenamientoCompletado(userId, {
        id: 'test-entrenamiento',
        nombre: 'Entrenamiento de Prueba',
        duracion: 30,
        calorias: 200
      });
      break;
      
    case 'racha':
      resultado = await notificationService.notifyNuevaDiaRacha(userId, 5);
      break;
      
    case 'recordatorio':
      resultado = await notificationService.notifyRecordatorioInactividad(userId, 3);
      break;
      
    default:
      throw new AppError('Tipo no válido. Usa: objetivo, logro, entrenamiento, racha, recordatorio', 400);
  }
  
  res.json({ 
    success: true, 
    message: `Notificación de prueba (${tipo}) enviada`,
    resultado 
  });
}));

/**
 * GET /api/notifications/status/:userId
 * Verifica el estado de notificaciones de un usuario
 */
router.get('/status/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const subscriptions = await PushSubscription.find({ userId });
  
  res.json({
    success: true,
    hasSubscriptions: subscriptions.length > 0,
    devicesCount: subscriptions.length,
    subscriptions: subscriptions.map(s => ({
      id: s._id,
      endpoint: s.endpoint.substring(0, 50) + '...',
      createdAt: s.createdAt
    }))
  });
}));

/**
 * DELETE /api/notifications/unsubscribe
 * Elimina la suscripción de un usuario
 */
router.delete('/unsubscribe', catchAsync(async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  
  if (!userId) {
    throw new AppError('Se requiere userId', 400);
  }
  
  const result = await PushSubscription.deleteMany({ userId });
  
  res.json({ 
    success: true, 
    message: `${result.deletedCount} suscripción(es) eliminada(s)` 
  });
}));
/**
 * GET /api/notifications/check-enabled/:userId
 * Verifica si el usuario ya activó notificaciones previamente
 */
router.get('/check-enabled/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const User = require('../models/User');
  const user = await User.findById(userId).select('notificationsEnabled');
  
  if (!user) {
    return res.json({
      success: false,
      enabled: false
    });
  }
  
  res.json({
    success: true,
    enabled: user.notificationsEnabled || false
  });
}));
module.exports = router;