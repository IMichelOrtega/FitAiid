// =============================================
// ALMACENAMIENTO TEMPORAL DE VERIFICACIONES
// VERSIÓN MONGODB - PERSISTE ENTRE REINICIOS
// =============================================

const mongoose = require('mongoose');

// =============================================
// SCHEMA CON TTL AUTOMÁTICO (expira solo en MongoDB)
// =============================================
const pendingVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  userData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900 // ⏰ MongoDB elimina automáticamente después de 15 minutos (900 seg)
  }
});

// Usar modelo existente si ya fue compilado (evita error en hot-reload)
const PendingVerification = mongoose.models.PendingVerification 
  || mongoose.model('PendingVerification', pendingVerificationSchema);

// =============================================
// GUARDAR CÓDIGO DE VERIFICACIÓN
// =============================================
const savePendingVerification = async (email, code, userData) => {
  try {
    // Upsert: si ya existe, lo reemplaza (para casos de reenvío)
    await PendingVerification.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase(),
        code,
        userData,
        createdAt: new Date() // Resetea el TTL
      },
      { upsert: true, new: true }
    );

    console.log(`💾 Código temporal guardado en MongoDB para: ${email}`);
    console.log(`⏰ Expira en: 15 minutos`);
  } catch (error) {
    console.error(`❌ Error guardando verificación pendiente: ${error.message}`);
    throw error;
  }
};

// =============================================
// OBTENER DATOS DE VERIFICACIÓN PENDIENTE
// =============================================
const getPendingVerification = async (email) => {
  try {
    const verification = await PendingVerification.findOne({
      email: email.toLowerCase()
    });

    if (!verification) {
      console.log(`❌ No hay verificación pendiente para: ${email}`);
      return null;
    }

    console.log(`✅ Verificación encontrada para: ${email}`);
    return verification;
  } catch (error) {
    console.error(`❌ Error obteniendo verificación pendiente: ${error.message}`);
    return null;
  }
};

// =============================================
// ELIMINAR VERIFICACIÓN PENDIENTE
// =============================================
const deletePendingVerification = async (email) => {
  try {
    const result = await PendingVerification.deleteOne({
      email: email.toLowerCase()
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Verificación eliminada para: ${email}`);
    }
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`❌ Error eliminando verificación: ${error.message}`);
    return false;
  }
};

module.exports = {
  savePendingVerification,
  getPendingVerification,
  deletePendingVerification
};