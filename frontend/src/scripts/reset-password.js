// =============================================
// SCRIPT: reset-password.html
// =============================================
console.log('✅ Script reset-password.js cargado correctamente');
const API_URL = 'http://localhost:5000/api/auth';

// Verificar que haya email y código
const resetEmail = localStorage.getItem('resetEmail');

if (!resetEmail) {
    alert('Sesión expirada. Por favor inicia el proceso nuevamente.');
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

// Validar contraseña
function validatePassword(password) {
    if (password.length < 8) {
        return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
        return 'La contraseña debe contener al menos una mayúscula';
    }
    if (!/[a-z]/.test(password)) {
        return 'La contraseña debe contener al menos una minúscula';
    }
    if (!/[0-9]/.test(password)) {
        return 'La contraseña debe contener al menos un número';
    }
    return null;
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
    
    // Validar seguridad de la contraseña
    const passwordError = validatePassword(password);
    if (passwordError) {
        showMessage(passwordError, 'error');
        return;
    }
    
    setLoading(submitBtn, true);
    
    try {
        console.log('📤 Enviando nueva contraseña para:', resetEmail);
        
        // ⚠️ IMPORTANTE: Necesitamos el código también
        // El código debe estar guardado en localStorage desde verify-code.html
        const code = localStorage.getItem('verificationCode');
        
        if (!code) {
            showMessage('Código de verificación no encontrado. Inicia el proceso nuevamente.', 'error');
            setTimeout(() => {
                window.location.href = 'forgot-password.html';
            }, 2000);
            return;
        }
        
        const response = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: resetEmail,
                code: code,
                password: password
            })
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (response.ok && data.success) {
            showMessage('✅ Contraseña actualizada exitosamente', 'success');
            
            // Limpiar localStorage
            localStorage.removeItem('resetEmail');
            localStorage.removeItem('verificationCode');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Error al actualizar la contraseña', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error en la solicitud:', error);
        showMessage('Error de conexión con el servidor', 'error');
    } finally {
        setLoading(submitBtn, false);
    }
});

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', () => {
        const targetId = icon.dataset.target;
        const input = document.getElementById(targetId);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
});