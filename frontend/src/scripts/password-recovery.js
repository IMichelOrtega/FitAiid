// =============================================
// SCRIPT: forgot-password.html
// =============================================
console.log('✅ Script password-recovery.js cargado correctamente');
const API_URL = 'http://localhost:5000/api/auth';

// Función para mostrar mensajes
function showMessage(message, type = 'success') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}

// Función para mostrar loading en botón
function setLoading(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const btnLoading = button.querySelector('.btn-loading');
  
  if (isLoading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-block';
    button.disabled = true;
  } else {
    btnText.style.display = 'inline-block';
    btnLoading.style.display = 'none';
    button.disabled = false;
  }
}

// Manejar envío del formulario
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const submitBtn = document.getElementById('submitBtn');
  
  if (!email) {
    showMessage('Por favor ingresa tu correo electrónico', 'error');
    return;
  }
  
  setLoading(submitBtn, true);
  
  try {
    console.log('📤 Enviando solicitud para:', email);
    
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);
    
    // ✅ USUARIO EXISTE - Código enviado
    if (response.ok && data.success) {
      showMessage('Código enviado a tu correo electrónico', 'success');
      localStorage.setItem('resetEmail', email);
      
      setTimeout(() => {
        window.location.href = 'verify-code.html';
      }, 2000);
    } 
    // ❌ USUARIO NO EXISTE
    else if (response.status === 404 && data.userNotFound) {
      showMessage(data.message, 'error');
      
      setTimeout(() => {
        const goToRegister = confirm('¿Deseas registrarte ahora?');
        if (goToRegister) {
          window.location.href = 'register.html';
        }
      }, 1500);
    } 
    // ❌ OTRO ERROR
    else {
      showMessage(data.message || 'Error al enviar el código', 'error');
    }
    
  } catch (error) {
    console.error('❌ Error en la solicitud:', error);
    showMessage('Error de conexión con el servidor', 'error');
  } finally {
    setLoading(submitBtn, false);
  }
});
