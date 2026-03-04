// services/notificationTriggers.js
// VERSION SIMPLIFICADA - Solo envía notificaciones, NO calcula nada

const notificationService = require('./notificationService');
const User = require('../models/User');

class NotificationTriggers {

  /**
   * Trigger: Usuario termina un entrenamiento
   * SIMPLIFICADO: Solo notifica, NO calcula racha (eso ya lo hace app.js)
   */
  async onEntrenamientoCompletado(userId, entrenamientoData) {
    try {
      console.log(`💪 Trigger: Entrenamiento completado - Usuario ${userId}`);
      
      // 1. Enviar notificación de entrenamiento completado
      console.log('📤 Enviando notificación de entrenamiento...');
      await notificationService.notifyEntrenamientoCompletado(userId, {
        id: entrenamientoData.id || entrenamientoData._id,
        nombre: entrenamientoData.nombre,
        duracion: entrenamientoData.duracion,
        calorias: entrenamientoData.calorias,
        tipo: entrenamientoData.tipo
      });
      console.log('✅ Notificación de entrenamiento enviada');

      // 2. Obtener usuario actualizado para verificar racha y logros
      const user = await User.findById(userId);
      if (!user) {
        console.log('⚠️ Usuario no encontrado');
        return;
      }

      // 3. Verificar si es un hito de racha y notificar
      const rachaActual = user.fitnessStats.currentStreak || 0;
      await this.checkRachaHito(userId, rachaActual);

      // 4. Verificar logros de entrenamientos
      await this.checkLogrosEntrenamiento(userId, user);
      
      console.log('✅ Trigger completado');
      
    } catch (error) {
      console.error('❌ Error en trigger de entrenamiento:', error);
    }
  }

  /**
   * Verifica si la racha actual es un hito y notifica
   */
  async checkRachaHito(userId, diasRacha) {
    try {
      // Hitos importantes de racha
      const hitos = [3, 7, 14, 21, 30, 50, 100, 365];
      
      if (hitos.includes(diasRacha)) {
        console.log(`🔥 ¡Hito de racha alcanzado! ${diasRacha} días`);
        console.log('📤 Enviando notificación de racha...');
        
        await notificationService.notifyNuevaDiaRacha(userId, diasRacha);
        
        console.log('✅ Notificación de racha enviada');
        
        // Verificar logros de racha
        await this.checkLogrosRacha(userId, diasRacha);
      }
      
    } catch (error) {
      console.error('Error verificando hito de racha:', error);
    }
  }

  /**
   * Verifica si se desbloquearon logros relacionados con entrenamientos
   */
  async checkLogrosEntrenamiento(userId, user) {
    try {
      const totalEntrenamientos = user.fitnessStats.totalWorkouts || 0;
      const logrosActuales = user.fitnessStats.achievements || [];
      
      const logrosEntrenamientos = [
        { count: 1, id: 'first_workout', nombre: 'Primer Paso', descripcion: 'Completaste tu primer entrenamiento' },
        { count: 5, id: 'five_workouts', nombre: 'Motivado', descripcion: 'Completaste 5 entrenamientos' },
        { count: 10, id: 'ten_workouts', nombre: 'Dedicado', descripcion: 'Completaste 10 entrenamientos' },
        { count: 25, id: 'twentyfive_workouts', nombre: 'Comprometido', descripcion: 'Completaste 25 entrenamientos' },
        { count: 50, id: 'fifty_workouts', nombre: 'Medio Siglo', descripcion: '50 entrenamientos completados' },
        { count: 100, id: 'hundred_workouts', nombre: 'Centurión', descripcion: '100 entrenamientos completados' },
        { count: 250, id: 'legend', nombre: 'Leyenda', descripcion: '250 entrenamientos completados' }
      ];

      // Buscar logro que coincida con el total actual
      const logroADesbloquear = logrosEntrenamientos.find(l => l.count === totalEntrenamientos);
      
      if (logroADesbloquear) {
        // Verificar si ya lo tiene
        const yaDesbloqueado = logrosActuales.some(a => a.achievementId === logroADesbloquear.id);
        
        if (!yaDesbloqueado) {
          console.log(`🏆 Nuevo logro desbloqueado: ${logroADesbloquear.nombre}`);
          console.log('📤 Enviando notificación de logro...');
          
          // Agregar logro al usuario
          if (user.fitnessStats.achievements) {
            user.fitnessStats.achievements.push({
              achievementId: logroADesbloquear.id,
              nombre: logroADesbloquear.nombre,
              unlockedAt: new Date()
            });
            await user.save();
          }
          
          // Notificar
          await notificationService.notifyLogroDesbloqueado(userId, logroADesbloquear);
          
          console.log('✅ Notificación de logro enviada');
        }
      }
      
    } catch (error) {
      console.error('Error verificando logros de entrenamiento:', error);
    }
  }

  /**
   * Verifica si se desbloquearon logros relacionados con rachas
   */
  async checkLogrosRacha(userId, diasRacha) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      const logrosActuales = user.fitnessStats.achievements || [];
      
      const hitosRacha = [
        { dias: 7, id: 'week_streak', nombre: 'Semana Completa', descripcion: '7 días de racha' },
        { dias: 14, id: 'two_weeks', nombre: 'Dos Semanas', descripcion: '14 días de racha' },
        { dias: 30, id: 'month_streak', nombre: 'Mes Completo', descripcion: '30 días de racha' },
        { dias: 60, id: 'two_months', nombre: 'Dos Meses', descripcion: '60 días de racha' },
        { dias: 100, id: 'hundred_days', nombre: 'Leyenda', descripcion: '100 días de racha' },
        { dias: 365, id: 'year_champion', nombre: 'Campeón Anual', descripcion: '365 días de racha' }
      ];

      const hito = hitosRacha.find(h => h.dias === diasRacha);
      
      if (hito) {
        // Verificar si ya lo tiene
        const yaDesbloqueado = logrosActuales.some(a => a.achievementId === hito.id);
        
        if (!yaDesbloqueado) {
          console.log(`🏆 Nuevo logro de racha: ${hito.nombre}`);
          console.log('📤 Enviando notificación de logro de racha...');
          
          // Agregar logro
          if (user.fitnessStats.achievements) {
            user.fitnessStats.achievements.push({
              achievementId: hito.id,
              nombre: hito.nombre,
              unlockedAt: new Date()
            });
            await user.save();
          }
          
          // Notificar
          await notificationService.notifyLogroDesbloqueado(userId, hito);
          
          console.log('✅ Notificación de logro de racha enviada');
        }
      }
      
    } catch (error) {
      console.error('Error verificando logros de racha:', error);
    }
  }
}

module.exports = new NotificationTriggers();