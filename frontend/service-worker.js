// public/service-worker.js
// Service Worker ACTUALIZADO con mejor manejo de notificaciones

self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(clients.claim());
});

// ========================================
// RECIBIR Y MOSTRAR NOTIFICACIONES PUSH
// ========================================

self.addEventListener('push', (event) => {
  console.log('📬 Notificación push recibida');

  let notificationData = {
    title: 'Notificación',
    body: 'Tienes una nueva notificación',
    icon: '/logo192.png',
    badge: '/badge.png'
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.error('Error parseando datos de notificación:', error);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/logo192.png',
    badge: notificationData.badge || '/badge.png',
    tag: notificationData.tag || 'default',
    data: notificationData.data || {},
    actions: notificationData.actions || [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ],
    vibrate: notificationData.vibrate || [200, 100, 200],
    requireInteraction: notificationData.requireInteraction || false,
    image: notificationData.image,
    timestamp: Date.now(),
    renotify: true, // Renotificar si hay una notificación con el mismo tag
    silent: notificationData.silent || false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// ========================================
// MANEJAR CLICS EN NOTIFICACIONES
// ========================================

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Click en notificación:', event.action);

  event.notification.close();

  const notificationData = event.notification.data;
  let urlToOpen = notificationData.url || '/';

  // Manejar acciones específicas según el tipo de notificación
  switch (event.action) {
    case 'ver':
      // Usar URL especificada en la notificación
      break;

    case 'compartir':
      // Abrir página de compartir con datos de la notificación
      const shareData = {
        type: notificationData.type,
        id: notificationData.objetivoId || notificationData.logroId || notificationData.entrenamientoId
      };
      urlToOpen = `/compartir?data=${encodeURIComponent(JSON.stringify(shareData))}`;
      break;

    case 'entrenar':
      // Ir directamente a entrenamientos
      urlToOpen = '/entrenamientos';
      break;

    case 'siguiente':
      // Ver siguiente entrenamiento
      urlToOpen = '/entrenamientos/siguiente';
      break;

    case 'close':
      // Solo cerrar la notificación
      return;

    case 'open':
    default:
      // Usar URL por defecto de la notificación
      break;
  }

  // Abrir o enfocar la ventana de la aplicación
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (let client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Si hay una ventana abierta, navegarla a la URL y enfocarla
            return client.navigate(urlToOpen).then(client => client.focus());
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );

  // Enviar analítica del clic (opcional)
  sendAnalytics('notification-click', {
    type: notificationData.type,
    action: event.action
  });
});

// ========================================
// MANEJAR CIERRE DE NOTIFICACIONES
// ========================================

self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificación cerrada:', event.notification.tag);

  const notificationData = event.notification.data;

  // Enviar analítica del cierre (opcional)
  sendAnalytics('notification-close', {
    type: notificationData.type,
    tag: event.notification.tag
  });
});

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Envía eventos de analítica al servidor
 */
function sendAnalytics(eventType, data) {
  // Obtener la URL base del servidor
  const serverUrl = self.registration.scope.replace(/\/$/, '');
  
  fetch(`${serverUrl}/api/analytics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event: eventType,
      data: data,
      timestamp: Date.now()
    })
  }).catch(err => {
    console.log('No se pudo enviar analítica:', err.message);
  });
}

// ========================================
// SINCRONIZACIÓN EN SEGUNDO PLANO
// ========================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const serverUrl = self.registration.scope.replace(/\/$/, '');
    
    // Sincronizar notificaciones perdidas mientras estaba offline
    const response = await fetch(`${serverUrl}/api/notifications/missed`);
    
    if (!response.ok) {
      console.log('No hay notificaciones perdidas o error en servidor');
      return;
    }
    
    const data = await response.json();

    // Mostrar notificaciones perdidas
    if (data.notifications && data.notifications.length > 0) {
      for (const notification of data.notifications) {
        await self.registration.showNotification(
          notification.title, 
          notification.options
        );
      }
      console.log(`✅ ${data.notifications.length} notificaciones sincronizadas`);
    }
  } catch (error) {
    console.error('Error sincronizando notificaciones:', error);
  }
}

// ========================================
// MANEJO DE MENSAJES DESDE EL CLIENTE
// ========================================

self.addEventListener('message', (event) => {
  console.log('📨 Mensaje recibido del cliente:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '2.0.0' });
  }
});