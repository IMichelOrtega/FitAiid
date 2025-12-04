// ========================================
// SISTEMA DE AVATAR - CON INICIALES DEL USUARIO
// ========================================

// 🎨 Función para generar avatar con las iniciales del usuario
function generateDefaultAvatar() {
  try {
    // Obtener datos del usuario
    const userString = localStorage.getItem('user');
    
    if (userString) {
      const user = JSON.parse(userString);
      const firstName = user.firstName || user.name || 'Usuario';
      const lastName = user.lastName || '';
      
      // Obtener iniciales (primera letra del nombre y apellido)
      let initials = firstName.charAt(0).toUpperCase();
      if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
      }
      
      // Generar nombre completo para el avatar
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      
      console.log(`📷 Generando avatar para: ${fullName} (${initials})`);
      
      // Generar URL del avatar personalizado
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ff2e00&color=fff&size=400&bold=true&rounded=true`;
    }
  } catch (e) {
    console.error('Error al generar avatar:', e);
  }
  
  // Avatar genérico si no hay datos del usuario
  return "https://ui-avatars.com/api/?name=FitAiid&background=ff2e00&color=fff&size=400&bold=true&rounded=true";
}

// Cargar avatar al iniciar la página
function loadUserAvatar() {
  const userId = localStorage.getItem("userId");
  const avatarImg = document.getElementById("avatarImg");
  
  if (!userId || !avatarImg) return;
  
  // Intentar cargar avatar guardado (foto personalizada del usuario)
  const savedAvatar = localStorage.getItem(`userAvatar_${userId}`);
  
  if (savedAvatar) {
    avatarImg.src = savedAvatar;
    console.log("✅ Avatar personalizado cargado desde localStorage");
  } else {
    // Usar avatar con iniciales del usuario
    const defaultAvatar = generateDefaultAvatar();
    avatarImg.src = defaultAvatar;
    console.log("📷 Usando avatar con iniciales del usuario");
  }
  
  // 🔥 Manejo de errores de carga
  avatarImg.onerror = function() {
    console.warn("⚠️ Error al cargar avatar, usando respaldo");
    this.onerror = null; // Evitar loop infinito
    // Avatar de respaldo genérico
    this.src = "https://ui-avatars.com/api/?name=User&background=ff2e00&color=fff&size=400&bold=true&rounded=true";
  };
}

// Manejar cambio de imagen
function handleAvatarChange(event) {
  const file = event.target.files[0];
  const userId = localStorage.getItem("userId");
  
  if (!file || !userId) return;
  
  // Validar que sea una imagen
  if (!file.type.startsWith('image/')) {
    alert('❌ Por favor selecciona un archivo de imagen válido');
    return;
  }
  
  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('❌ La imagen es muy grande. Máximo 5MB');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const base64Image = e.target.result;
    const avatarImg = document.getElementById("avatarImg");
    
    // Actualizar imagen en pantalla
    avatarImg.src = base64Image;
    
    // Guardar en localStorage con el ID del usuario
    localStorage.setItem(`userAvatar_${userId}`, base64Image);
    
    console.log("✅ Avatar actualizado y guardado");
    
    // Opcional: mostrar mensaje de éxito
    showSuccessMessage();
  };
  
  reader.onerror = function() {
    alert('❌ Error al cargar la imagen. Intenta de nuevo');
  };
  
  reader.readAsDataURL(file);
}

// Mensaje de éxito
function showSuccessMessage() {
  const message = document.createElement('div');
  message.textContent = '✅ Foto de perfil actualizada';
  message.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #00ff88, #00cc66);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => message.remove(), 300);
  }, 3000);
}

// Resetear avatar a imagen por defecto
function resetAvatar() {
  const userId = localStorage.getItem("userId");
  const avatarImg = document.getElementById("avatarImg");
  
  if (!userId || !avatarImg) return;
  
  if (confirm('¿Estás seguro de que quieres restaurar la foto por defecto?')) {
    // Generar avatar con iniciales del usuario
    const defaultAvatar = generateDefaultAvatar();
    avatarImg.src = defaultAvatar;
    
    // Eliminar foto personalizada
    localStorage.removeItem(`userAvatar_${userId}`);
    console.log("🔄 Avatar restaurado a iniciales del usuario");
    
    // Asegurar que se maneje el error si la imagen no carga
    avatarImg.onerror = function() {
      this.onerror = null;
      this.src = "https://ui-avatars.com/api/?name=User&background=ff2e00&color=fff&size=400&bold=true&rounded=true";
    };
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Cargar avatar del usuario
  loadUserAvatar();
  
  // Configurar listener para cambio de imagen
  const avatarInput = document.getElementById('avatarInput');
  if (avatarInput) {
    avatarInput.addEventListener('change', handleAvatarChange);
  }
  
  // Configurar botón de reset
  const resetBtn = document.getElementById('resetAvatarBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAvatar);
  }
});

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  #avatarImg {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    /* 🔥 Asegurar que la imagen cubra todo el espacio */
    object-fit: cover;
    background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
  }
  
  #avatarImg:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 46, 0, 0.5);
  }
  
  #uploadBtn {
    transition: all 0.3s ease;
  }
  
  #uploadBtn:hover {
    transform: scale(1.1);
    background: #ff2e00 !important;
  }
`;
document.head.appendChild(style);