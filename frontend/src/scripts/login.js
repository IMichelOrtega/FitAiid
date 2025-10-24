// ==============================
// LOGIN DE USUARIO
// ==============================

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Por favor ingresa tu correo y contraseña");
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
      alert("✅ Inicio de sesión exitoso");
      console.log("👤 Usuario:", data.user);
      console.log("🎫 Token:", data.token);

      // Puedes guardar el token si lo usas más adelante
      localStorage.setItem("token", data.token);

      // Redirigir al dashboard o página principal
      window.location.href = "home.html";
    } else {
      alert(`❌ ${data.message || "Credenciales inválidas"}`);
    }
  } catch (error) {
    console.error("❌ Error al conectar con el servidor:", error);
    alert("Error al conectar con el servidor");
  }
});
