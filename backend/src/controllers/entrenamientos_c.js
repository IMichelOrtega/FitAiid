// =============================================
// CONTROLADOR DE ENTRENAMIENTOS - VERSIÓN MEJORADA
// Con racha que cuenta entrenamientos completados
// =============================================

const WorkoutProgress = require('../models/WorkoutProgress');
const User = require('../models/User');
const AppError = require('../config/AppError');
const notificationTriggers = require('../services/notificationTriggers');


// =============================================
// 📝 REGISTRAR ENTRENAMIENTO COMPLETADO
// =============================================
exports.registrarEntrenamiento = async (req, res) => {
  const { userId, workoutData } = req.body;

  console.log(`📝 Registrando entrenamiento para usuario: ${userId}`);
  console.log(`   Enfoque: ${workoutData?.enfoque}`);
  console.log(`   Duración: ${workoutData?.duracionTotal} min`);

  if (!userId || !workoutData) {
    throw new AppError('Faltan datos requeridos (userId y workoutData)', 400);
  }

  // ✅ SECURITY: Validar que el usuario autenticado solo puede acceder a sus propios datos
  if (req.user._id.toString() !== userId) {
    throw new AppError('No autorizado para acceder a estos datos', 403);
  }

  // Buscar usuario
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // 1. CREAR REGISTRO EN WORKOUTPROGRESS
  const workoutProgress = new WorkoutProgress({
    user: userId,
    duration: workoutData.duracionTotal || 45,
    calories: workoutData.caloriasEstimadas || 300,
    createdAt: new Date()
  });
  
  await workoutProgress.save();
  console.log(`✅ WorkoutProgress guardado: ${workoutProgress._id}`);

  // 2. PREPARAR DATOS DEL ENTRENAMIENTO PARA EL HISTORIAL
  const nuevoEntrenamiento = {
    date: new Date(),
    nombre: workoutData.nombre || 'Entrenamiento',
    enfoque: workoutData.enfoque || 'Full body',
    duracionTotal: workoutData.duracionTotal || 45,
    caloriasEstimadas: workoutData.caloriasEstimadas || 300,
    ejerciciosCompletados: workoutData.ejercicios?.length || 0,
    ejercicios: workoutData.ejercicios || []
  };

  // 3. CALCULAR RACHA MEJORADA (cuenta entrenamientos completados, no días consecutivos)
  const totalExercises = workoutData.ejercicios ? workoutData.ejercicios.length : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const workoutHistory = user.fitnessStats?.workoutHistory || [];
  
  // ✅ NUEVA LÓGICA: Verificar si ya entrenó HOY
  const yaEntrenoHoy = workoutHistory.some(w => {
    const workoutDate = new Date(w.date);
    workoutDate.setHours(0, 0, 0, 0);
    return workoutDate.getTime() === today.getTime();
  });

  let newStreak = user.fitnessStats?.currentStreak || 0;
  
  if (yaEntrenoHoy) {
    // Ya completó un entrenamiento hoy, mantener racha
    console.log('ℹ️ Ya entrenaste hoy, racha se mantiene');
    newStreak = user.fitnessStats?.currentStreak || 1;
  } else {
    // Es un nuevo día de entrenamiento, aumentar racha
    console.log('✅ Nuevo día de entrenamiento completado, racha aumenta');
    newStreak = (user.fitnessStats?.currentStreak || 0) + 1;
  }

  // Actualizar max streak
  const newMaxStreak = Math.max(newStreak, user.fitnessStats?.maxStreak || 0);

  console.log('🔥 RACHA ACTUALIZADA:');
  console.log(`   Racha anterior: ${user.fitnessStats?.currentStreak || 0}`);
  console.log(`   Racha nueva: ${newStreak}`);
  console.log(`   Racha máxima: ${newMaxStreak}`);

  // 4. ACTUALIZAR USUARIO EN LA BASE DE DATOS
  await User.findByIdAndUpdate(userId, {
    $push: {
      'fitnessStats.workoutHistory': nuevoEntrenamiento
    },
    $inc: {
      'fitnessStats.totalWorkouts': 1,
      'fitnessStats.totalExercises': totalExercises,
      'fitnessStats.totalMinutes': workoutData.duracionTotal || 45
    },
    $set: {
      'fitnessStats.currentStreak': newStreak,
      'fitnessStats.maxStreak': newMaxStreak
    }
  });
  
  console.log(`✅ Estadísticas actualizadas:`);
  console.log(`   Total entrenamientos: ${(user.fitnessStats?.totalWorkouts || 0) + 1}`);
  console.log(`   Racha actual: ${newStreak} días`);
  console.log(`   Racha máxima: ${newMaxStreak} días`);
  
  // ✅ MARCAR DÍA COMO COMPLETADO Y AVANZAR AL SIGUIENTE
  let progresoCiclo = null;
  const userActualizado = await User.findById(userId);
  progresoCiclo = await userActualizado.completarDiaYAvanzar();
  console.log(`✅ Día completado: ${progresoCiclo.diaCompletado}`);
  console.log(`➡️  Siguiente día: ${progresoCiclo.siguienteDia}`);
  if (progresoCiclo.nuevoCiclo) {
    console.log(`🔄 ¡Ciclo completado! Iniciando ciclo ${progresoCiclo.cicloActual}`);

    // ✅ RESPONDER CON cicloReiniciado: true y salir
    const achievementsUnlocked = await verificarLogros(
      userId, 
      (user.fitnessStats?.totalWorkouts || 0) + 1, 
      newStreak
    );

    return res.json({
      success: true,
      cicloReiniciado: true,
      message: '¡Semana completada! La rutina se reinició 🔄',
      data: {
        workoutId: workoutProgress._id,
        stats: {
          totalWorkouts: (user.fitnessStats?.totalWorkouts || 0) + 1,
          currentStreak: newStreak,
          maxStreak: newMaxStreak
        },
        achievementsUnlocked: achievementsUnlocked
      }
    });
  }

  // 5. VERIFICAR LOGROS DESBLOQUEADOS
  const achievementsUnlocked = await verificarLogros(
    userId, 
    (user.fitnessStats?.totalWorkouts || 0) + 1, 
    newStreak
  );

  // ========================================
  // 🔔 DISPARAR NOTIFICACIONES AUTOMÁTICAS
  // ========================================
  
  console.log('');
  console.log('🔔 Procesando notificaciones automáticas...');
  
  try {
    await notificationTriggers.onEntrenamientoCompletado(userId, {
      id: workoutProgress._id,
      nombre: workoutData.nombre || 'Entrenamiento',
      duracion: workoutData.duracionTotal || 45,
      calorias: workoutData.caloriasEstimadas || 300,
      tipo: workoutData.enfoque || 'General'
    });
    
    console.log('✅ Notificaciones procesadas correctamente');
  } catch (errorNotif) {
    console.error('⚠️ Error enviando notificaciones (no crítico):', errorNotif.message);
  }
  
  console.log('');
  
  // 6. RESPONDER CON ÉXITO
  res.json({
    success: true,
    message: 'Entrenamiento registrado exitosamente',
    data: {
      workoutId: workoutProgress._id,
      stats: {
        totalWorkouts: (user.fitnessStats?.totalWorkouts || 0) + 1,
        totalExercises: (user.fitnessStats?.totalExercises || 0) + totalExercises,
        totalMinutes: (user.fitnessStats?.totalMinutes || 0) + (workoutData.duracionTotal || 45),
        currentStreak: newStreak,
        maxStreak: newMaxStreak
      },
      achievementsUnlocked: achievementsUnlocked
    }
  });
};

// =============================================
// 🏆 VERIFICAR Y DESBLOQUEAR LOGROS (Función auxiliar)
// =============================================
async function verificarLogros(userId, totalWorkouts, currentStreak) {
  const user = await User.findById(userId);
    
  const logrosDisponibles = [
    {
      id: 'first_workout',
      nombre: 'Primera Rutina',
      descripcion: 'Completaste tu primera sesión',
      icon: '🎯',
      condition: totalWorkouts >= 1
    },
    {
      id: 'week_streak',
      nombre: 'Racha de 7 días',
      descripcion: 'Una semana sin parar',
      icon: '🔥',
      condition: currentStreak >= 7
    },
    {
      id: 'ten_workouts',
      nombre: 'Dedicación',
      descripcion: '10 rutinas completadas',
      icon: '💪',
      condition: totalWorkouts >= 10
    },
    {
      id: 'fifty_workouts',
      nombre: 'Guerrero',
      descripcion: '50 rutinas completadas',
      icon: '👑',
      condition: totalWorkouts >= 50
    }
  ];

  const achievementsDesbloqueados = [];
  const achievementsActuales = user.fitnessStats?.achievements || [];

  for (const logro of logrosDisponibles) {
    if (logro.condition) {
      const yaDesbloqueado = achievementsActuales.find(
        a => a.achievementId === logro.id
      );

      if (!yaDesbloqueado) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            'fitnessStats.achievements': {
              achievementId: logro.id,
              unlockedAt: new Date()
            }
          }
        });

        achievementsDesbloqueados.push({
          id: logro.id,
          nombre: logro.nombre,
          descripcion: logro.descripcion,
          icon: logro.icon
        });

        console.log(`🏆 Logro desbloqueado: ${logro.nombre}`);
      }
    }
  }

  return achievementsDesbloqueados;
}

// =============================================
// 📅 OBTENER HISTORIAL DE ENTRENAMIENTOS
// =============================================
exports.getHistorial = async (req, res) => {
  const { userId } = req.params;
  // ✅ SECURITY: Validar que el usuario autenticado solo puede acceder a sus propios datos
  if (req.user._id.toString() !== userId) {
    throw new AppError('No autorizado para acceder a estos datos', 403);
  }  const { limit = 20 } = req.query;

  console.log(`📅 Obteniendo historial para usuario: ${userId}`);

  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const workoutHistory = user.fitnessStats?.workoutHistory || [];
  
  // Ordenar por fecha descendente y limitar
  const historialOrdenado = workoutHistory
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, parseInt(limit));

  res.json({
    success: true,
    data: {
      workouts: historialOrdenado,
      total: workoutHistory.length
    }
  });

  console.log(`✅ Historial enviado: ${historialOrdenado.length} entrenamientos`);
};