// =============================================
// ENTRENADOR IA - FITAIID (ACTUALIZADO)
// Con sincronización completa al backend
// =============================================

// Verificar autenticación
const token = localStorage.getItem("token") || localStorage.getItem("authToken");
const userId = localStorage.getItem("userId");

if (!token || !userId) {
  console.log("❌ No autenticado, redirigiendo a login...");
  window.location.replace("login.html");
}

// Variables globales
let rutinaActual = null;
let diaSeleccionado = 0;
let userProfile = null;

// =============================================
// CARGAR PERFIL DEL USUARIO
// =============================================
async function cargarPerfil() {
  try {
    const fitnessProfile = localStorage.getItem('fitnessProfile');
    const userString = localStorage.getItem('user');

    if (fitnessProfile) {
      userProfile = JSON.parse(fitnessProfile);
    }

    if (userString) {
      const user = JSON.parse(userString);
      document.getElementById('rutinaUserName').textContent = user.firstName || 'ti';
    }

    if (!userProfile && userId && userId !== 'anonymous') {
      try {
        const response = await fetch(`${CONFIG.API_URL}/api/questionnaire/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success && data.data && data.data.fitnessProfile) {
          userProfile = data.data.fitnessProfile;
        }
      } catch (backendError) {
        console.log('⚠️ No se pudo cargar desde backend');
      }
    }

    if (!userProfile) {
      userProfile = {
        mainGoal: 'tonificar',
        fitnessLevel: 'principiante',
        trainingDaysPerWeek: 3,
        trainingLocation: 'casa',
        sessionDuration: '45 min'
      };
    }

    actualizarUIConPerfil();

  } catch (error) {
    console.error('❌ Error cargando perfil:', error);
  }
}

function actualizarUIConPerfil() {
  if (!userProfile) return;

  const goalMap = {
    'tonificar': 'Tonificar cuerpo',
    'ganar masa muscular': 'Ganar masa muscular',
    'bajar de peso': 'Bajar de peso'
  };

  const levelMap = {
    'principiante': 'Nivel Principiante',
    'intermedio': 'Nivel Intermedio',
    'avanzado': 'Nivel Avanzado'
  };

  const locationMap = {
    'casa': 'Entrena en Casa',
    'gym': 'Entrena en Gym'
  };

  document.getElementById('userGoal').textContent = goalMap[userProfile.mainGoal] || userProfile.mainGoal;
  document.getElementById('userLevel').textContent = levelMap[userProfile.fitnessLevel] || userProfile.fitnessLevel;
  document.getElementById('userDays').textContent = `${userProfile.trainingDaysPerWeek} días/semana`;
  document.getElementById('userLocation').textContent = locationMap[userProfile.trainingLocation] || userProfile.trainingLocation;
}

// =============================================
// GENERAR RUTINA CON IA
// =============================================
async function generarRutina() {
  const btnGenerate = document.getElementById('btnGenerate');
  const loadingOverlay = document.getElementById('loadingOverlay');

  btnGenerate.disabled = true;
  loadingOverlay.classList.add('active');

  animarPasosCarga();

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/generar-rutina`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        profile: userProfile
      })
    });

    const data = await response.json();

    if (data.success) {
      rutinaActual = data.rutina;

      console.log('✅ Rutina generada:', rutinaActual);

      // Guardar en localStorage
      localStorage.setItem('rutinaActual', JSON.stringify(rutinaActual));

      // Mostrar la rutina
      mostrarRutina();

      // ⭐ MOSTRAR MODAL EXPLICATIVO
      setTimeout(() => {
        mostrarModalExplicacion();
      }, 500);

      document.getElementById('fittyMessage').textContent =
        '¡Excelente! He creado tu rutina personalizada basada en tu perfil. ' +
        'Recuerda que la consistencia es clave. ¡Vamos a por ello! 💪🔥';

    } else {
      throw new Error(data.message || 'Error al generar rutina');
    }

  } catch (error) {
    console.error('❌ Error generando rutina:', error);
    alert('Hubo un error generando tu rutina. Por favor intenta de nuevo.');
  } finally {
    btnGenerate.disabled = false;
    loadingOverlay.classList.remove('active');
    resetearPasosCarga();
  }
}

function animarPasosCarga() {
  const steps = ['step1', 'step2', 'step3', 'step4'];
  const messages = [
    'Analizando tu perfil fitness...',
    'Diseñando ejercicios personalizados...',
    'Organizando tu semana de entrenamiento...',
    '¡Tu rutina está lista!'
  ];

  let currentStep = 0;

  const interval = setInterval(() => {
    if (currentStep > 0) {
      document.getElementById(steps[currentStep - 1]).classList.remove('active');
      document.getElementById(steps[currentStep - 1]).classList.add('completed');
    }

    if (currentStep < steps.length) {
      document.getElementById(steps[currentStep]).classList.add('active');
      document.getElementById('loadingMessage').textContent = messages[currentStep];
      currentStep++;
    } else {
      clearInterval(interval);
    }
  }, 1500);
}

function resetearPasosCarga() {
  ['step1', 'step2', 'step3', 'step4'].forEach(step => {
    document.getElementById(step).classList.remove('active', 'completed');
  });
  document.getElementById('step1').classList.add('active');
  document.getElementById('loadingMessage').textContent = 'Fitty está analizando tu perfil fitness';
}

// =============================================
// MOSTRAR RUTINA
// =============================================
function mostrarRutina() {
  if (!rutinaActual) return;

  const rutinaSection = document.getElementById('rutinaSection');
  rutinaSection.classList.add('active');

  setTimeout(() => {
    rutinaSection.scrollIntoView({ behavior: 'smooth' });
  }, 300);

  generarTabsDias();
  mostrarDia(0);
  actualizarResumenSemanal();
}

function generarTabsDias() {
  const tabsContainer = document.getElementById('daysTabs');
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  tabsContainer.innerHTML = '';

  rutinaActual.dias.forEach((dia, index) => {
    const tab = document.createElement('div');
    tab.className = `day-tab ${index === 0 ? 'active' : ''} ${dia.esDescanso ? 'rest' : ''} ${dia.completado ? 'completed disabled' : ''}`;
    tab.onclick = dia.completado ? null : () => seleccionarDia(index);
    tab.innerHTML = `
      <span class="day-name">${diasSemana[index]}</span>
      <span class="day-type">${dia.esDescanso ? 'Descanso' : dia.enfoque}</span>
    `;

    tabsContainer.appendChild(tab);
  });
}

function seleccionarDia(index) {
  diaSeleccionado = index;

  document.querySelectorAll('.day-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });

  mostrarDia(index);
}

function mostrarDia(index) {
  const dayContent = document.getElementById('dayContent');
  const dia = rutinaActual.dias[index];
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  if (dia.esDescanso) {
    dayContent.innerHTML = `
      <div class="rest-day">
        <i class="fas fa-spa"></i>
        <h3>Día de Descanso</h3>
        <p>${dia.mensaje || 'Tu cuerpo necesita recuperarse. Descansa, hidrátate y prepárate para el próximo entrenamiento.'}</p>
      </div>
    `;
    return;
  }
  const diaCompletado = dia.completado;
  const ejerciciosHTML = dia.ejercicios.map((ejercicio, i) => `
    <div class="exercise-item ${ejercicio.completado ? 'completed' : ''}" id="exercise-${index}-${i}">
      <div class="exercise-number">${i + 1}</div>
      <div class="exercise-info">
        <h4>${ejercicio.nombre}</h4>
        <p>${ejercicio.descripcion || ''}</p>
        <div class="exercise-details">
          <span class="exercise-detail">
            <i class="fas fa-repeat"></i> ${ejercicio.series} series
          </span>
          <span class="exercise-detail">
            <i class="fas fa-hashtag"></i> ${ejercicio.repeticiones}
          </span>
          <span class="exercise-detail">
            <i class="fas fa-clock"></i> ${ejercicio.descanso} desc.
          </span>
        </div>
      </div>
      <div class="exercise-actions">
<button class="exercise-btn complete" 
  onclick="${diaCompletado ? '' : `completarEjercicio(${index}, ${i})`}"
  ${diaCompletado ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}
  title="${diaCompletado ? 'Día ya completado ✓' : 'Marcar como completado'}">
          <i class="fas fa-check"></i>
        </button>
        <button class="exercise-btn info" onclick="mostrarInfoEjercicio('${ejercicio.nombre}')" title="Más información">
          <i class="fas fa-info"></i>
        </button>
      </div>
    </div>
  `).join('');

  dayContent.innerHTML = `
    <div class="day-header">
      <div class="day-info">
        <h3>${diasSemana[index]} - ${dia.enfoque}</h3>
        <p>${dia.descripcion || 'Entrenamiento personalizado para ti'}</p>
      </div>
      <div class="day-stats">
        <div class="day-stat">
          <div class="day-stat-value">${dia.duracionTotal || '45'}</div>
          <div class="day-stat-label">Minutos</div>
        </div>
        <div class="day-stat">
          <div class="day-stat-value">${dia.caloriasEstimadas || '300'}</div>
          <div class="day-stat-label">Calorías</div>
        </div>
        <div class="day-stat">
          <div class="day-stat-value">${dia.ejercicios.length}</div>
          <div class="day-stat-label">Ejercicios</div>
        </div>
      </div>
    </div>
    <div class="exercise-list">
      ${ejerciciosHTML}
    </div>
    ${diaCompletado ? `
  <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; 
    padding: 15px 20px; border-radius: 10px; margin-bottom: 15px; 
    display: flex; align-items: center; gap: 10px;">
    <i class="fas fa-check-circle" style="font-size: 20px;"></i>
    <strong>¡Día completado! Vuelve mañana para continuar tu rutina.</strong>
  </div>` : ''}
  `;
}

function completarEjercicio(diaIndex, ejercicioIndex) {
  const exerciseItem = document.getElementById(`exercise-${diaIndex}-${ejercicioIndex}`);
  exerciseItem.classList.toggle('completed');

  // Actualizar en la rutina
  if (!rutinaActual.dias[diaIndex].ejercicios[ejercicioIndex].completado) {
    rutinaActual.dias[diaIndex].ejercicios[ejercicioIndex].completado = true;
  } else {
    rutinaActual.dias[diaIndex].ejercicios[ejercicioIndex].completado = false;
  }

  // Guardar en localStorage
  localStorage.setItem('rutinaActual', JSON.stringify(rutinaActual));

  // Verificar si el día se completó
  verificarDiaCompletado(diaIndex);
}

// =============================================
// ⭐ VERIFICAR DIA COMPLETADO Y REGISTRAR
// =============================================
async function verificarDiaCompletado(diaIndex) {
  const dia = rutinaActual.dias[diaIndex];

  if (dia.esDescanso) return;

  // Verificar si todos los ejercicios están completados
  const todosCompletados = dia.ejercicios.every(e => e.completado);

  if (todosCompletados && !dia.registrado) {
    // Marcar día como registrado para evitar duplicados
    dia.registrado = true;
    localStorage.setItem('rutinaActual', JSON.stringify(rutinaActual));

    // Preparar datos del entrenamiento
    const workoutData = {
      nombre: dia.nombre || `Día ${diaIndex + 1}`,
      enfoque: dia.enfoque,
      duracionTotal: dia.duracionTotal || 45,
      caloriasEstimadas: dia.caloriasEstimadas || 300,
      ejercicios: dia.ejercicios.map(e => ({
        nombre: e.nombre,
        series: e.series,
        repeticiones: e.repeticiones,
        completado: e.completado
      }))
    };

    // 🚀 REGISTRAR EN EL BACKEND
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/entrenamientos/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          workoutData: {
            ...workoutData,
            diaIndex: diaIndex
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Entrenamiento guardado en backend');

        //cargar rutina desde backend para actualizar estados completados
        const rutinaResponse = await fetch(`${CONFIG.API_URL}/api/obtener-rutina/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const rutinaData = await rutinaResponse.json();
        if (rutinaData.success && rutinaData.rutina) {
          rutinaActual = rutinaData.rutina;
          localStorage.setItem('rutinaActual', JSON.stringify(rutinaActual));
          generarTabsDias(); // Re-renderizar tabs con estados actualizados
          mostrarDia(data.cicloReiniciado ? 0 : diaIndex);
        }
        if (data.cicloReiniciado) {
          mostrarNotificacionCicloCompletado();
          return;
        }
        // Mostrar notificación de éxito
        mostrarNotificacionExito(dia.nombre, data.data.achievementsUnlocked);

        // Si hay logros nuevos, mostrarlos
        if (data.data.achievementsUnlocked && data.data.achievementsUnlocked.length > 0) {
          data.data.achievementsUnlocked.forEach(achievement => {
            mostrarNotificacionLogro(achievement.nombre);
          });
        }
      } else {
        console.error('❌ Error guardando entrenamiento:', data.message);
        mostrarNotificacionError('No se pudo sincronizar el entrenamiento');
      }

    } catch (error) {
      console.error('❌ Error de red:', error);
      mostrarNotificacionError('Error de conexión. El entrenamiento se guardó localmente.');
    }
  }
}

function mostrarNotificacionExito(diaNombre, achievements) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 100px;
    right: 30px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.5s ease;
    max-width: 350px;
  `;

  let achievementText = '';
  if (achievements && achievements.length > 0) {
    achievementText = `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);">
      <div style="font-size: 12px; opacity: 0.9;">🏆 ¡Logro desbloqueado!</div>
    </div>`;
  }

  notif.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
      <i class="fas fa-check-circle" style="font-size: 24px;"></i>
      <div>
        <div style="font-weight: 700; font-size: 16px;">¡Día Completado! 🎉</div>
        <div style="font-size: 14px; opacity: 0.9;">${diaNombre} - ¡Excelente trabajo!</div>
        ${achievementText}
      </div>
    </div>
  `;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => notif.remove(), 500);
  }, 4000);
}

function mostrarNotificacionLogro(nombre) {
  setTimeout(() => {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 20px 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.5s ease;
    `;

    notif.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <i class="fas fa-trophy" style="font-size: 24px;"></i>
        <div>
          <div style="font-weight: 700; font-size: 16px;">¡Logro Desbloqueado! 🏆</div>
          <div style="font-size: 14px; opacity: 0.9;">${nombre}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.animation = 'slideOut 0.5s ease';
      setTimeout(() => notif.remove(), 500);
    }, 3000);
  }, 1000);
}

function mostrarNotificacionError(mensaje) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 100px;
    right: 30px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.5s ease;
  `;

  notif.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
      <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
      <div>
        <div style="font-weight: 700; font-size: 16px;">Aviso</div>
        <div style="font-size: 14px; opacity: 0.9;">${mensaje}</div>
      </div>
    </div>
  `;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => notif.remove(), 500);
  }, 3000);
}

function mostrarInfoEjercicio(nombreEjercicio) {
  toggleChat();
  const chatInput = document.getElementById('chatInput');
  chatInput.value = `¿Cómo hago correctamente el ejercicio "${nombreEjercicio}"?`;
  sendChatMessage();
}

function actualizarResumenSemanal() {
  if (!rutinaActual) return;

  let totalMinutos = 0;
  let totalCalorias = 0;
  let totalEjercicios = 0;
  let diasEntrenamiento = 0;

  rutinaActual.dias.forEach(dia => {
    if (!dia.esDescanso) {
      totalMinutos += parseInt(dia.duracionTotal) || 45;
      totalCalorias += parseInt(dia.caloriasEstimadas) || 300;
      totalEjercicios += dia.ejercicios.length;
      diasEntrenamiento++;
    }
  });

  document.getElementById('totalMinutes').textContent = totalMinutos;
  document.getElementById('totalCalories').textContent = totalCalorias;
  document.getElementById('totalExercises').textContent = totalEjercicios;
  document.getElementById('totalDays').textContent = diasEntrenamiento;
}

// =============================================
// ✅ VERSIÓN NUEVA - GUARDA EN MONGODB
// =============================================
async function guardarRutina() {
  if (!rutinaActual) {
    alert('❌ Primero genera una rutina');
    return;
  }

  if (!userId) {
    alert('❌ No se pudo identificar el usuario');
    return;
  }

  try {
    console.log('💾 Guardando rutina en MongoDB...');
    console.log('📤 Datos a enviar:', {
      userId: userId,
      rutina: rutinaActual
    });

    // ✅ SOLUCIÓN: Enviar al backend
    const response = await fetch(`${CONFIG.API_URL}/api/guardar-rutina`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        rutina: rutinaActual
      })
    });

    console.log('📥 Respuesta del servidor:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta exitosa:', data);

    if (data.success) {
      console.log('✅✅✅ RUTINA GUARDADA EXITOSAMENTE EN MONGODB ✅✅✅');

      // Guardar también en localStorage como respaldo
      localStorage.setItem('rutinaGuardada', JSON.stringify(rutinaActual));

      // Mostrar notificación de éxito
      mostrarNotificacionGuardado('¡Rutina guardada exitosamente en MongoDB!', 'success');

      // Cambiar el botón de guardar
      const btnGuardar = document.querySelector('.btn-secondary');
      if (btnGuardar && btnGuardar.textContent.includes('Guardar')) {
        btnGuardar.innerHTML = '<i class="fas fa-check-circle"></i> Guardada';
        btnGuardar.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        btnGuardar.style.pointerEvents = 'none';
        btnGuardar.style.opacity = '0.8';
      }

    } else {
      throw new Error(data.message || 'Error desconocido al guardar');
    }

  } catch (error) {
    console.error('❌ ERROR GUARDANDO EN MONGODB:', error);
    console.error('Detalles del error:', error.message);

    // Guardar localmente como fallback
    localStorage.setItem('rutinaGuardada', JSON.stringify(rutinaActual));

    mostrarNotificacionGuardado(
      'Error al guardar en servidor. Guardado localmente como respaldo.',
      'warning'
    );

    alert(`❌ Error: ${error.message}\n\nLa rutina se guardó localmente como respaldo.`);
  }
}

// =============================================
// CHAT, LOGOUT Y TIPS (mantener igual)
// =============================================

let chatOpen = false;

function toggleChat() {
  chatOpen = !chatOpen;
  const chatWindow = document.getElementById('chatWindow');
  const chatBadge = document.querySelector('.chat-badge');

  chatWindow.classList.toggle('active', chatOpen);

  if (chatOpen) {
    chatBadge.style.display = 'none';
    document.getElementById('chatInput').focus();
  }
}

function handleChatKeypress(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  agregarMensajeChat(message, 'user');
  input.value = '';

  const typingId = mostrarEscribiendo();

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message,
        userId: userId,
        contexto: rutinaActual ? 'El usuario tiene una rutina generada' : 'Sin rutina generada'
      })
    });

    const data = await response.json();

    removerEscribiendo(typingId);

    if (data.reply) {
      agregarMensajeChat(data.reply, 'bot');
    } else {
      agregarMensajeChat('Lo siento, hubo un error. Por favor intenta de nuevo.', 'bot');
    }

  } catch (error) {
    console.error('Error en chat:', error);
    removerEscribiendo(typingId);
    agregarMensajeChat('Error de conexión. Verifica tu internet e intenta de nuevo.', 'bot');
  }
}

function agregarMensajeChat(texto, tipo) {
  const chatMessages = document.getElementById('chatMessages');

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${tipo}`;

  // Formatear solo mensajes del bot
  const contenido = tipo === 'bot' ? formatearRespuestaChat(texto) : texto;
  messageDiv.innerHTML = `<div class="message-content">${contenido}</div>`;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Formatear respuesta del bot con markdown a HTML estructurado
function formatearRespuestaChat(texto) {
  let formatted = texto;

  // 1. Convertir **texto** a <strong>texto</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 2. Separar por líneas
  const lines = formatted.split('\n');
  let html = '';
  let inOl = false;
  let inUl = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      // Cerrar listas abiertas en líneas vacías
      if (inOl) { html += '</ol>'; inOl = false; }
      if (inUl) { html += '</ul>'; inUl = false; }
      html += '<br>';
      continue;
    }

    // Detectar listas numeradas: "1. ", "2. ", etc.
    const numberedMatch = line.match(/^(\d+)[\.\)\-]\s+(.*)/);
    if (numberedMatch) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${numberedMatch[2]}</li>`;
      continue;
    }

    // Detectar listas con bullets: "- ", "• ", "✅ ", "⚠️ ", etc.
    const bulletMatch = line.match(/^[-•●]\s+(.*)/);
    const emojiListMatch = line.match(/^(✅|⚠️|💪|🔥|✔️|➡️|❌|🏋️|🦵|🧘|👟|⛰️|🔸|🔹|▪️)\s*(.*)/);
    if (bulletMatch || emojiListMatch) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul class="chat-formatted-list">'; inUl = true; }
      const content = bulletMatch ? bulletMatch[1] : (emojiListMatch[1] + ' ' + emojiListMatch[2]);
      html += `<li>${content}</li>`;
      continue;
    }

    // Cerrar listas abiertas si no estamos en una línea de lista
    if (inOl) { html += '</ol>'; inOl = false; }
    if (inUl) { html += '</ul>'; inUl = false; }

    // Línea normal
    html += `<p>${line}</p>`;
  }

  // Cerrar listas si quedaron abiertas
  if (inOl) html += '</ol>';
  if (inUl) html += '</ul>';

  return html;
}

function mostrarEscribiendo() {
  const chatMessages = document.getElementById('chatMessages');
  const id = 'typing-' + Date.now();

  const typingDiv = document.createElement('div');
  typingDiv.id = id;
  typingDiv.className = 'message bot';
  typingDiv.innerHTML = `
    <div class="message-content">
      <i class="fas fa-circle-notch fa-spin"></i> Fitty está escribiendo...
    </div>
  `;

  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return id;
}

function removerEscribiendo(id) {
  const typingDiv = document.getElementById(id);
  if (typingDiv) {
    typingDiv.remove();
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
  localStorage.removeItem("fitnessProfile");
  localStorage.removeItem("rutinaActual");

  window.location.href = "login.html";
}

const dailyTips = [
  "La consistencia supera a la intensidad. Es mejor entrenar 30 minutos todos los días que 2 horas una vez a la semana.",
  "Hidrátate bien antes, durante y después del entrenamiento. Tu rendimiento depende de ello.",
  "El descanso es parte del entrenamiento. Tus músculos crecen mientras descansas.",
  "Calienta siempre antes de entrenar para evitar lesiones y mejorar tu rendimiento.",
  "La técnica correcta es más importante que el peso. Domina el movimiento primero."
];

function cargarTipDelDia() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  document.getElementById('dailyTip').textContent = dailyTips[dayOfYear % dailyTips.length];
}

// =============================================
// CARGAR RUTINA GUARDADA DESDE BACKEND
// =============================================
async function cargarRutinaGuardada() {
  if (!userId) {
    console.log('No hay usuario logueado');
    return;
  }

  try {
    console.log('🔍 Cargando rutina guardada para usuario:', userId);

    const response = await fetch(`${CONFIG.API_URL}/api/obtener-rutina/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('ℹ️ Usuario no tiene rutina guardada aún');
        return;
      }
      throw new Error('Error al cargar rutina');
    }

    const data = await response.json();
    console.log('✅ Rutina recibida del backend:', data);

    if (data.success && data.rutina) {
      // Guardar la rutina en la variable global
      rutinaActual = data.rutina;

      // También guardar en localStorage como respaldo
      localStorage.setItem('rutinaActual', JSON.stringify(rutinaActual));

      // Mostrar la sección de rutina
      document.getElementById('rutinaSection').style.display = 'block';

      // Renderizar la rutina
      mostrarRutina();

      // Actualizar mensaje de Fitty
      document.getElementById('fittyMessage').textContent =
        '¡Bienvenido de vuelta! Tu rutina sigue aquí. ¿Listo para entrenar hoy? 💪';

      // Cambiar texto del botón
      document.getElementById('btnGenerate').innerHTML =
        '<i class="fas fa-sync-alt"></i> Regenerar Mi Rutina';

      console.log('✅ Rutina cargada y mostrada exitosamente');
    }
  } catch (error) {
    console.error('❌ Error al cargar rutina guardada:', error);

    // Intentar cargar desde localStorage como respaldo
    const rutinaLocal = localStorage.getItem('rutinaActual');
    if (rutinaLocal) {
      try {
        rutinaActual = JSON.parse(rutinaLocal);
        mostrarRutina();
        console.log('ℹ️ Rutina cargada desde localStorage');
      } catch (e) {
        console.log('❌ No se pudo cargar rutina desde localStorage');
      }
    }
  }
}

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🏋️ Entrenador IA inicializado');
  cargarPerfil();
  cargarTipDelDia();

  // ⭐ CARGAR RUTINA DESDE BACKEND
  await cargarRutinaGuardada();
});

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
  @keyframes slideInRight {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// =============================================
// FUNCIONES DEL MODAL INFORMATIVO
// =============================================

function mostrarModalExplicacion() {
  const modal = document.getElementById('modalExplicacion');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModal() {
  const modal = document.getElementById('modalExplicacion');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

async function cerrarModalYGuardar() {
  cerrarModal();

  if (!rutinaActual) {
    console.log('⚠️ No hay rutina para guardar');
    return;
  }

  try {
    console.log('💾 Guardando rutina desde el modal...');

    const response = await fetch(`${CONFIG.API_URL}/api/guardar-rutina`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        rutina: rutinaActual
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Rutina guardada exitosamente en MongoDB');
      mostrarNotificacionGuardado('Rutina guardada exitosamente', 'success');

      // Cambiar botón de guardar
      const btnGuardar = document.querySelector('.btn-secondary');
      if (btnGuardar && btnGuardar.textContent.includes('Guardar')) {
        btnGuardar.innerHTML = '<i class="fas fa-check"></i> Guardada';
        btnGuardar.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        btnGuardar.style.color = 'white';
      }
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Error guardando rutina:', error);
    localStorage.setItem('rutinaGuardada', JSON.stringify(rutinaActual));
    mostrarNotificacionGuardado('Rutina guardada localmente', 'warning');
  }
}

function mostrarNotificacionGuardado(mensaje, tipo = 'success') {
  const notif = document.createElement('div');

  const colores = {
    success: 'linear-gradient(135deg, #22c55e, #16a34a)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)'
  };

  const iconos = {
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle'
  };

  notif.style.cssText = `
    position: fixed;
    top: 100px;
    right: 30px;
    background: ${colores[tipo]};
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10001;
    animation: slideInRight 0.5s ease;
    max-width: 350px;
    display: flex;
    align-items: center;
    gap: 15px;
  `;

  notif.innerHTML = `
    <i class="fas ${iconos[tipo]}" style="font-size: 24px;"></i>
    <div>
      <div style="font-weight: 700; font-size: 16px;">${mensaje}</div>
      <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
        ${tipo === 'success' ? 'Puedes verla cada vez que inicies sesión' : 'Intenta guardar nuevamente'}
      </div>
    </div>
  `;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = 'slideOutRight 0.5s ease';
    setTimeout(() => notif.remove(), 500);
  }, 4000);
}

// Event listeners para el modal
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalExplicacion');

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        cerrarModal();
      }
    });
  }

});
function mostrarNotificacionCicloCompletado() {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 100px; right: 30px;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white; padding: 20px 30px; border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    z-index: 10000; animation: slideIn 0.5s ease; max-width: 380px;
  `;
  notif.innerHTML = `
    <div style="display:flex;align-items:center;gap:15px;">
      <i class="fas fa-rotate" style="font-size:28px;"></i>
      <div>
        <div style="font-weight:700;font-size:17px;">¡Semana Completada! 🏆</div>
        <div style="font-size:14px;opacity:0.9;margin-top:4px;">
          ¡Completaste toda la semana! Tu rutina se reinició desde el Lunes. 💪
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = 'slideOutRight 0.5s ease';
    setTimeout(() => notif.remove(), 500);
  }, 5000);
}