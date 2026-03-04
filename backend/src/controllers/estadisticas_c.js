// =============================================
// CONTROLADOR DE ESTADÍSTICAS - FITAIID
// =============================================

const WorkoutProgress = require('../models/WorkoutProgress');
const User = require('../models/User');
const AppError = require('../config/AppError');

// =============================================
// 📊 OBTENER ESTADÍSTICAS COMPLETAS DEL USUARIO
// =============================================
exports.getEstadisticas = async (req, res) => {
  const { userId } = req.params;

  console.log(`📊 Obteniendo estadísticas para usuario: ${userId}`);

  // ✅ SECURITY: Validar que el usuario autenticado solo puede acceder a sus propios datos
  if (req.user._id.toString() !== userId) {
    throw new AppError('No autorizado para acceder a estos datos', 403);
  }

  // Buscar usuario en MongoDB
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Obtener todos los entrenamientos del historial
  const workoutHistory = user.fitnessStats?.workoutHistory || [];
  
  // Calcular estadísticas de esta semana
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const thisWeekWorkouts = workoutHistory.filter(w => {
    const workoutDate = new Date(w.date);
    return workoutDate >= oneWeekAgo;
  }).length;

  // Calcular estadísticas de este mes
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const thisMonthWorkouts = workoutHistory.filter(w => {
    const workoutDate = new Date(w.date);
    return workoutDate >= oneMonthAgo;
  }).length;

  // Responder con estadísticas completas
  res.json({
    success: true,
    data: {
      totalWorkouts: user.fitnessStats?.totalWorkouts || 0,
      totalExercises: user.fitnessStats?.totalExercises || 0,
      totalMinutes: user.fitnessStats?.totalMinutes || 0,
      currentStreak: user.fitnessStats?.currentStreak || 0,
      maxStreak: user.fitnessStats?.maxStreak || 0,
      thisWeekWorkouts: thisWeekWorkouts,
      thisMonthWorkouts: thisMonthWorkouts,
      workoutHistory: workoutHistory.slice(-20), // Últimos 20 entrenamientos
      achievements: user.fitnessStats?.achievements || []
    }
  });

  console.log(`✅ Estadísticas enviadas: ${user.fitnessStats?.totalWorkouts || 0} entrenamientos`);
};

// =============================================
// 📈 OBTENER DATOS PARA GRÁFICOS
// =============================================
exports.getGraficos = async (req, res) => {
  const { userId } = req.params;

  console.log(`📈 Obteniendo datos de gráficos para usuario: ${userId}`);

  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const workouts = user.fitnessStats?.workoutHistory || [];

  // 1. GRÁFICO SEMANAL (por día de la semana)
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const countsPorDia = [0, 0, 0, 0, 0, 0, 0];
  
  workouts.forEach(w => {
    const day = new Date(w.date).getDay();
    const adjustedDay = day === 0 ? 6 : day - 1;
    countsPorDia[adjustedDay]++;
  });

  // 2. GRÁFICO MENSUAL (últimas 4 semanas)
  const now = new Date();
  const semanasCounts = [0, 0, 0, 0];
  
  workouts.forEach(w => {
    const workoutDate = new Date(w.date);
    const weeksDiff = Math.floor((now - workoutDate) / (1000 * 60 * 60 * 24 * 7));
    
    if (weeksDiff >= 0 && weeksDiff < 4) {
      semanasCounts[3 - weeksDiff]++;
    }
  });

  // 3. DISTRIBUCIÓN POR ENFOQUE
  const enfoques = {};
  workouts.forEach(w => {
    const enfoque = w.enfoque || 'Sin categoría';
    enfoques[enfoque] = (enfoques[enfoque] || 0) + 1;
  });

  const enfoquesLabels = Object.keys(enfoques).length > 0 
    ? Object.keys(enfoques) 
    : ['Tren superior', 'Tren inferior', 'Full body'];
  const enfoquesData = Object.keys(enfoques).length > 0 
    ? Object.values(enfoques) 
    : [0, 0, 0];

  // 4. DISTRIBUCIÓN POR HORARIO
  const horarios = {
    'Mañana': 0,
    'Mediodía': 0,
    'Tarde': 0,
    'Noche': 0
  };
  
  workouts.forEach(w => {
    const hour = new Date(w.date).getHours();
    
    if (hour >= 5 && hour < 12) {
      horarios['Mañana']++;
    } else if (hour >= 12 && hour < 17) {
      horarios['Mediodía']++;
    } else if (hour >= 17 && hour < 21) {
      horarios['Tarde']++;
    } else {
      horarios['Noche']++;
    }
  });

  res.json({
    success: true,
    data: {
      weekly: {
        labels: diasSemana,
        data: countsPorDia
      },
      monthly: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        data: semanasCounts
      },
      focus: {
        labels: enfoquesLabels,
        data: enfoquesData
      },
      time: {
        labels: Object.keys(horarios),
        data: Object.values(horarios)
      }
    }
  });

  console.log(`📈 Datos de gráficos enviados`);
};