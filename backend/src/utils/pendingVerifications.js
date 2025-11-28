// =============================================
// ALMACENAMIENTO TEMPORAL DE VERIFICACIONES
// =============================================

/**
 * Almacena códigos de verificación en memoria
 * Estructura: { email: { code, userData, expiresAt } }
 */
const pendingVerifications = new Map();

/**
 * Guardar código de verificación temporal
 */
const savePendingVerification = (email, code, userData) => {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos
  
  pendingVerifications.set(email.toLowerCase(), {
    code,
    userData,
    expiresAt
  });
  
  console.log(`💾 Código temporal guardado para: ${email}`);
  console.log(`⏰ Expira en: 15 minutos`);
};

/**
 * Obtener datos de verificación pendiente
 */
const getPendingVerification = (email) => {
  const verification = pendingVerifications.get(email.toLowerCase());
  
  if (!verification) {
    console.log(`❌ No hay verificación pendiente para: ${email}`);
    return null;
  }
  
  // Verificar si expiró
  if (verification.expiresAt < Date.now()) {
    console.log(`⏰ Código expirado para: ${email}`);
    pendingVerifications.delete(email.toLowerCase());
    return null;
  }
  
  return verification;
};

/**
 * Eliminar verificación pendiente
 */
const deletePendingVerification = (email) => {
  const deleted = pendingVerifications.delete(email.toLowerCase());
  if (deleted) {
    console.log(`🗑️ Verificación eliminada para: ${email}`);
  }
  return deleted;
};

/**
 * Limpiar verificaciones expiradas (ejecutar periódicamente)
 */
const cleanExpiredVerifications = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [email, verification] of pendingVerifications.entries()) {
    if (verification.expiresAt < now) {
      pendingVerifications.delete(email);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Limpiados ${cleaned} códigos expirados`);
  }
};

// Limpiar cada 5 minutos
setInterval(cleanExpiredVerifications, 5 * 60 * 1000);

module.exports = {
  savePendingVerification,
  getPendingVerification,
  deletePendingVerification
};