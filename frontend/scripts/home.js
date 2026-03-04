// =============================================
// HOME STATS - FITAIID
// Cargar estadísticas reales del usuario en home.html
// =============================================

(function () {
  'use strict';

  console.log('🔧 Script home-stats.js iniciado');

  // Usar variables locales para evitar conflictos
  const authToken = localStorage.getItem("token") || localStorage.getItem("authToken");
  const currentUserId = localStorage.getItem("userId");

  console.log('🔐 Token:', authToken ? 'Presente ✅' : 'Ausente ❌');
  console.log('👤 UserID:', currentUserId || 'No encontrado');

  if (!authToken || !currentUserId) {
    console.log("❌ No autenticado, redirigiendo a login...");
    window.location.replace("login.html");
    return;
  }

  // Variables para estadísticas
  let homeStatsData = {
    currentStreak: 0,
    totalWorkouts: 0,
    totalAchievements: 0,
    unlockedAchievements: 0
  };

  // =============================================
  // ACTUALIZAR ESTADÍSTICAS EN LA UI
  // =============================================
  function actualizarStatsEnHome() {
    console.log('🎨 Actualizando UI con datos:', homeStatsData);

    // Actualizar racha de días
    const streakElement = document.getElementById('streakCount');
    if (streakElement) {
      streakElement.textContent = homeStatsData.currentStreak;
      console.log(`✅ Racha actualizada: ${homeStatsData.currentStreak}`);
    } else {
      console.error('❌ Elemento #streakCount no encontrado');
    }

    // Actualizar total de entrenamientos
    const workoutsElement = document.getElementById('workoutsCount');
    if (workoutsElement) {
      workoutsElement.textContent = homeStatsData.totalWorkouts;
      console.log(`✅ Entrenamientos actualizados: ${homeStatsData.totalWorkouts}`);
    } else {
      console.error('❌ Elemento #workoutsCount no encontrado');
    }

    // Actualizar metas logradas (logros desbloqueados)
    const goalsElement = document.getElementById('goalsCount');
    if (goalsElement) {
      goalsElement.textContent = homeStatsData.unlockedAchievements;
      console.log(`✅ Metas actualizadas: ${homeStatsData.unlockedAchievements}`);
    } else {
      console.error('❌ Elemento #goalsCount no encontrado');
    }

    console.log('✅ UI actualizada completamente');
  }

  // =============================================
  // CARGAR ESTADÍSTICAS DEL USUARIO
  // =============================================
  async function cargarEstadisticasHome() {
    try {
      console.log('🏠 Cargando estadísticas para home...');
      console.log('📡 URL Backend:', CONFIG.API_URL);

      // 1. Cargar estadísticas desde backend
      const statsUrl = `${CONFIG.API_URL}/api/estadisticas/${currentUserId}`;
      console.log('📊 Consultando:', statsUrl);

      const statsResponse = await fetch(statsUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const statsData = await statsResponse.json();

      console.log('📦 Respuesta stats:', statsData);

      if (statsData.success) {
        homeStatsData.currentStreak = statsData.data.currentStreak || 0;
        homeStatsData.totalWorkouts = statsData.data.workoutHistory?.length || 0;

        console.log(`✅ Stats backend: ${homeStatsData.totalWorkouts} entrenamientos, ${homeStatsData.currentStreak} días racha`);
      } else {
        console.warn('⚠️ Backend retornó success=false');
      }

      // 2. Cargar logros desde backend
      const achievementsUrl = `${CONFIG.API_URL}/api/logros/${currentUserId}`;
      console.log('🏆 Consultando:', achievementsUrl);

      const achievementsResponse = await fetch(achievementsUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const achievementsData = await achievementsResponse.json();

      console.log('📦 Respuesta logros:', achievementsData);

      if (achievementsData.success) {
        homeStatsData.unlockedAchievements = achievementsData.data.totalUnlocked || 0;
        homeStatsData.totalAchievements = achievementsData.data.totalPossible || 0;

        console.log(`✅ Logros backend: ${homeStatsData.unlockedAchievements}/${homeStatsData.totalAchievements}`);
      } else {
        console.warn('⚠️ Backend logros retornó success=false');
      }

      // 3. Actualizar UI
      actualizarStatsEnHome();

    } catch (error) {
      console.error('❌ Error cargando estadísticas desde backend:', error);
      console.error('Stack:', error.stack);

      // Fallback a localStorage
      cargarEstadisticasLocales();
    }
  }

  // =============================================
  // FALLBACK: CARGAR DESDE LOCALSTORAGE
  // =============================================
  function cargarEstadisticasLocales() {
    console.log('⚠️ Cargando estadísticas desde localStorage...');

    const savedStats = localStorage.getItem(`stats_${currentUserId}`);
    console.log('💾 Stats en localStorage:', savedStats ? 'Encontrado' : 'No encontrado');

    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        console.log('📦 Stats parseados:', stats);

        homeStatsData.currentStreak = stats.currentStreak || 0;
        homeStatsData.totalWorkouts = stats.workouts?.length || 0;

        console.log(`✅ Stats locales cargados: ${homeStatsData.totalWorkouts} entrenamientos, ${homeStatsData.currentStreak} racha`);
      } catch (e) {
        console.error('❌ Error parseando stats locales:', e);
      }
    } else {
      console.log('ℹ️ No hay stats guardados localmente, usando valores por defecto (0)');
    }

    actualizarStatsEnHome();
  }

  // =============================================
  // CARGAR SALUDO PERSONALIZADO
  // =============================================
  function cargarSaludoPersonalizado() {
    console.log('👋 Cargando saludo personalizado...');

    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) {
      console.warn('⚠️ No hay datos de usuario en localStorage');
      return;
    }

    const user = JSON.parse(userDataStr);
    const userName = user.firstName || user.first_name || user.name || user.nombre || 'Usuario';

    console.log('👤 Nombre de usuario:', userName);

    // Corregido: buscar el elemento correcto
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      userNameElement.textContent = userName.toUpperCase();
      console.log(`✅ Nombre de usuario actualizado: ${userName}`);
    } else {
      console.warn('⚠️ Elemento #userName no encontrado');
    }

    // Actualizar el saludo según la hora
    const greetingTextElement = document.getElementById('greetingText');
    if (greetingTextElement) {
      const hour = new Date().getHours();
      let greeting = '';

      if (hour < 12) {
        greeting = '¡Buenos días!';
      } else if (hour < 19) {
        greeting = '¡Buenas tardes!';
      } else {
        greeting = '¡Buenas noches!';
      }

      greetingTextElement.textContent = greeting;
      console.log(`✅ Saludo actualizado: ${greeting}`);
    } else {
      console.warn('⚠️ Elemento #greetingText no encontrado');
    }
  }

  // =============================================
  // CARGAR FRASE MOTIVACIONAL
  // =============================================
  function cargarFraseMotivacional() {
    console.log('💭 Cargando frase motivacional...');

    const quotes = [
      "El único mal entrenamiento es el que no hiciste.",
      "Tu cuerpo puede soportar casi cualquier cosa. Es tu mente la que debes convencer.",
      "No se trata de ser el mejor. Se trata de ser mejor que ayer.",
      "El dolor que sientes hoy será la fortaleza que sientas mañana.",
      "Los campeones se hacen cuando nadie está mirando.",
      "Tu único límite eres tú mismo.",
      "El éxito comienza con la voluntad de intentarlo.",
      "Cada día es una nueva oportunidad para mejorar.",
      "No cuentes los días, haz que los días cuenten.",
      "La disciplina es el puente entre metas y logros."
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const quoteElement = document.getElementById('motivationalQuote');

    if (quoteElement) {
      const parts = randomQuote.split('.');
      const firstPart = parts[0];
      const secondPart = parts.length > 1 ? '.' + parts.slice(1).join('.') : '';

      quoteElement.innerHTML = `"<strong>${firstPart}</strong>${secondPart}"`;
      console.log(`✅ Frase actualizada: ${randomQuote.substring(0, 50)}...`);
    } else {
      console.warn('⚠️ Elemento #motivationalQuote no encontrado');
    }
  }

  // =============================================
  // CARGAR DISTRIBUCIÓN DE ENTRENAMIENTOS
  // =============================================
  async function cargarDistribucionEntrenamientos() {
    try {
      console.log('📊 Cargando distribución de entrenamientos...');

      const response = await fetch(`${CONFIG.API_URL}/api/estadisticas/graficos/${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();

      if (data.success && data.data.focus) {
        generarGraficoDistribucion(data.data.focus);
        console.log('✅ Gráfico de distribución generado');
      } else {
        mostrarMensajeVacio();
      }
    } catch (error) {
      console.error('❌ Error cargando distribución:', error);
      mostrarMensajeVacio();
    }
  }

  function generarGraficoDistribucion(dataGrafico) {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) {
      console.error('❌ Canvas distributionChart no encontrado');
      return;
    }

    const labels = dataGrafico?.labels || ['Tren superior', 'Tren inferior', 'Full body'];
    const values = dataGrafico?.data || [0, 0, 0];
    const total = values.reduce((a, b) => a + b, 0);

    // Actualizar badge con total
    const badge = document.getElementById('totalWorkoutsDistribution');
    if (badge) {
      badge.textContent = `${total} rutinas`;
    }

    // Colores del gráfico
    const colors = [
      'rgba(255, 61, 0, 0.8)',
      'rgba(255, 107, 61, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(75, 192, 192, 0.8)'
    ];

    // Crear gráfico
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#111',
          hoverBorderColor: '#fff',
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false // Usaremos leyenda personalizada
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '65%',
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    });

    // Generar leyenda personalizada
    generarLeyendaPersonalizada(labels, values, colors, total);
  }

  function generarLeyendaPersonalizada(labels, values, colors, total) {
    const legendContainer = document.getElementById('distributionLegend');
    if (!legendContainer) return;

    legendContainer.innerHTML = '';

    labels.forEach((label, index) => {
      const value = values[index];
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <div class="legend-item-left">
          <div class="legend-color" style="background: ${colors[index]}"></div>
          <span class="legend-label">${label}</span>
        </div>
        <div>
          <span class="legend-value">${value}</span>
          <span class="legend-percentage">(${percentage}%)</span>
        </div>
      `;

      legendContainer.appendChild(item);
    });
  }

  function mostrarMensajeVacio() {
    const container = document.querySelector('.distribution-content');
    if (!container) return;

    container.innerHTML = `
      <div class="empty-chart-message">
        <i class="fas fa-chart-pie"></i>
        <p>Aún no tienes entrenamientos registrados</p>
        <a href="entrenador.html" class="empty-chart-btn">
          <i class="fas fa-dumbbell"></i>
          Empezar Primera Rutina
        </a>
      </div>
    `;
  }

  // =============================================
  // INICIALIZACIÓN
  // =============================================
  function inicializar() {
    console.log('🚀 Inicializando home-stats.js');

    // Cargar estadísticas
    cargarEstadisticasHome();

    // Cargar saludo personalizado
    cargarSaludoPersonalizado();

    // Cargar frase motivacional
    cargarFraseMotivacional();

    // Cargar distribución de entrenamientos
    cargarDistribucionEntrenamientos();

    console.log('✅ Inicialización completada');
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    // DOM ya está listo
    inicializar();
  }

})();
// =============================================
// DESAFÍO RÁPIDO: 60 SEGUNDOS
// =============================================

// Variables del desafío
let challengeTimer = null;
let challengeTimeLeft = 60;
let challengeCount = 0;
let challengeActive = false;

// Ejercicios disponibles para el desafío
const challengeExercises = [
  { name: 'BURPEES', emoji: '🏃', difficulty: 'alto' },
  { name: 'JUMPING JACKS', emoji: '🤸', difficulty: 'medio' },
  { name: 'SENTADILLAS', emoji: '🦵', difficulty: 'medio' },
  { name: 'MOUNTAIN CLIMBERS', emoji: '⛰️', difficulty: 'alto' },
  { name: 'HIGH KNEES', emoji: '🏋️', difficulty: 'alto' },
  { name: 'FLEXIONES', emoji: '💪', difficulty: 'medio' }
];

// Inicializar desafío al cargar la página
function inicializarDesafio() {
  console.log('🎯 Inicializando Desafío Rápido...');

  // Seleccionar ejercicio aleatorio del día
  const randomExercise = challengeExercises[Math.floor(Math.random() * challengeExercises.length)];
  document.getElementById('challengeExerciseEmoji').textContent = randomExercise.emoji;
  document.getElementById('challengeExerciseName').textContent = randomExercise.name;

  // Cargar récords
  cargarRecordsDesafio();

  // Cargar racha
  cargarRachaDesafio();

  // CRÍTICO: Agregar event listener al botón de contar
  const countBtn = document.getElementById('countBtn');
  if (countBtn) {
    countBtn.addEventListener('click', incrementarContador);
    console.log('✅ Event listener agregado al botón de contar');
  } else {
    console.error('❌ Botón countBtn no encontrado');
  }
}

function cargarRecordsDesafio() {
  const userId = localStorage.getItem('userId');
  const personalRecord = localStorage.getItem(`challenge_record_${userId}`) || '-';
  const globalRecord = localStorage.getItem('challenge_global_record') || '45';

  document.getElementById('personalRecord').textContent = personalRecord !== '-' ? personalRecord : '-';
  document.getElementById('globalRecord').textContent = globalRecord;

  console.log(`📊 Récords cargados - Personal: ${personalRecord}, Global: ${globalRecord}`);
}

function cargarRachaDesafio() {
  const userId = localStorage.getItem('userId');
  const streak = localStorage.getItem(`challenge_streak_${userId}`) || '0';
  document.getElementById('challengeStreak').textContent = streak;

  console.log(`🔥 Racha cargada: ${streak} días`);
}

function iniciarDesafio() {
  console.log('🚀 Iniciando desafío...');

  // Cambiar a estado activo
  document.getElementById('challengeInitial').classList.remove('active');
  document.getElementById('challengeActive').classList.add('active');

  // Resetear valores
  challengeTimeLeft = 60;
  challengeCount = 0;
  challengeActive = true;

  document.getElementById('challengeTimer').textContent = '60';
  document.getElementById('challengeCounter').textContent = '0';

  console.log('✅ Estados actualizados, contador en: ' + challengeCount);

  // Iniciar temporizador
  const progressCircle = document.getElementById('timerProgress');
  const circumference = 565.48; // 2 * PI * 90

  challengeTimer = setInterval(() => {
    challengeTimeLeft--;
    document.getElementById('challengeTimer').textContent = challengeTimeLeft;

    // Actualizar círculo de progreso
    const progress = (challengeTimeLeft / 60) * circumference;
    progressCircle.style.strokeDashoffset = circumference - progress;

    // Cambiar color cuando quedan 10 segundos
    if (challengeTimeLeft <= 10) {
      progressCircle.style.stroke = '#ffaa00';
      document.getElementById('challengeTimer').style.color = '#ffaa00';
    }

    if (challengeTimeLeft <= 0) {
      finalizarDesafio();
    }
  }, 1000);

  console.log('⏱️ Timer iniciado');
}

function incrementarContador() {
  if (challengeActive) {
    challengeCount++;
    const counterElement = document.getElementById('challengeCounter');
    counterElement.textContent = challengeCount;

    console.log(`✅ Contador incrementado: ${challengeCount}`);

    // Trigger animation
    counterElement.style.animation = 'none';
    setTimeout(() => {
      counterElement.style.animation = 'counter-pulse 0.3s ease';
    }, 10);

    // Feedback táctil si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } else {
    console.warn('⚠️ Desafío no activo, contador no incrementa');
  }
}

function detenerDesafio() {
  if (confirm('¿Seguro que quieres detener el desafío?')) {
    console.log(`🛑 Desafío detenido por el usuario con ${challengeCount} repeticiones`);

    clearInterval(challengeTimer);
    challengeActive = false;

    // Si el usuario detuvo pero hizo repeticiones, mostrar resultado
    if (challengeCount > 0) {
      finalizarDesafio();
    } else {
      // Volver al estado inicial solo si no hizo nada
      document.getElementById('challengeActive').classList.remove('active');
      document.getElementById('challengeInitial').classList.add('active');

      // Resetear progreso
      document.getElementById('timerProgress').style.strokeDashoffset = '0';
      document.getElementById('timerProgress').style.stroke = 'var(--accent)';
      document.getElementById('challengeTimer').style.color = 'var(--accent)';
    }
  }
}
function finalizarDesafio() {
  console.log(`🏁 Desafío finalizado con ${challengeCount} repeticiones`);

  clearInterval(challengeTimer);
  challengeActive = false;

  // CRÍTICO: Guardar el contador ANTES de cambiar de pantalla
  const finalScore = challengeCount;
  console.log(`💾 Score final guardado: ${finalScore}`);

  // Cambiar a estado de resultado
  document.getElementById('challengeActive').classList.remove('active');

  // ESPERAR un momento antes de mostrar resultado (para que la UI se actualice)
  setTimeout(() => {
    document.getElementById('challengeResult').classList.add('active');

    // Mostrar resultado
    document.getElementById('resultScore').textContent = finalScore;
    console.log(`📊 Score mostrado en UI: ${finalScore}`);

    // Calcular mejora
    const userId = localStorage.getItem('userId');
    const previousRecord = parseInt(localStorage.getItem(`challenge_record_${userId}`)) || 0;

    let improvement = '-';
    let title = '¡BUEN INTENTO!';

    if (finalScore > previousRecord) {
      if (previousRecord > 0) {
        improvement = `+${Math.round((finalScore - previousRecord) / previousRecord * 100)}%`;
      } else {
        improvement = '+100%';
      }
      title = '🔥 ¡NUEVO RÉCORD! 🔥';

      // Guardar nuevo récord
      localStorage.setItem(`challenge_record_${userId}`, finalScore.toString());
      console.log(`🏆 Nuevo récord guardado: ${finalScore}`);

      // Actualizar racha
      actualizarRachaDesafio();

      // Actualizar récord personal en la UI inmediatamente
      document.getElementById('personalRecord').textContent = finalScore;

    } else if (finalScore === previousRecord && previousRecord > 0) {
      improvement = '0%';
      title = '¡IGUALASTE TU RÉCORD!';
    } else if (previousRecord > 0) {
      improvement = `${Math.round((finalScore - previousRecord) / previousRecord * 100)}%`;
    }

    document.getElementById('resultTitle').textContent = title;
    document.getElementById('improvementPercent').textContent = improvement;

    // Calcular ritmo (reps por segundo)
    const pace = (finalScore / 60).toFixed(1);
    document.getElementById('paceValue').textContent = `${pace} reps/seg`;

    // Resetear progreso visual
    document.getElementById('timerProgress').style.strokeDashoffset = '0';
    document.getElementById('timerProgress').style.stroke = 'var(--accent)';
    document.getElementById('challengeTimer').style.color = 'var(--accent)';

    console.log(`📊 Resultados mostrados - Mejora: ${improvement}, Ritmo: ${pace} reps/seg`);

  }, 100); // Pequeño delay para asegurar que la transición sea visible
}

function actualizarRachaDesafio() {
  const userId = localStorage.getItem('userId');
  const today = new Date().toDateString();
  const lastChallengeDate = localStorage.getItem(`challenge_last_date_${userId}`);

  let streak = parseInt(localStorage.getItem(`challenge_streak_${userId}`)) || 0;

  if (lastChallengeDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastChallengeDate === yesterday.toDateString()) {
      // Consecutivo
      streak++;
    } else {
      // Se rompió la racha
      streak = 1;
    }

    localStorage.setItem(`challenge_streak_${userId}`, streak.toString());
    localStorage.setItem(`challenge_last_date_${userId}`, today);
    document.getElementById('challengeStreak').textContent = streak;

    console.log(`🔥 Racha actualizada: ${streak} días`);
  }
}

function reiniciarDesafio() {
  console.log('🔄 Reiniciando desafío...');

  // Volver al estado inicial
  document.getElementById('challengeResult').classList.remove('active');
  document.getElementById('challengeInitial').classList.add('active');

  // Recargar récords
  cargarRecordsDesafio();
}

function compartirResultado() {
  const score = challengeCount;
  const exerciseName = document.getElementById('challengeExerciseName').textContent;
  const text = `🔥 ¡Hice ${score} ${exerciseName} en 60 segundos en FitAiid! ¿Puedes superarme? 💪`;

  console.log('📤 Compartiendo resultado:', text);

  if (navigator.share) {
    navigator.share({
      title: 'Desafío FitAiid',
      text: text
    }).then(() => {
      console.log('✅ Compartido exitosamente');
    }).catch(err => {
      console.log('❌ Error compartiendo:', err);
    });
  } else {
    // Fallback: copiar al portapapeles
    navigator.clipboard.writeText(text).then(() => {
      alert('¡Resultado copiado al portapapeles!');
      console.log('✅ Copiado al portapapeles');
    }).catch(err => {
      console.error('❌ Error copiando:', err);
    });
  }
}

// Inicializar desafío cuando cargue la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarDesafio);
} else {
  inicializarDesafio();
}
// =============================================
// SISTEMA DE AYUDA DE EJERCICIOS CON FITTY
// =============================================

let ejercicioActual = null;

function abrirAyudaEjercicio(nombreEjercicio, descripcion) {
  console.log(`💬 Abriendo ayuda para: ${nombreEjercicio}`);

  ejercicioActual = {
    nombre: nombreEjercicio,
    descripcion: descripcion
  };

  // Mostrar overlay
  const overlay = document.getElementById('exerciseChatOverlay');
  overlay.classList.add('active');

  // Actualizar título
  document.getElementById('exerciseChatSubtitle').textContent = nombreEjercicio;

  // Limpiar mensajes anteriores
  const messagesContainer = document.getElementById('exerciseChatMessages');
  messagesContainer.innerHTML = '';

  // Mensaje inicial de Fitty
  agregarMensajeEjercicio(
    `¡Hola! 👋 Soy Fitty, tu coach virtual. Te voy a ayudar con el ejercicio <strong>${nombreEjercicio}</strong>. 
    
¿Qué te gustaría saber? Puedo explicarte:
- ✅ Cómo hacer el ejercicio correctamente
- ✅ Músculos que trabaja
- ✅ Errores comunes a evitar
- ✅ Variaciones según tu nivel
- ✅ Recomendaciones de seguridad

¡Pregúntame lo que necesites! 💪`,
    'bot'
  );

  // Focus en el input
  setTimeout(() => {
    document.getElementById('exerciseChatInput').focus();
  }, 300);
}

function cerrarAyudaEjercicio() {
  const overlay = document.getElementById('exerciseChatOverlay');
  overlay.classList.remove('active');
  ejercicioActual = null;
}

function agregarMensajeEjercicio(texto, tipo) {
  const messagesContainer = document.getElementById('exerciseChatMessages');

  const messageDiv = document.createElement('div');
  messageDiv.className = `exercise-message ${tipo}`;

  const avatar = document.createElement('div');
  avatar.className = 'exercise-message-avatar';
  avatar.innerHTML = tipo === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

  const content = document.createElement('div');
  content.className = 'exercise-message-content';
  content.innerHTML = texto;

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function mostrarEscribiendoEjercicio() {
  const messagesContainer = document.getElementById('exerciseChatMessages');

  const typingDiv = document.createElement('div');
  typingDiv.id = 'exerciseTyping';
  typingDiv.className = 'exercise-message bot';
  typingDiv.innerHTML = `
    <div class="exercise-message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="exercise-message-content exercise-typing">
      <i class="fas fa-circle-notch fa-spin"></i>
      Fitty está escribiendo...
    </div>
  `;

  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removerEscribiendoEjercicio() {
  const typingDiv = document.getElementById('exerciseTyping');
  if (typingDiv) {
    typingDiv.remove();
  }
}

async function enviarPreguntaEjercicio() {
  const input = document.getElementById('exerciseChatInput');
  const pregunta = input.value.trim();

  if (!pregunta) return;

  // Agregar mensaje del usuario
  agregarMensajeEjercicio(pregunta, 'user');
  input.value = '';

  // Mostrar "escribiendo..."
  mostrarEscribiendoEjercicio();

  try {
    const userId = localStorage.getItem('userId');
    const contexto = `El usuario pregunta sobre el ejercicio: ${ejercicioActual.nombre}. Descripción: ${ejercicioActual.descripcion}. Pregunta del usuario: ${pregunta}`;

    const response = await fetch(`${CONFIG.API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        message: contexto,
        userId: userId || 'anonymous',
        contexto: 'ayuda_ejercicio'
      })
    });

    const data = await response.json();

    removerEscribiendoEjercicio();

    if (data.reply) {
      agregarMensajeEjercicio(data.reply, 'bot');
    } else {
      agregarMensajeEjercicio('Lo siento, hubo un error. Por favor intenta de nuevo.', 'bot');
    }

  } catch (error) {
    console.error('❌ Error en chat de ejercicio:', error);
    removerEscribiendoEjercicio();
    agregarMensajeEjercicio(
      'Error de conexión. Verifica tu internet e intenta de nuevo. 🔌',
      'bot'
    );
  }
}

function handleExerciseChatKeypress(event) {
  if (event.key === 'Enter') {
    enviarPreguntaEjercicio();
  }
}

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('exerciseChatOverlay');
    if (overlay && overlay.classList.contains('active')) {
      cerrarAyudaEjercicio();
    }
  }
});