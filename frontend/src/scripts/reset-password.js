// =============================================
// SCRIPT: reset-password.html
// =============================================

const API_URL = 'http://localhost:5000/api/auth';

// Obtener email y código del localStorage
const email = localStorage.getItem('resetEmail');
const code = localStorage.getItem('resetCode');

// Si no hay datos guardados, redirigir
if (!email || !code) {
  window.location.href = 'forgot-password.html';
}

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

// Validación de contraseña
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe tener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe tener al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe tener al menos un número');
  }
  
  return errors;
}

// Manejar envío del formulario
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = document.getElementById('submitBtn');
  
  // Validar que las contraseñas coincidan
  if (password !== confirmPassword) {
    showMessage('Las contraseñas no coinciden', 'error');
    return;
  }
  
  // Validar fortaleza de contraseña
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    showMessage(passwordErrors.join('. '), 'error');
    return;
  }
  
  setLoading(submitBtn, true);
  
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, code, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showMessage('Contraseña actualizada correctamente', 'success');
      
      // Limpiar localStorage
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('resetCode');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      showMessage(data.message || 'Error al actualizar la contraseña', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error de conexión con el servidor', 'error');
  } finally {
    setLoading(submitBtn, false);
  }
});