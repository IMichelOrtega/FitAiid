// =============================================
// SCRIPT: forgot-password.html
// =============================================

const API_URL = 'http://localhost:5000/api/auth';

// Función para mostrar mensajes
function showMessage(message, type = 'success') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  // Auto-ocultar después de 5 segundos
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
  
  // Validar email
  if (!email) {
    showMessage('Por favor ingresa tu correo electrónico', 'error');
    return;
  }
  
  setLoading(submitBtn, true);
  
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showMessage('Código enviado a tu correo electrónico', 'success');
      
      // Guardar email en localStorage para usarlo después
      localStorage.setItem('resetEmail', email);
      
      // Redirigir a verificar código después de 2 segundos
      setTimeout(() => {
        window.location.href = 'verify-code.html';
      }, 2000);
    } else {
      showMessage(data.message || 'Error al enviar el código', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error de conexión con el servidor', 'error');
  } finally {
    setLoading(submitBtn, false);
  }
});