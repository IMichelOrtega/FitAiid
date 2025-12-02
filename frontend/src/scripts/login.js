// ==============================
// LOGIN DE USUARIO
// ==============================

// Función para mostrar mensajes en pantalla
function showMessage(text, type = "error") {
  const box = document.getElementById("login-message");
  box.textContent = text;
  box.className = "message " + type;
  box.style.display = "block";
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showMessage("Por favor ingresa tu correo y contraseña", "error");
    return;
  }

  console.log('🔐 Intentando login para:', email);

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('📦 Respuesta del servidor:', data);

    if (response.ok && data.success) {
      showMessage("Inicio de sesión exitoso. Redirigiendo...", "success");

      // ⭐ GUARDAR TODOS LOS DATOS NECESARIOS
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("authToken", data.token); // Para compatibilidad
        console.log('✅ Token guardado');
      }

      if (data.user) {
        if (data.user._id || data.user.id) {
          const userId = data.user._id || data.user.id;
          localStorage.setItem("userId", userId);
          console.log('✅ userId guardado:', userId);
        }

        if (data.user.email) {
          localStorage.setItem("userEmail", data.user.email);
          console.log('✅ Email guardado:', data.user.email);
        }

        // Guardar objeto completo del usuario
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log('✅ Usuario completo guardado');
      }

      console.log('📋 Verificando localStorage:');
      console.log('   - token:', localStorage.getItem('token'));
      console.log('   - userId:', localStorage.getItem('userId'));
      console.log('   - userEmail:', localStorage.getItem('userEmail'));

      // Verificar si el usuario completó el cuestionario
      const hasCompletedQuestionnaire = data.user?.fitnessProfile?.questionnaireCompleted;
      
      // Redirigir después de 1.5s
      setTimeout(() => {
        if (hasCompletedQuestionnaire) {
          console.log('🔄 Usuario con cuestionario completado → home.html');
          window.location.href = "home.html";
        } else {
          console.log('🔄 Usuario sin cuestionario → preguntas.html');
          window.location.href = "preguntas.html";
        }
      }, 1500);

    } else {
      console.error('❌ Login fallido:', data);
      showMessage(data.message || "Credenciales inválidas", "error");
    }

  } catch (error) {
    console.error("❌ Error al conectar con el servidor:", error);
    showMessage("Error al conectar con el servidor", "error");
  }
});