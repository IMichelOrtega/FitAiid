console.log('🔔 notifications.js cargado');

// ========== REGISTRO INMEDIATO DEL SERVICE WORKER ==========
// Registrar el SW apenas carga la página para evitar delays después
async function initializeServiceWorker() {
  console.log('📝 Inicializando Service Worker...');
  
  if ('serviceWorker' in navigator) {
    try {
      // ✅ RUTA PARA LIVE SERVER: ../service-worker.js
      // Funciona desde /pages/home.html (sube 1 nivel) y desde /index.html (sube 0, pero ./ seguido de ./)
      const swPath = '../service-worker.js';
      console.log('📝 Ruta del SW:', swPath);
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '../'
      });
      console.log('✅ Service Worker registrado exitosamente:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      console.error('💡 Verifica que /service-worker.js exista en la raíz del frontend');
      return null;
    }
  } else {
    console.warn('⚠️ Service Worker no soportado en este navegador');
    return null;
  }
}

// Registrar el SW cuando el script carga (no esperar a que usuario haga click)
let swRegistration = null;
initializeServiceWorker().then(reg => {
  swRegistration = reg;
});

// ========== CONTROL DE RATE LIMITING EN CLIENTE ==========
// Prevenir múltiples peticiones al servidor en poco tiempo
let lastNotificationCheckTime = 0;
const NOTIFICATION_CHECK_INTERVAL = 30000; // 30 segundos mínimo entre peticiones

function canCheckNotifications() {
  const now = Date.now();
  if (now - lastNotificationCheckTime > NOTIFICATION_CHECK_INTERVAL) {
    lastNotificationCheckTime = now;
    return true;
  }
  console.log('⏳ Esperando antes de verificar notificaciones nuevamente...');
  return false;
}

// ========== UTILIDADES PUSH NOTIFICATIONS ==========
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorker() {
  console.log('📝 Intentando registrar Service Worker...');
  if ('serviceWorker' in navigator) {
    try {
      // ✅ RUTA PARA LIVE SERVER: ../service-worker.js
      const swPath = '../service-worker.js';
      console.log('📂 Ruta del Service Worker:', swPath);

      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '../'
      });
      console.log('✅ Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      console.error('💡 Verifica que service-worker.js exista en /frontend/');
      throw error;
    }
  }
  throw new Error('Service Worker no soportado en este navegador');
}

async function enablePushNotifications() {
  try {
    console.log('🔔 Iniciando proceso de suscripción...');

    // Paso 1: Usar Service Worker registrado al cargar la página
    let registration = swRegistration;
    if (!registration) {
      console.log('⏳ SW no inicializado aún, registrando ahora...');
      registration = await initializeServiceWorker();
      swRegistration = registration;
    }
    
    if (!registration) {
      throw new Error('No se pudo registrar el Service Worker');
    }
    console.log('✅ Paso 1 completado: Service Worker disponible');

    // Paso 2: Pedir permisos
    console.log('⏳ Solicitando permisos de notificación...');
    const permission = await Notification.requestPermission();
    console.log('📋 Permiso obtenido:', permission);

    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado por el usuario');
    }
    console.log('✅ Paso 2 completado: Permisos concedidos');

    // Paso 3: Obtener VAPID public key
    console.log('⏳ Obteniendo VAPID public key del servidor...');
    const response = await fetch(`${CONFIG.API_URL}/api/notifications/vapid-public-key`);

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    const { publicKey } = await response.json();
    console.log('✅ Paso 3 completado: VAPID key obtenida:', publicKey.substring(0, 20) + '...');

    // Paso 4: Crear suscripción
    console.log('⏳ Creando suscripción push...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    console.log('✅ Paso 4 completado: Suscripción creada:', subscription);

    // Paso 5: Guardar suscripción en el servidor
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación');
    }
    if (!userId) {
      console.warn('⚠️ No se encontró userId en localStorage');
    }

    console.log('⏳ Guardando suscripción en el servidor...');
    console.log('📋 Token disponible:', !!token);
    console.log('📋 UserId disponible:', !!userId);

    const saveResponse = await fetch(`${CONFIG.API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        subscription,
        userId: userId  // Agregar userId al body
      })
    });

    if (!saveResponse.ok) {
      throw new Error(`Error al guardar suscripción: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    console.log('📋 Respuesta del servidor:', result);

    if (result.success) {
      console.log('✅ ¡PROCESO COMPLETADO! Notificaciones activadas correctamente');
      return true;
    }

    throw new Error(result.error || 'Error desconocido al guardar suscripción');

  } catch (error) {
    console.error('❌ Error en el proceso de activación:', error);
    console.error('📋 Detalles del error:', error.message);
    alert('Error al activar notificaciones: ' + error.message);
    return false;
  }
}

async function checkPushSubscription(timeoutMs = 10000) {
  console.log('🔍 Verificando si hay suscripción activa...');

  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker no disponible en este navegador');
    return false;
  }

  if (!('PushManager' in window)) {
    console.log('⚠️ PushManager no disponible en este navegador');
    return false;
  }

  try {
    // Usa el SW registrado al cargar la página (evita delay)
    let registration = swRegistration;
    
    if (!registration) {
      console.log(`⏳ SW no inicializado aún, esperando (max ${timeoutMs}ms)...`);
      // Espera con timeout configurable
      const registrationPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout esperando Service Worker')), timeoutMs)
      );

      registration = await Promise.race([registrationPromise, timeoutPromise]);
    }
    
    console.log('📋 Service Worker ready, verificando suscripción...');

    const subscription = await registration.pushManager.getSubscription();
    const isSubscribed = subscription !== null;

    console.log('📋 Estado de suscripción:', isSubscribed ? '✅ SUSCRITO' : '❌ NO SUSCRITO');
    if (subscription) {
      console.log('📋 Endpoint:', subscription.endpoint.substring(0, 50) + '...');
    }

    return isSubscribed;
  } catch (error) {
    console.error('❌ Error verificando suscripción:', error.message);
    return false;
  }
}

// ========== INICIALIZACIÓN DEL BOTÓN DE NOTIFICACIONES ==========
async function initNotifications() {
  console.log('🚀 Inicializando sistema de notificaciones...');

  const bell = document.getElementById('notificationBell');
  const modal = document.getElementById('notificationModal');
  const btnActivar = document.getElementById('btnActivarNotificaciones');
  const btnCancelar = document.getElementById('btnCancelarNotificaciones');

  // Verificar que todos los elementos existen
  if (!bell) {
    console.error('❌ No se encontró el botón #notificationBell');
    return;
  }
  if (!modal) {
    console.error('❌ No se encontró el modal #notificationModal');
    return;
  }
  if (!btnActivar) {
    console.error('❌ No se encontró el botón #btnActivarNotificaciones');
    return;
  }
  if (!btnCancelar) {
    console.error('❌ No se encontró el botón #btnCancelarNotificaciones');
    return;
  }

  console.log('✅ Todos los elementos HTML encontrados correctamente');

  // Verificar estado inicial al cargar (en background sin bloquear)
  function checkNotificationStatus() {
    console.log('🔍 Verificando estado de notificaciones...');

    // ⭐ CONTROL DE RATE LIMITING: No hacer múltiples peticiones en poco tiempo
    if (!canCheckNotifications()) {
      console.log('⏳ Omitiendo verificación por rate limit');
      return;
    }

    // ⭐ VERIFICAR EN BACKGROUND (sin bloquear la carga)
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    if (userId) {
      // Verificar en servidor (en background)
      fetch(`${CONFIG.API_URL}/api/notifications/check-enabled/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.enabled) {
            bell.classList.add('active');
            bell.classList.remove('pending');
            console.log('✅ Usuario YA activó notificaciones (verificado en servidor)');
          }
        })
        .catch(error => {
          console.log('⚠️ Error verificando en servidor, usando verificación local');
          // Fallback: verificar localmente (timeout corto: 2 segundos)
          checkPushSubscription(2000).then(isSubscribed => {
            if (isSubscribed) {
              bell.classList.add('active');
              bell.classList.remove('pending');
              console.log('✅ Usuario tiene suscripción local activa');
            } else {
              bell.classList.add('pending');
              bell.classList.remove('active');
              console.log('⏳ Usuario NO tiene notificaciones activadas');
            }
          });
        });
    }
  }

  // Evento: Click en la campana
  bell.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔔 ========== CLICK EN CAMPANA DETECTADO ==========');

    // ⭐ ABRIR MODAL INMEDIATAMENTE (sin esperar al servidor)
    console.log('📂 ========== ABRIENDO MODAL ==========');
    modal.classList.add('active');
    console.log('✅ Modal abierto, clase "active" agregada');

    // ⭐ VERIFICAR EN BACKGROUND (asincrónico, sin bloquear) - SOLO SI PUEDEN
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    if (userId && canCheckNotifications()) {
      // Hacer la verificación en background (respetando rate limit)
      fetch(`${CONFIG.API_URL}/api/notifications/check-enabled/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.enabled) {
            console.log('✅ Usuario ya activó notificaciones (verificado en servidor)');
            modal.classList.remove('active');
            alert('Ya tienes las notificaciones activadas ✅');
          }
        })
        .catch(error => {
          console.log('⚠️ Error verificando en servidor');
        });
    } else if (userId) {
      console.log('⏳ Omitiendo verificación por rate limit');
    }

    console.log('🔔 ========== FIN PROCESO CLICK ==========');
  });

  // Evento: Activar notificaciones
  btnActivar.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('▶️ Botón ACTIVAR clickeado');

    // Cambiar texto del botón
    const originalText = btnActivar.textContent;
    btnActivar.textContent = '⏳ Activando...';
    btnActivar.disabled = true;

    // Intentar activar notificaciones
    const success = await enablePushNotifications();

    if (success) {
      console.log('🎉 ¡Notificaciones activadas exitosamente!');

      // Actualizar UI
      bell.classList.add('active');
      bell.classList.remove('pending');
      modal.classList.remove('active');

      // Animación visual
      setTimeout(() => {
        bell.style.animation = 'bellRing 0.5s ease';
        setTimeout(() => {
          bell.style.animation = '';
        }, 500);
      }, 100);

      // Restaurar botón
      btnActivar.textContent = originalText;
      btnActivar.disabled = false;

      alert('¡Notificaciones activadas! 🎉');
    } else {
      console.log('❌ Fallo al activar notificaciones');
      btnActivar.textContent = originalText;
      btnActivar.disabled = false;
    }
  });

  // Evento: Cancelar
  btnCancelar.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('❌ Botón CANCELAR clickeado');
    modal.classList.remove('active');
  });

  // Evento: Cerrar modal al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      console.log('❌ Click fuera del modal detectado');
      modal.classList.remove('active');
    }
  });

  // Verificar estado inicial
  await checkNotificationStatus();

  console.log('✅ Sistema de notificaciones inicializado completamente');
}

// ========== INICIALIZACIÓN AUTOMÁTICA ==========
console.log('📋 Estado del documento:', document.readyState);

if (document.readyState === 'loading') {
  console.log('⏳ Esperando a que el DOM esté listo...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM listo, inicializando notificaciones...');
    initNotifications();
  });
} else {
  console.log('✅ DOM ya está listo, inicializando notificaciones inmediatamente...');
  initNotifications();
}