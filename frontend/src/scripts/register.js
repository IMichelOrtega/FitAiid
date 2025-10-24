// ==============================
// REGISTRO NORMAL
// ==============================
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const userData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role").value
  };

  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (response.ok) {
      alert("✅ Usuario registrado correctamente");
      console.log(result);
      document.getElementById("registerForm").reset();
    } else {
      console.error(result);
      alert(`❌ Error: ${result.message || "No se pudo registrar el usuario"}`);
    }
  } catch (error) {
    console.error(error);
    alert("Error al conectar con el servidor");
  }
});


// ==============================
// LOGIN CON GOOGLE (FUNCIONANDO)
// ==============================
document.querySelector(".icons img[alt='Google']").addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userData = {
      firstName: user.displayName?.split(" ")[0] || "",
      lastName: user.displayName?.split(" ")[1] || "",
      email: user.email
    };

    const response = await fetch("http://localhost:5000/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const resultData = await response.json();
    console.log("📦 Respuesta backend:", resultData);

    if (response.ok) {
      alert("✅ Inicio de sesión con Google exitoso");
    } else {
      alert(`⚠️ Error: ${resultData.message || "No se pudo registrar"}`);
    }
  } catch (error) {
    console.error("❌ Error al iniciar sesión con Google:", error);
    alert("Error al iniciar sesión con Google");
  }
});
