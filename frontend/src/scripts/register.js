// ==============================
// MENSAJE TIPO TOAST (NUEVO)
// ==============================
function showToast(text, redirect = null) {
  const toast = document.getElementById("toastMsg");
  toast.textContent = text;
  toast.classList.add("toast-show");
  toast.style.display = "block";

  setTimeout(() => {
    toast.classList.remove("toast-show");

    if (redirect) {
      setTimeout(() => {
        window.location.href = redirect;
      }, 300);
    }

  }, 3000);
}



// ==============================
// BARRA DE FUERZA DE CONTRASEÑA
// ==============================
document.getElementById("password").addEventListener("input", () => {
  const password = document.getElementById("password").value;
  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");

  let strength = 0;

  if (password.length >= 6) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  switch (strength) {
    case 0:
      strengthFill.style.width = "0%";
      strengthFill.style.background = "red";
      strengthText.textContent = "";
      break;

    case 1:
      strengthFill.style.width = "25%";
      strengthFill.style.background = "red";
      strengthText.textContent = "Contraseña muy débil";
      break;

    case 2:
      strengthFill.style.width = "50%";
      strengthFill.style.background = "orange";
      strengthText.textContent = "Contraseña débil";
      break;

    case 3:
      strengthFill.style.width = "75%";
      strengthFill.style.background = "gold";
      strengthText.textContent = "Contraseña aceptable";
      break;

    case 4:
      strengthFill.style.width = "100%";
      strengthFill.style.background = "green";
      strengthText.textContent = "Contraseña fuerte";
      break;
  }
});

// ==============================
// MOSTRAR / OCULTAR LISTA DE REGLAS
// ==============================
const passwordInput = document.getElementById("password");

const strengthBar = document.getElementById("password-strength");
const strengthText = document.getElementById("strength-text");
const rulesList = document.getElementById("password-rules");

// Ocultarlos al inicio
strengthBar.style.display = "none";
strengthText.style.display = "none";
rulesList.style.display = "none";

function togglePasswordHelpers() {
  const pass = passwordInput.value.trim();
  const confirm = confirmPasswordInput.value.trim();

  if (pass !== "" || confirm !== "") {
    strengthBar.style.display = "block";
    strengthText.style.display = "block";
    rulesList.style.display = "block";
  } else {
    strengthBar.style.display = "none";
    strengthText.style.display = "none";
    rulesList.style.display = "none";
  }
}

passwordInput.addEventListener("input", togglePasswordHelpers);



// ==============================
// REGISTRO NORMAL (MODIFICADO)
// ==============================
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const msgBox = document.getElementById("msgBox");

  // Limpia clases previas
  msgBox.classList.remove("msg-success", "msg-error");

  const userData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role: "customer"
  };

  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (response.ok) {

      msgBox.classList.add("msg-success");
      msgBox.innerHTML = "✅ Usuario registrado correctamente";
      msgBox.style.display = "block";

      document.getElementById("registerForm").reset();

      // Redirigir después de 1.5s
      setTimeout(() => {
        window.location.href = "preguntas.html";
      }, 1500);

    } else {

      msgBox.classList.add("msg-error");
      msgBox.innerHTML = `❌ Error: ${result.message || "No se pudo registrar el usuario"}`;
      msgBox.style.display = "block";

      setTimeout(() => msgBox.style.display = "none", 3000);
    }

  } catch (error) {
    console.error(error);

    msgBox.classList.add("msg-error");
    msgBox.innerHTML = "❌ Error al conectar con el servidor";
    msgBox.style.display = "block";

    setTimeout(() => msgBox.style.display = "none", 3000);
  }
});




// ==============================
// LOGIN CON GOOGLE (MODIFICADO)
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
      showToast("✅ Inicio de sesión con Google exitoso", "login.html");
    } else {
      showToast(`⚠️ Error: ${resultData.message || "No se pudo registrar"}`);
    }
  } catch (error) {
    console.error("❌ Error al iniciar sesión con Google:", error);
    showToast("❌ Error al iniciar sesión con Google");
  }
});
