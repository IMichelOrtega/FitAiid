// backend/config/firebaseAdmin.js
const admin = require('firebase-admin');
const path = require('path');

// Cargar el archivo de credenciales directamente
const serviceAccount = require(path.join(__dirname, 'firebase-adminsdk.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('✅ Firebase Admin inicializado correctamente');

module.exports = admin;