// =============================================
// ESTADÃSTICAS - FITAIID (ACTUALIZADO)
// Con sincronización completa desde backend
// =============================================

// Verificar autenticación
const token = localStorage.getItem("token") || localStorage.getItem("authToken");
const userId = localStorage.getItem("userId");

if (!token || !userId) {
  console.log("❌ No autenticado, redirigiendo a login...");
  window.location.replace("login.html");
}

// Variables globales
let userProfile = null;
let statsData = {
  workouts: [],
  achievements: [],
  totalExercises: 0,
  totalMinutes: 0,
  currentStreak: 0,
  maxStreak: 0
};

// =============================================
// CARGAR DATOS DEL USUARIO DESDE BACKEND
// =============================================
async function cargarDatosUsuario() {
  try {
    console.log('📊 Cargando estadísticas desde backend...');

    // 1. Cargar perfil fitness
    const perfilResponse = await fetch(`${CONFIG.API_URL}/api/questionnaire/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const perfilData = await perfilResponse.json();

    if (perfilData.success && perfilData.data?.fitnessProfile) {
      userProfile = perfilData.data.fitnessProfile;
      console.log('✅ Perfil fitness cargado');
    }

    // 2. Cargar estadísticas completas desde backend
    const statsResponse = await fetch(`${CONFIG.API_URL}/api/estadisticas/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const statsBackend = await statsResponse.json();

    if (statsBackend.success) {
      // Actualizar datos con los del backend
      statsData = {
        workouts: statsBackend.data.workoutHistory || [],
        totalExercises: statsBackend.data.totalExercises || 0,
        totalMinutes: statsBackend.data.totalMinutes || 0,
        currentStreak: statsBackend.data.currentStreak || 0,
        maxStreak: statsBackend.data.maxStreak || 0,
        achievements: statsBackend.data.achievements || [],
        thisWeekWorkouts: statsBackend.data.thisWeekWorkouts || 0,
        thisMonthWorkouts: statsBackend.data.thisMonthWorkouts || 0
      };

      console.log('✅ Estadísticas cargadas desde backend:', statsData);
      console.log(`   📊 Total entrenamientos: ${statsData.workouts.length}`);
      console.log(`   🔥 Racha actual: ${statsData.currentStreak} días`);
      console.log(`   ⏱️ Total horas: ${(statsData.totalMinutes / 60).toFixed(1)}`);
    }

    // 3. Actualizar UI con los datos
    actualizarEstadisticas();
    cargarLogros();
    await generarGraficos();
    mostrarActividadReciente();

  } catch (error) {
    console.error('❌ Error cargando datos del backend:', error);

    // Fallback a localStorage si falla el backend
    console.log('⚠️ Intentando cargar desde localStorage...');
    cargarDatosLocales();
  }
}

// =============================================
// FALLBACK: CARGAR DATOS LOCALES
// =============================================
function cargarDatosLocales() {
  const fitnessProfile = localStorage.getItem('fitnessProfile');
  if (fitnessProfile) {
    userProfile = JSON.parse(fitnessProfile);
  }

  const savedStats = localStorage.getItem(`stats_${userId}`);
  if (savedStats) {
    statsData = JSON.parse(savedStats);
    console.log('✅ Estadísticas cargadas desde localStorage');
  }

  actualizarEstadisticas();
  cargarLogros();
  generarGraficos();
  mostrarActividadReciente();
  mostrarProgresoSemanal();
  mostrarComparativas();
  mostrarResumenMensual();
}
// =============================================
// ACTUALIZAR ESTADÃSTICAS EN LA UI
// =============================================
function actualizarEstadisticas() {
  // Total de rutinas completadas
  document.getElementById('totalWorkouts').textContent = statsData.workouts.length || 0;

  // Rutinas esta semana
  document.getElementById('weeklyProgress').textContent =
    `Esta semana: ${statsData.thisWeekWorkouts || 0}`;

  // Racha actual
  document.getElementById('currentStreak').textContent = statsData.currentStreak || 0;

  // Tiempo total (convertir minutos a horas)
  const totalHours = ((statsData.totalMinutes || 0) / 60).toFixed(1);
  document.getElementById('totalTime').textContent = totalHours;

  // Ejercicios completados
  document.getElementById('totalExercises').textContent = statsData.totalExercises || 0;

  // Actualizar barras de progreso
  actualizarBarrasProgreso();
}

// =============================================
// ACTUALIZAR BARRAS DE PROGRESO
// =============================================
function actualizarBarrasProgreso() {
  // Meta mensual de rutinas (12 por mes = 3 por semana)
  const thisMonthWorkouts = statsData.thisMonthWorkouts || 0;
  const monthlyGoal = 12;
  const monthlyProgress = Math.min((thisMonthWorkouts / monthlyGoal) * 100, 100);

  document.getElementById('monthlyGoalProgress').textContent = `${thisMonthWorkouts}/${monthlyGoal}`;
  document.getElementById('monthlyGoalBar').style.width = `${monthlyProgress}%`;

  // Meta de horas mensuales
  const hoursGoal = 10;
  const monthlyHours = ((statsData.totalMinutes || 0) / 60).toFixed(1);
  const hoursProgress = Math.min((monthlyHours / hoursGoal) * 100, 100);

  document.getElementById('hoursGoalProgress').textContent = `${monthlyHours}/${hoursGoal}`;
  document.getElementById('hoursGoalBar').style.width = `${hoursProgress}%`;

  // Meta de racha
  const streakGoal = 7;
  const currentStreak = statsData.currentStreak || 0;
  const streakProgress = Math.min((currentStreak / streakGoal) * 100, 100);

  document.getElementById('streakGoalProgress').textContent = `${currentStreak}/${streakGoal}`;
  document.getElementById('streakGoalBar').style.width = `${streakProgress}%`;
}

// =============================================
// CARGAR LOGROS DESDE BACKEND
// =============================================
async function cargarLogros() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/logros/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (data.success) {
      const grid = document.getElementById('achievementsGrid');
      grid.innerHTML = '';

      data.data.achievements.forEach(achievement => {
        const div = document.createElement('div');
        div.className = `achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`;

        const unlockedDate = achievement.unlockedAt
          ? new Date(achievement.unlockedAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
          })
          : null;

        div.innerHTML = `
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-name">${achievement.nombre}</div>
          <div class="achievement-desc">${achievement.descripcion}</div>
          ${unlockedDate ? `<div class="achievement-date">Desbloqueado: ${unlockedDate}</div>` : ''}
        `;

        grid.appendChild(div);
      });

      console.log(`🏆 Logros cargados: ${data.data.totalUnlocked}/${data.data.totalPossible}`);
    }
  } catch (error) {
    console.error('❌ Error cargando logros:', error);
    cargarLogrosLocales();
  }
}

// Fallback para logros locales
function cargarLogrosLocales() {
  const achievements = [
    {
      id: 'first_workout',
      icon: '🎯',
      nombre: 'Primera Rutina',
      descripcion: 'Completaste tu primera sesión',
      condition: () => statsData.workouts.length >= 1
    },
    {
      id: 'week_streak',
      icon: '🔥',
      nombre: 'Racha de 7 días',
      descripcion: 'Una semana sin parar',
      condition: () => statsData.currentStreak >= 7
    },
    {
      id: 'ten_workouts',
      icon: '💪',
      nombre: 'Dedicación',
      descripcion: '10 rutinas completadas',
      condition: () => statsData.workouts.length >= 10
    },
    {
      id: 'fifty_workouts',
      icon: '👑',
      nombre: 'Guerrero',
      descripcion: '50 rutinas completadas',
      condition: () => statsData.workouts.length >= 50
    }
  ];

  const grid = document.getElementById('achievementsGrid');
  grid.innerHTML = '';

  achievements.forEach(achievement => {
    const unlocked = achievement.condition();

    const div = document.createElement('div');
    div.className = `achievement ${unlocked ? 'unlocked' : 'locked'}`;
    div.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-name">${achievement.nombre}</div>
      <div class="achievement-desc">${achievement.descripcion}</div>
    `;

    grid.appendChild(div);
  });
}

// =============================================
// GENERAR GRÃFICOS CON DATOS DEL BACKEND
// =============================================
async function generarGraficos() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/estadisticas/graficos/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (data.success) {
      generarGraficoSemanal(data.data.weekly);
      generarGraficoMensual(data.data.monthly);
      generarGraficoEnfoques(data.data.focus);
      generarGraficoHorarios(data.data.time);

      console.log('📈 Gráficos generados con datos del backend');
    }
  } catch (error) {
    console.error('❌ Error cargando datos de gráficos:', error);
    generarGraficosLocales();
  }
}

function generarGraficoSemanal(dataGrafico) {
  const ctx = document.getElementById('weeklyChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dataGrafico?.labels || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Entrenamientos',
        data: dataGrafico?.data || [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(255, 61, 0, 0.8)',
        borderColor: 'rgba(255, 61, 0, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#b0b0b0'
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        x: {
          ticks: { color: '#b0b0b0' },
          grid: { display: false }
        }
      }
    }
  });
}

function generarGraficoMensual(dataGrafico) {
  const ctx = document.getElementById('monthlyChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataGrafico?.labels || ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [{
        label: 'Entrenamientos',
        data: dataGrafico?.data || [0, 0, 0, 0],
        borderColor: 'rgba(255, 61, 0, 1)',
        backgroundColor: 'rgba(255, 61, 0, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: 'rgba(255, 61, 0, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#b0b0b0'
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        x: {
          ticks: { color: '#b0b0b0' },
          grid: { display: false }
        }
      }
    }
  });
}

function generarGraficoEnfoques(dataGrafico) {
  const ctx = document.getElementById('focusChart').getContext('2d');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: dataGrafico?.labels || ['Tren superior', 'Tren inferior', 'Full body'],
      datasets: [{
        data: dataGrafico?.data || [0, 0, 0],
        backgroundColor: [
          'rgba(255, 61, 0, 0.8)',
          'rgba(255, 107, 61, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ],
        borderWidth: 2,
        borderColor: '#111'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#b0b0b0' }
        }
      }
    }
  });
}

function generarGraficoHorarios(dataGrafico) {
  const ctx = document.getElementById('timeChart').getContext('2d');

  new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: dataGrafico?.labels || ['Mañana', 'Mediodía', 'Tarde', 'Noche'],
      datasets: [{
        data: dataGrafico?.data || [0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderWidth: 2,
        borderColor: '#111'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#b0b0b0' }
        }
      },
      scales: {
        r: {
          ticks: {
            color: '#b0b0b0',
            backdropColor: 'transparent'
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

function generarGraficosLocales() {
  generarGraficoSemanal(null);
  generarGraficoMensual(null);
  generarGraficoEnfoques(null);
  generarGraficoHorarios(null);
}

// =============================================
// MOSTRAR ACTIVIDAD RECIENTE
// =============================================
function mostrarActividadReciente() {
  const activityList = document.getElementById('activityList');

  if (!statsData.workouts || statsData.workouts.length === 0) {
    activityList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>No hay actividad reciente. ¡Comienza tu primera rutina!</p>
        <a href="entrenador.html" class="btn-start">Generar Rutina</a>
      </div>
    `;
    return;
  }

  // Mostrar últimos 5 entrenamientos
  const recentWorkouts = statsData.workouts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  activityList.innerHTML = recentWorkouts.map(workout => {
    const date = new Date(workout.date);
    const timeAgo = getTimeAgo(date);

    return `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-dumbbell"></i>
        </div>
        <div class="activity-info">
          <div class="activity-title">${workout.nombre || 'Entrenamiento completado'}</div>
          <div class="activity-details">${workout.enfoque || 'Rutina personalizada'} • ${workout.duracionTotal || 45} min</div>
        </div>
        <div class="activity-time">${timeAgo}</div>
      </div>
    `;
  }).join('');
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// =============================================
// LOGOUT
// =============================================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Estadísticas inicializadas');
  cargarDatosUsuario();
});

