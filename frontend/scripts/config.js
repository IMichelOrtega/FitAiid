// =============================================
// CONFIGURACIÓN CENTRALIZADA DEL FRONTEND
// =============================================

const CONFIG = {
    // URL de la API (Cambiar por la URL real de despliegue en producción)
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://fit-aiid.vercel.app/', // <-- Reemplazar con tu URL real

    // Tiempo de expiración de sesión (en milisegundos)
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

    // Configuración de la PWA
    PWA: {
        NAME: 'FitAiid',
        SHORT_NAME: 'FitAiid'
    }
};

// Congelar el objeto para evitar modificaciones accidentales
if (typeof Object.freeze === 'function') {
    Object.freeze(CONFIG);
}

console.log('⚙️ Configuración del frontend cargada:', CONFIG.API_URL);
