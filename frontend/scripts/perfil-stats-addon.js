// =============================================
// PERFIL-STATS-ADDON.JS
// Agrega funcionalidades de estadísticas al perfil
// SIN MODIFICAR el código existente
// =============================================

(function() {
  'use strict';
  
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  
  // Variables globales
  let todosLosLogros = [];
  let logrosExpandidos = false;
  
  // Esperar a que el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Addon de estadísticas inicializado');
    
    // Verificar autenticación
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn('⚠️ No hay usuario logueado');
      return;
    }
    
    // Inicializar funcionalidades
    inicializarEstadisticas();
    configurarExpandirLogros();
  });
  
  // =============================================
  // CONFIGURAR EXPANSIÓN DE LOGROS
  // =============================================
  function configurarExpandirLogros() {
    // Buscar el botón "Ver Todos" en la sección de logros
    const cardLogros = document.querySelector('.achievements-grid').closest('.card');
    if (!cardLogros) return;
    
    const btnVerTodos = cardLogros.querySelector('.card-action');
    if (!btnVerTodos) return;
    
    // Agregar evento click
    btnVerTodos.addEventListener('click', function(e) {
      e.preventDefault();
      toggleLogros();
    });
    
    console.log('✅ Expansión de logros configurada');
  }
  
  // =============================================
  // TOGGLE EXPANDIR/CONTRAER LOGROS
  // =============================================
  function toggleLogros() {
    const achievementsContainer = document.querySelector('.achievements-grid');
    const btnVerTodos = achievementsContainer.closest('.card').querySelector('.card-action');
    
    if (!logrosExpandidos) {
      // EXPANDIR - Mostrar todos los logros
      mostrarTodosLosLogros();
      btnVerTodos.textContent = 'Ver Menos';
      logrosExpandidos = true;
    } else {
      // CONTRAER - Mostrar solo 4 logros
      mostrarLogrosLimitados();
      btnVerTodos.textContent = 'Ver Todos';
      logrosExpandidos = false;
    }
  }
  
  // =============================================
  // MOSTRAR TODOS LOS LOGROS
  // =============================================
  function mostrarTodosLosLogros() {
    const achievementsContainer = document.querySelector('.achievements-grid');
    if (!achievementsContainer || todosLosLogros.length === 0) return;
    
    achievementsContainer.innerHTML = todosLosLogros.map(logro => {
      const clases = logro.unlocked ? 'achievement' : 'achievement locked';
      const fechaHTML = logro.unlocked && logro.unlockedAt 
        ? `<div style="font-size: 10px; color: #707070; margin-top: 4px;">${formatearFecha(logro.unlockedAt)}</div>`
        : '';
      
      return `
        <div class="${clases}">
          <div class="achievement-icon">${logro.icon}</div>
          <div class="achievement-name">${logro.nombre}</div>
          ${fechaHTML}
        </div>
      `;
    }).join('');
    
    console.log(`📊 Mostrando todos los logros: ${todosLosLogros.length}`);
  }
  
  // =============================================
  // MOSTRAR LOGROS LIMITADOS (4)
  // =============================================
  function mostrarLogrosLimitados() {
    const achievementsContainer = document.querySelector('.achievements-grid');
    if (!achievementsContainer || todosLosLogros.length === 0) return;
    
    const logrosLimitados = todosLosLogros.slice(0, 4);
    
    achievementsContainer.innerHTML = logrosLimitados.map(logro => {
      const clases = logro.unlocked ? 'achievement' : 'achievement locked';
      
      return `
        <div class="${clases}">
          <div class="achievement-icon">${logro.icon}</div>
          <div class="achievement-name">${logro.nombre}</div>
        </div>
      `;
    }).join('');
    
    console.log(`📊 Mostrando logros limitados: 4`);
  }
  
  // =============================================
  // INICIALIZAR TODAS LAS FUNCIONALIDADES
  // =============================================
  async function inicializarEstadisticas() {
    const userId = localStorage.getItem("userId");
    
    try {
      // Cargar estadísticas desde backend
      const response = await fetch(`${CONFIG.API_URL}/api/estadisticas/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const statsData = {
          workouts: data.data.workoutHistory || [],
          currentStreak: data.data.currentStreak || 0,
          achievements: []
        };
        
        // Actualizar las 3 secciones
        actualizarActividadReciente(statsData.workouts);
        actualizarRacha(statsData.currentStreak, statsData.workouts);
        await actualizarLogros(userId);
        
        console.log('✅ Estadísticas cargadas correctamente');
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    }
  }
  
  // =============================================
  // 1. ACTUALIZAR ACTIVIDAD RECIENTE
  // =============================================
  function actualizarActividadReciente(workouts) {
    // Buscar el contenedor de actividad
    const activityContainer = document.querySelector('.activity-list');
    if (!activityContainer) {
      console.warn('⚠️ No se encontró .activity-list');
      return;
    }
    
    if (!workouts || workouts.length === 0) {
      activityContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #707070;">
          <i class="fas fa-clipboard-list" style="font-size: 48px; opacity: 0.3;"></i>
          <p style="margin-top: 10px;">No hay actividad reciente</p>
        </div>
      `;
      return;
    }
    
    // Obtener los 3 últimos entrenamientos
    const recent = workouts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
    
    // Generar HTML
    activityContainer.innerHTML = recent.map(workout => {
      const timeAgo = calcularTiempoTranscurrido(new Date(workout.date));
      
      return `
        <div class="activity-item">
          <div class="activity-icon">🏋️</div>
          <div class="activity-info">
            <div class="activity-title">${workout.nombre || 'Entrenamiento'}</div>
            <div class="activity-date">${timeAgo}</div>
          </div>
          <span class="activity-badge">${workout.duracionTotal || 45} min</span>
        </div>
      `;
    }).join('');
    
    console.log(`✅ Actividad reciente actualizada: ${recent.length} entrenamientos`);
  }
  
  // =============================================
  // 2. ACTUALIZAR RACHA
  // =============================================
  function actualizarRacha(racha, workouts) {
    // Actualizar el valor de la racha
    const streakValue = document.getElementById('streakCount');
    if (streakValue) {
      streakValue.textContent = racha || 0;
    }
    
    // Actualizar los días de la semana
    const streakDaysContainer = document.querySelector('.streak-days');
    if (!streakDaysContainer) {
      console.warn('⚠️ No se encontró .streak-days');
      return;
    }
    
    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const hoy = new Date();
    let html = '';
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      
      // Verificar si hay entrenamiento ese día
      const tieneEntrenamiento = workouts.some(w => {
        const fechaEntrenamiento = new Date(w.date);
        return fechaEntrenamiento.toDateString() === fecha.toDateString();
      });
      
      const esHoy = i === 0;
      const clases = tieneEntrenamiento ? 'streak-day completed' : 'streak-day';
      const claseFinal = esHoy ? clases + ' today' : clases;
      
      const diaIndex = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
      html += `<div class="${claseFinal}">${dias[diaIndex]}</div>`;
    }
    
    streakDaysContainer.innerHTML = html;
    console.log(`✅ Racha actualizada: ${racha} días`);
  }
  
  // =============================================
  // 3. ACTUALIZAR LOGROS
  // =============================================
  async function actualizarLogros(userId) {
    const achievementsContainer = document.querySelector('.achievements-grid');
    if (!achievementsContainer) {
      console.warn('⚠️ No se encontró .achievements-grid');
      return;
    }
    
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/logros/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data.achievements) {
        // Guardar TODOS los logros
        todosLosLogros = data.data.achievements;
        
        // Mostrar solo los primeros 4 logros inicialmente
        mostrarLogrosLimitados();
        
        console.log(`✅ Logros cargados: ${data.data.totalUnlocked}/${data.data.totalPossible}`);
      }
    } catch (error) {
      console.error('❌ Error cargando logros:', error);
    }
  }
  
  // =============================================
  // FUNCIÓN AUXILIAR: CALCULAR TIEMPO TRANSCURRIDO
  // =============================================
  function calcularTiempoTranscurrido(fecha) {
    const ahora = new Date();
    const diff = ahora - fecha;
    const minutos = Math.floor(diff / (1000 * 60));
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
  
  // =============================================
  // FUNCIÓN AUXILIAR: FORMATEAR FECHA
  // =============================================
  function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  }
  
})();