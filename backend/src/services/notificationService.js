// services/notificationService.js
// Servicio centralizado para manejar todas las notificaciones automáticas
// Integrado con tu estructura MongoDB existente

const webpush = require('../config/webpush');
const PushSubscription = require('../models/PushSubscription');

class NotificationService {
  
  /**
   * Envía una notificación push a un usuario específico
   * @param {String} userId - ID del usuario (ObjectId de MongoDB)
   * @param {Object} payload - Contenido de la notificación
   */
  async sendNotificationToUser(userId, payload) {
    try {
      console.log(`📤 Enviando notificación a usuario: ${userId}`);
      
      // Obtener todas las suscripciones del usuario
      const subscriptions = await PushSubscription.find({ userId });
      
      if (subscriptions.length === 0) {
        console.log(`⚠️ Usuario ${userId} no tiene suscripciones activas`);
        return { success: false, message: 'No subscription found' };
      }
      
      console.log(`📋 Encontradas ${subscriptions.length} suscripciones`);
      
      // Preparar payload para web-push
      const notificationPayload = JSON.stringify(payload);
      
      // Enviar a todos los dispositivos del usuario
      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: sub.keys
            }, notificationPayload);
            
            console.log(`✅ Notificación enviada a dispositivo ${sub._id}`);
            return { success: true, subscriptionId: sub._id };
            
          } catch (error) {
            console.error(`❌ Error enviando a ${sub._id}:`, error);
            
            // Si la suscripción expiró (410 Gone), eliminarla
            if (error.statusCode === 410) {
              console.log(`🗑️ Eliminando suscripción expirada: ${sub._id}`);
              await PushSubscription.deleteOne({ _id: sub._id });
            }
            
            return { success: false, subscriptionId: sub._id, error: error.message };
          }
        })
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      
      console.log(`✅ Notificaciones enviadas: ${successful}/${subscriptions.length}`);
      
      return { 
        success: successful > 0, 
        sent: successful, 
        total: subscriptions.length 
      };
      
    } catch (error) {
      console.error('❌ Error en sendNotificationToUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía notificación cuando el usuario completa un objetivo
   */
  async notifyObjetivoCompletado(userId, objetivo) {
    const payload = {
      title: '🎯 ¡Objetivo Completado!',
      body: `¡Felicidades! Has completado: ${objetivo.nombre}`,
      icon: '/logo192.png',
      badge: '/badge.png',
      tag: 'objetivo-completado',
      data: {
        type: 'objetivo_completado',
        objetivoId: objetivo.id || objetivo._id,
        url: '/objetivos',
        timestamp: Date.now()
      },
      actions: [
        { action: 'ver', title: 'Ver Detalles' },
        { action: 'compartir', title: 'Compartir' }
      ]
    };

    return await this.sendNotificationToUser(userId, payload);
  }

  /**
   * Envía notificación cuando el usuario desbloquea un logro
   */
  async notifyLogroDesbloqueado(userId, logro) {
    const payload = {
      title: '🏆 ¡Nuevo Logro Desbloqueado!',
      body: `${logro.nombre}: ${logro.descripcion}`,
      icon: logro.icono || '/logo192.png',
      badge: '/badge.png',
      tag: 'logro-desbloqueado',
      vibrate: [200, 100, 200, 100, 200], // Patrón especial
      requireInteraction: true, // Requiere interacción del usuario
      data: {
        type: 'logro_desbloqueado',
        logroId: logro.id || logro._id,
        url: '/logros',
        timestamp: Date.now()
      },
      actions: [
        { action: 'ver', title: 'Ver Logro' },
        { action: 'compartir', title: 'Compartir' }
      ]
    };

    return await this.sendNotificationToUser(userId, payload);
  }

  /**
   * Envía notificación cuando el usuario termina un entrenamiento
   */
  async notifyEntrenamientoCompletado(userId, entrenamiento) {
    const payload = {
      title: '💪 ¡Entrenamiento Completado!',
      body: `Has completado ${entrenamiento.nombre}. Duración: ${entrenamiento.duracion} min`,
      icon: '/logo192.png',
      badge: '/badge.png',
      tag: 'entrenamiento-completado',
      data: {
        type: 'entrenamiento_completado',
        entrenamientoId: entrenamiento.id || entrenamiento._id,
        duracion: entrenamiento.duracion,
        calorias: entrenamiento.calorias,
        url: '/historial',
        timestamp: Date.now()
      },
      actions: [
        { action: 'ver', title: 'Ver Estadísticas' },
        { action: 'siguiente', title: 'Próximo Entrenamiento' }
      ]
    };

    return await this.sendNotificationToUser(userId, payload);
  }

  /**
   * Envía notificación cuando el usuario activa un nuevo día de racha
   */
  async notifyNuevaDiaRacha(userId, diasRacha) {
    let emoji = '🔥';
    let mensaje = `¡${diasRacha} días consecutivos!`;
    
    // Mensajes especiales para hitos importantes
    if (diasRacha === 7) {
      emoji = '⭐';
      mensaje = '¡1 semana completa! Sigue así';
    } else if (diasRacha === 30) {
      emoji = '🎉';
      mensaje = '¡1 mes consecutivo! Eres increíble';
    } else if (diasRacha === 100) {
      emoji = '👑';
      mensaje = '¡100 días! ¡Eres una leyenda!';
    } else if (diasRacha % 10 === 0) {
      emoji = '🌟';
    }

    const payload = {
      title: `${emoji} ¡Racha Activa!`,
      body: mensaje,
      icon: '/logo192.png',
      badge: '/badge.png',
      tag: 'racha-activa',
      requireInteraction: true,
      vibrate: [300, 100, 300],
      data: {
        type: 'racha_activa',
        diasRacha: diasRacha,
        url: '/perfil',
        timestamp: Date.now()
      },
      actions: [
        { action: 'ver', title: 'Ver Racha' },
        { action: 'compartir', title: 'Compartir' }
      ]
    };

    return await this.sendNotificationToUser(userId, payload);
  }

  /**
   * Envía notificación de recordatorio cuando el usuario lleva 3+ días inactivo
   */
  async notifyRecordatorioInactividad(userId, diasInactivo) {
    const mensajes = [
      {
        dias: 3,
        title: '👋 ¡Te extrañamos!',
        body: 'Han pasado 3 días. ¿Listo para tu próximo entrenamiento?'
      },
      {
        dias: 5,
        title: '💙 Vuelve a entrenar',
        body: 'Tu progreso te está esperando. ¡No pierdas tu racha!'
      },
      {
        dias: 7,
        title: '🎯 Una semana sin verte',
        body: 'Tus objetivos aún están aquí. ¡Vamos a lograrlos juntos!'
      },
      {
        dias: 14,
        title: '⏰ ¡Hora de regresar!',
        body: 'Han pasado 2 semanas. Retoma tus entrenamientos hoy.'
      }
    ];

    // Seleccionar mensaje apropiado
    const mensajeData = mensajes.reverse().find(m => diasInactivo >= m.dias) || mensajes[0];

    const payload = {
      title: mensajeData.title,
      body: mensajeData.body,
      icon: '/logo192.png',
      badge: '/badge.png',
      tag: 'recordatorio-inactividad',
      requireInteraction: true,
      data: {
        type: 'recordatorio_inactividad',
        diasInactivo: diasInactivo,
        url: '/',
        timestamp: Date.now()
      },
      actions: [
        { action: 'entrenar', title: 'Entrenar Ahora' },
        { action: 'close', title: 'Más Tarde' }
      ]
    };

    return await this.sendNotificationToUser(userId, payload);
  }

  /**
   * Envía recordatorio diario personalizado
   */
  async notifyRecordarioDiario(userId, mensaje = null) {
    const payload = {
      title: '🌅 ¡Buenos días!',
      body: mensaje || 'Tienes un entrenamiento programado para hoy. ¡Vamos a lograrlo!',
      icon: '/logo192.png',
      badge: '/badge.png',
      tag: 'daily-reminder',
      data: {
        type: 'daily_reminder',
        url: '/entrenamientos',
        timestamp: Date.now()
      },
      actions: [
        { action: 'ver', title: 'Ver Entrenamientos' }
      ]
    };

    return await this.sendNotificationToUser(userId, payload);
  }

  /**
   * Notifica que se perdió una racha
   */
  async notifyRachaPerdida(userId, rachaAnterior) {
    const payload = {
      title: '💔 Racha Perdida',
      body: `Tu racha de ${rachaAnterior} días se ha perdido. ¡Comienza una nueva hoy!`,
      icon: '/logo192.png',
      badge: '/badge.png',
      tag: 'streak-lost',
      data: {
        type: 'streak_lost',
        previousStreak: rachaAnterior,
        url: '/perfil',
        timestamp: Date.now()
      },
      actions: [
        { action: 'entrenar', title: 'Entrenar Ahora' }
      ]
    };

    return await this.sendNotificationToUser(userId, payload);
  }

  /**
   * Envía notificaciones masivas (útil para anuncios)
   */
  async sendBulkNotifications(userIds, payload) {
    console.log(`📢 Enviando notificación masiva a ${userIds.length} usuarios`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const userId of userIds) {
      const result = await this.sendNotificationToUser(userId, payload);
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({ userId, error: result.error });
      }
    }

    console.log(`✅ Notificaciones enviadas: ${results.success}/${userIds.length}`);
    return results;
  }
}

module.exports = new NotificationService();