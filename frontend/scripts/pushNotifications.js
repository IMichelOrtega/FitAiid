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
  if ('serviceWorker' in navigator) {
    // ✅ RUTA PARA LIVE SERVER: ../service-worker.js
    const swPath = '../service-worker.js';
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '../'
    });
    console.log('✅ Service Worker registrado desde ruta absoluta');
    return registration;
  }
  throw new Error('Service Worker no soportado');
}

export async function enablePushNotifications() {
  try {
    console.log('🔔 Iniciando suscripción...');

    const registration = await registerServiceWorker();

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permiso denegado');
    }

    const response = await fetch(`${CONFIG.API_URL}/api/notifications/vapid-public-key`);
    const { publicKey } = await response.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const token = localStorage.getItem('token');

    const saveResponse = await fetch(`${CONFIG.API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    });

    const result = await saveResponse.json();

    if (result.success) {
      console.log('✅ Notificaciones activadas!');
      return true;
    }

    throw new Error(result.error);
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error: ' + error.message);
    return false;
  }
}

export async function checkPushSubscription() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      return false;
    }
  }
  return false;
}