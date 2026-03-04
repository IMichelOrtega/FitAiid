// services/notificationScheduler.js
// Trabajos programados (cron jobs) para notificaciones automáticas
// Integrado con MongoDB

const cron = require('node-cron');
const notificationService = require('./notificationService');
const User = require('../models/User');

class NotificationScheduler {
  
  constructor() {
    this.jobs = [];
  }

  /**
   * Inicializa todos los trabajos programados
   */
  initializeScheduledJobs() {
    console.log('🕐 Inicializando trabajos programados de notificaciones...');

    // No iniciar jobs en entorno de pruebas (Jest) para evitar handles abiertos
    if (process.env.NODE_ENV === 'test') {
      console.log('⏸️ Entorno de test detectado — se omite la inicialización de cron jobs');
      return;
    }

    // Verificar usuarios inactivos cada 6 horas
    this.scheduleInactivityCheck();

    // Recordatorios diarios de entrenamientos (8 AM)
    this.scheduleDailyReminders();

    // Verificar rachas a medianoche
    this.scheduleStreakCheck();

    // Limpieza de suscripciones expiradas (semanal)
    this.scheduleSubscriptionCleanup();

    console.log('✅ Todos los trabajos programados iniciados');
  }

  /**
   * Verifica usuarios inactivos y envía recordatorios
   * Se ejecuta cada 6 horas
   */
  scheduleInactivityCheck() {
    // Cada 6 horas: 0 */6 * * *
    const job = cron.schedule('0 */6 * * *', async () => {
      console.log('🔍 Verificando usuarios inactivos...');
      await this.checkInactiveUsers();
    });

    this.jobs.push({ name: 'inactivity-check', job });
    console.log('✅ Job programado: Verificación de inactividad (cada 6 horas)');
  }

  /**
   * Lógica para verificar usuarios inactivos
   */
  async checkInactiveUsers() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

      // Buscar usuarios con última actividad hace 3+ días
      const inactiveUsers = await User.find({
        lastActivityDate: { $lt: threeDaysAgo },
        notificationsEnabled: { $ne: false } // Solo si tienen notificaciones activas
      }).select('_id lastActivityDate nombre');

      console.log(`📊 Encontrados ${inactiveUsers.length} usuarios inactivos`);

      for (const user of inactiveUsers) {
        const daysSinceActivity = Math.floor(
          (now - new Date(user.lastActivityDate)) / (1000 * 60 * 60 * 24)
        );

        // Enviar notificación solo en días específicos (3, 5, 7, 14)
        if ([3, 5, 7, 14].includes(daysSinceActivity)) {
          await notificationService.notifyRecordatorioInactividad(user._id, daysSinceActivity);
          console.log(`📨 Recordatorio enviado a ${user.nombre || user._id} (${daysSinceActivity} días inactivo)`);
        }
      }

      console.log('✅ Verificación de inactividad completada');
      
    } catch (error) {
      console.error('❌ Error en verificación de inactividad:', error);
    }
  }

  /**
   * Recordatorios diarios de entrenamientos
   * Se ejecuta todos los días a las 8:00 AM
   */
  scheduleDailyReminders() {
    // Todos los días a las 8 AM: 0 8 * * *
    const job = cron.schedule('0 8 * * *', async () => {
      console.log('☀️ Enviando recordatorios diarios...');
      await this.sendDailyReminders();
    });

    this.jobs.push({ name: 'daily-reminders', job });
    console.log('✅ Job programado: Recordatorios diarios (8:00 AM)');
  }

  /**
   * Envía recordatorios diarios personalizados
   */
  async sendDailyReminders() {
    try {
      // Obtener usuarios activos con notificaciones habilitadas
      const activeUsers = await User.find({
        notificationsEnabled: { $ne: false }
      }).select('_id nombre');

      console.log(`📊 Enviando recordatorios a ${activeUsers.length} usuarios`);

      for (const user of activeUsers) {
        // Verificar si tiene entrenamientos pendientes (implementa según tu lógica)
        const hasPendingWorkout = await this.userHasPendingWorkout(user._id);
        
        if (hasPendingWorkout) {
          await notificationService.notifyRecordarioDiario(user._id);
          console.log(`📨 Recordatorio enviado a ${user.nombre || user._id}`);
        }
      }

      console.log('✅ Recordatorios diarios enviados');
      
    } catch (error) {
      console.error('❌ Error enviando recordatorios diarios:', error);
    }
  }

  /**
   * Verifica y actualiza rachas a medianoche
   * Se ejecuta todos los días a las 00:00
   */
  scheduleStreakCheck() {
    // Todos los días a medianoche: 0 0 * * *
    const job = cron.schedule('0 0 * * *', async () => {
      console.log('🔥 Verificando rachas...');
      await this.checkAndUpdateStreaks();
    });

    this.jobs.push({ name: 'streak-check', job });
    console.log('✅ Job programado: Verificación de rachas (medianoche)');
  }

  /**
   * Verifica rachas de usuarios y notifica rachas perdidas
   */
  async checkAndUpdateStreaks() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Buscar usuarios con racha activa que NO entrenaron ayer
      const users = await User.find({
        currentStreak: { $gt: 0 },
        lastActivityDate: { $lt: yesterday }
      }).select('_id currentStreak lastActivityDate nombre');

      console.log(`📊 Encontrados ${users.length} usuarios con rachas rotas`);

      for (const user of users) {
        const previousStreak = user.currentStreak;
        
        // Notificar que perdió la racha
        await notificationService.notifyRachaPerdida(user._id, previousStreak);
        
        // Reiniciar racha
        user.currentStreak = 0;
        await user.save();
        
        console.log(`💔 Racha perdida para ${user.nombre || user._id}: ${previousStreak} días`);
      }

      console.log('✅ Verificación de rachas completada');
      
    } catch (error) {
      console.error('❌ Error verificando rachas:', error);
    }
  }

  /**
   * Limpieza de suscripciones expiradas
   * Se ejecuta todos los domingos a las 2 AM
   */
  scheduleSubscriptionCleanup() {
    // Domingos a las 2 AM: 0 2 * * 0
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Limpiando suscripciones expiradas...');
      await this.cleanupExpiredSubscriptions();
    });

    this.jobs.push({ name: 'subscription-cleanup', job });
    console.log('✅ Job programado: Limpieza de suscripciones (Domingos 2:00 AM)');
  }

  /**
   * Elimina suscripciones que ya no son válidas
   */
  async cleanupExpiredSubscriptions() {
    try {
      const PushSubscription = require('../models/PushSubscription');
      const webpush = require('../config/webpush');
      
      const allSubscriptions = await PushSubscription.find({});
      
      console.log(`📊 Verificando ${allSubscriptions.length} suscripciones...`);
      
      let removed = 0;
      
      for (const sub of allSubscriptions) {
        try {
          // Intentar enviar notificación de prueba silenciosa
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys
          }, JSON.stringify({
            title: 'Test',
            body: '',
            tag: 'test',
            silent: true
          }));
        } catch (error) {
          // Si falla (410 Gone o 404), eliminar
          if (error.statusCode === 410 || error.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
            removed++;
            console.log(`🗑️ Suscripción eliminada: ${sub._id}`);
          }
        }
      }
      
      console.log(`✅ Limpieza completada. Eliminadas: ${removed} suscripciones`);
      
    } catch (error) {
      console.error('❌ Error en limpieza de suscripciones:', error);
    }
  }

  /**
   * Detiene todos los trabajos programados
   */
  stopAllJobs() {
    console.log('🛑 Deteniendo todos los trabajos programados...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`  ✓ Detenido: ${name}`);
    });
    this.jobs = [];
  }

  /**
   * Verifica si el usuario tiene entrenamientos pendientes
   * IMPLEMENTA según tu lógica de negocio
   */
  async userHasPendingWorkout(userId) {
    try {
      // Ejemplo: Verificar si tiene entrenamientos programados para hoy
      // const Entrenamiento = require('../models/Entrenamiento');
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      // const count = await Entrenamiento.countDocuments({
      //   userId,
      //   fecha: { $gte: today },
      //   completado: false
      // });
      // return count > 0;
      
      // Por defecto, asumir que sí tiene entrenamientos pendientes
      return true;
      
    } catch (error) {
      console.error('Error verificando entrenamientos pendientes:', error);
      return false;
    }
  }
}

module.exports = new NotificationScheduler();