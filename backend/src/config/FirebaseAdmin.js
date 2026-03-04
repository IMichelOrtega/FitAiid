// backend/config/firebaseAdmin.js
const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Cargar desde variable de entorno (Recomendado para producción)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('✅ Firebase Admin: Cargado desde variables de entorno');
  } else {
    // Cargar desde archivo local (Desarrollo)
    const serviceAccountPath = path.join(__dirname, 'firebase-adminsdk.json');
    serviceAccount = require(serviceAccountPath);
    console.log('✅ Firebase Admin: Cargado desde archivo local');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('🚀 Firebase Admin inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
}

module.exports = admin;