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

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("Inicio de sesión exitoso. Redirigiendo...", "success");

      // Guardar token
      localStorage.setItem("token", data.token);

      // Redirigir después de 1.5s
      setTimeout(() => {
        window.location.href = "home.html";
      }, 1500);

    } else {
      showMessage(data.message || "Credenciales inválidas", "error");
    }

  } catch (error) {
    console.error("❌ Error al conectar con el servidor:", error);
    showMessage("Error al conectar con el servidor", "error");
  }
});
