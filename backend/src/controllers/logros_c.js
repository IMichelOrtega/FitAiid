// =============================================
// CONTROLADOR DE LOGROS - FITAIID
// =============================================

const User = require('../models/User');
const AppError = require('../middleware/errorHandler').AppError;

// =============================================
// 🏆 OBTENER LOGROS DEL USUARIO
// =============================================
exports.getLogros = async (req, res) => {
  const { userId } = req.params;

  console.log(`🏆 Obteniendo logros para usuario: ${userId}`);

  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Lista completa de logros posibles
  const todosLosLogros = [
    {
      id: 'first_workout',
      icon: '🎯',
      nombre: 'Primera Rutina',
      descripcion: 'Completaste tu primera sesión',
      condition: (user.fitnessStats?.totalWorkouts || 0) >= 1
    },
    {
      id: 'week_streak',
      icon: '🔥',
      nombre: 'Racha de 7 días',
      descripcion: 'Una semana sin parar',
      condition: (user.fitnessStats?.currentStreak || 0) >= 7
    },
    {
      id: 'ten_workouts',
      icon: '💪',
      nombre: 'Dedicación',
      descripcion: '10 rutinas completadas',
      condition: (user.fitnessStats?.totalWorkouts || 0) >= 10
    },
    {
      id: 'fifty_workouts',
      icon: '👑',
      nombre: 'Guerrero',
      descripcion: '50 rutinas completadas',
      condition: (user.fitnessStats?.totalWorkouts || 0) >= 50
    },
    {
      id: 'month_streak',
      icon: '🌟',
      nombre: 'Leyenda',
      descripcion: 'Racha de 30 días',
      condition: (user.fitnessStats?.currentStreak || 0) >= 30
    },
    {
      id: 'hundred_exercises',
      icon: '🏆',
      nombre: 'Incansable',
      descripcion: '100 ejercicios completados',
      condition: (user.fitnessStats?.totalExercises || 0) >= 100
    },
    {
      id: 'consistency',
      icon: '📅',
      nombre: 'Consistente',
      descripcion: '4 semanas seguidas entrenando',
      condition: (user.fitnessStats?.maxStreak || 0) >= 28
    }
  ];

  // Marcar cuáles están desbloqueados
  const logrosConEstado = todosLosLogros.map(logro => {
    const desbloqueado = user.fitnessStats?.achievements?.find(
      a => a.achievementId === logro.id
    );
    
    return {
      ...logro,
      unlocked: logro.condition,
      unlockedAt: desbloqueado?.unlockedAt || null
    };
  });

  const totalUnlocked = logrosConEstado.filter(l => l.unlocked).length;

  console.log(`✅ Logros: ${totalUnlocked}/${todosLosLogros.length} desbloqueados`);

  res.json({
    success: true,
    data: {
      achievements: logrosConEstado,
      totalUnlocked: totalUnlocked,
      totalPossible: todosLosLogros.length
    }
  });
};