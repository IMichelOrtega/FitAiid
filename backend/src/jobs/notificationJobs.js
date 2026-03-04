// =============================================
// CRON JOBS PARA NOTIFICACIONES CONDICIONALES
// =============================================
// Archivo: backend/src/jobs/notificationJobs.js

const cron = require('node-cron');
const {
  verificarUsuariosInactivos,
  verificarRachasEnPeligro
} = require('../services/notificationService');

console.log('⏰ Configurando cron jobs de notificaciones...');

// =============================================
// JOB 1: VERIFICAR USUARIOS INACTIVOS
// Se ejecuta todos los días a las 10:00 AM
// =============================================
cron.schedule('0 10 * * *', async () => {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔔 [CRON JOB] Verificando usuarios inactivos (3+ días)');
  console.log('📅 Fecha:', new Date().toLocaleString('es-ES'));
  console.log('═'.repeat(60));
  
  try {
    await verificarUsuariosInactivos();
    console.log('✅ [CRON JOB] Verificación de inactividad completada');
  } catch (error) {
    console.error('❌ [CRON JOB] Error en verificación de inactividad:', error);
  }
  
  console.log('═'.repeat(60));
  console.log('');
}, {
  scheduled: true,
  timezone: "America/Bogota" // Ajusta a tu zona horaria
});

// =============================================
// JOB 2: VERIFICAR RACHAS EN PELIGRO
// Se ejecuta todos los días a las 7:00 PM
// =============================================
cron.schedule('0 19 * * *', async () => {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔔 [CRON JOB] Verificando rachas en peligro');
  console.log('📅 Fecha:', new Date().toLocaleString('es-ES'));
  console.log('═'.repeat(60));
  
  try {
    await verificarRachasEnPeligro();
    console.log('✅ [CRON JOB] Verificación de rachas completada');
  } catch (error) {
    console.error('❌ [CRON JOB] Error en verificación de rachas:', error);
  }
  
  console.log('═'.repeat(60));
  console.log('');
}, {
  scheduled: true,
  timezone: "America/Bogota"
});

// =============================================
// JOB 3: VERIFICAR RACHAS EN PELIGRO (SEGUNDA ALERTA)
// Se ejecuta todos los días a las 9:00 PM (última oportunidad)
// =============================================
cron.schedule('0 21 * * *', async () => {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔔 [CRON JOB] Última oportunidad - Rachas en peligro');
  console.log('📅 Fecha:', new Date().toLocaleString('es-ES'));
  console.log('═'.repeat(60));
  
  try {
    await verificarRachasEnPeligro();
    console.log('✅ [CRON JOB] Segunda verificación de rachas completada');
  } catch (error) {
    console.error('❌ [CRON JOB] Error en verificación de rachas:', error);
  }
  
  console.log('═'.repeat(60));
  console.log('');
}, {
  scheduled: true,
  timezone: "America/Bogota"
});

console.log('✅ Cron jobs configurados exitosamente:');
console.log('   🕙 10:00 AM - Verificar usuarios inactivos (3+ días)');
console.log('   🕖 07:00 PM - Verificar rachas en peligro (1ra alerta)');
console.log('   🕘 09:00 PM - Verificar rachas en peligro (2da alerta)');
console.log('   🌎 Zona horaria: America/Bogota');
console.log('');

module.exports = {
  // Exportar para poder ejecutar manualmente si es necesario
  ejecutarVerificacionInactivos: verificarUsuariosInactivos,
  ejecutarVerificacionRachas: verificarRachasEnPeligro
};