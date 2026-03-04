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
    const response = await fetch(`${CONFIG.API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const apiResponse = await response.json();
    console.log('📦 Respuesta del servidor:', apiResponse);
    
    // ✅ EXTRAER EL DATA INTERNO
    const data = apiResponse.data;
    console.log('👤 Role:', data.user?.role);

    if (response.ok && apiResponse.success) {
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
      // ⭐ GUARDAR PERFIL FITNESS SI EXISTE
      if (data.user.fitnessProfile) {
        localStorage.setItem("fitnessProfile", JSON.stringify(data.user.fitnessProfile));
        console.log('✅ Perfil fitness guardado:', data.user.fitnessProfile);
      }

      console.log('📋 Verificando localStorage:');
      console.log('   - token:', localStorage.getItem('token'));
      console.log('   - userId:', localStorage.getItem('userId'));
      console.log('   - userEmail:', localStorage.getItem('userEmail'));

      // Verificar si el usuario completó el cuestionario
      const hasCompletedQuestionnaire = data.user?.fitnessProfile?.questionnaireCompleted;

      // Redirigir después de 1.5s
      if (data.user?.role === 'admin') {
        console.log('🔄 Usuario admin → admin.html');
        sessionStorage.setItem('fitaiid_token', data.token);
        sessionStorage.setItem('fitaiid_api', CONFIG.API_URL);
        sessionStorage.setItem('fitaiid_admin', JSON.stringify({
          name: `${data.user.firstName} ${data.user.lastName}`,
          email: data.user.email
        }));
        window.location.href = "admin.html";
        return;
      }

      if (hasCompletedQuestionnaire) {
        console.log('🔄 Usuario con cuestionario completado → home.html');
        window.location.href = "home.html";
      } else {
        console.log('🔄 Usuario sin cuestionario → preguntas.html');
        window.location.href = "preguntas.html";
      }



    } else {
      console.error('❌ Login fallido:', apiResponse);
      showMessage(apiResponse.message || "Credenciales inválidas", "error");
    }

  } catch (error) {
    console.error("❌ Error al conectar con el servidor:", error);
    showMessage("Error al conectar con el servidor", "error");
  }
});