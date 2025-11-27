// =============================================
// SCRIPT: verify-code.html
// =============================================

const API_URL = 'http://localhost:5000/api/auth';

// Obtener email del localStorage
const email = localStorage.getItem('resetEmail');

// Si no hay email guardado, redirigir
if (!email) {
  window.location.href = 'forgot-password.html';
}

// Mostrar email en la página
document.getElementById('emailDisplay').textContent = `Código enviado a: ${email}`;

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

// Permitir solo números en el input
const codeInput = document.getElementById('code');
codeInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// Manejar envío del formulario
document.getElementById('verifyCodeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const code = document.getElementById('code').value.trim();
  const submitBtn = document.getElementById('submitBtn');
  
  // Validar código
  if (code.length !== 6) {
    showMessage('El código debe tener 6 dígitos', 'error');
    return;
  }
  
  setLoading(submitBtn, true);
  
  try {
    const response = await fetch(`${API_URL}/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, code })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showMessage('Código verificado correctamente', 'success');
      
      // Guardar código para el siguiente paso
      localStorage.setItem('resetCode', code);
      
      // Redirigir a nueva contraseña
      setTimeout(() => {
        window.location.href = 'reset-password.html';
      }, 1500);
    } else {
      showMessage(data.message || 'Código inválido o expirado', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error de conexión con el servidor', 'error');
  } finally {
    setLoading(submitBtn, false);
  }
});

// Botón para reenviar código
document.getElementById('resendBtn').addEventListener('click', async () => {
  const resendBtn = document.getElementById('resendBtn');
  resendBtn.disabled = true;
  resendBtn.textContent = 'Enviando...';
  
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
      showMessage('Nuevo código enviado a tu correo', 'success');
      
      // Deshabilitar botón por 60 segundos
      let countdown = 60;
      const interval = setInterval(() => {
        resendBtn.textContent = `Reenviar código (${countdown}s)`;
        countdown--;
        
        if (countdown < 0) {
          clearInterval(interval);
          resendBtn.disabled = false;
          resendBtn.textContent = 'Reenviar código';
        }
      }, 1000);
    } else {
      showMessage(data.message || 'Error al reenviar código', 'error');
      resendBtn.disabled = false;
      resendBtn.textContent = 'Reenviar código';
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Error de conexión con el servidor', 'error');
    resendBtn.disabled = false;
    resendBtn.textContent = 'Reenviar código';
  }
});