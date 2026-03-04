// ==============================
// MENSAJE TIPO TOAST
// ==============================
function showToast(text, redirect = null) {
  const toast = document.getElementById("toastMsg");
  if (toast) {
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
const confirmPasswordInput = document.getElementById("confirmPassword");
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
confirmPasswordInput.addEventListener("input", togglePasswordHelpers);

// ==============================
// REGISTRO NORMAL (CON VERIFICACIÓN DE CÓDIGO)
// ==============================
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const msgBox = document.getElementById("msgBox");

  // Limpia clases previas
  msgBox.classList.remove("msg-success", "msg-error");

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Verificar que las contraseñas coincidan
  if (password !== confirmPassword) {
    msgBox.classList.add("msg-error");
    msgBox.innerHTML = "❌ Las contraseñas no coinciden";
    msgBox.style.display = "block";
    setTimeout(() => msgBox.style.display = "none", 3000);
    return;
  }

  const userData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    password: password,
    role: "customer"
  };

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/auth/register-with-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (response.ok) {
      // ✅ Guardar email para verificación
      localStorage.setItem('pendingVerificationEmail', userData.email);

      msgBox.classList.add("msg-success");
      msgBox.innerHTML = "✅ Código enviado a tu correo. Revisa tu bandeja de entrada.";
      msgBox.style.display = "block";

      document.getElementById("registerForm").reset();

      // ✅ Redirigir a página de verificación
      setTimeout(() => {
        window.location.href = "verify-code.html";
      }, 2000);

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
// LOGIN CON GOOGLE (CORREGIDO) ✅
// ==============================
// Esperar a que el DOM y Firebase estén listos
window.addEventListener('load', () => {
  // Esperar un poco más para asegurar que Firebase esté inicializado
  setTimeout(() => {
    const googleButton = document.querySelector(".icons img[alt='Google']");

    if (!googleButton) {
      console.error("❌ Botón de Google no encontrado");
      return;
    }

    googleButton.addEventListener("click", async () => {
      console.log("🔵 Click en botón de Google detectado");

      try {
        // Agregar clase para prevenir scroll
        document.body.classList.add("google-popup-open");

        // ✅ VERIFICAR que Firebase esté disponible
        if (!window.firebaseAuth) {
          console.error("❌ Firebase Auth no disponible");
          alert("Error: Firebase no está cargado. Recarga la página.");
          document.body.classList.remove("google-popup-open");
          return;
        }

        if (!window.GoogleAuthProvider || !window.signInWithPopup) {
          console.error("❌ GoogleAuthProvider o signInWithPopup no disponibles");
          alert("Error: Componentes de Firebase no disponibles.");
          document.body.classList.remove("google-popup-open");
          return;
        }

        console.log("✅ Firebase verificado correctamente");

        const provider = new window.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        console.log("🔄 Abriendo ventana de Google...");
        
        // Forzar que el popup se centre con MutationObserver
        const popupObserver = new MutationObserver(() => {
          const popups = document.querySelectorAll('div[role="dialog"], iframe[title*="Google"], div[gapi-signin-wrapper]');
          popups.forEach(popup => {
            popup.style.position = "fixed";
            popup.style.left = "50%";
            popup.style.top = "50%";
            popup.style.transform = "translate(-50%, -50%)";
            popup.style.zIndex = "9999";
          });
        });
        popupObserver.observe(document.body, { childList: true, subtree: true });

        const result = await window.signInWithPopup(window.firebaseAuth, provider);
        
        // Detener la observación cuando el popup se cierra
        popupObserver.disconnect();
        document.body.classList.remove("google-popup-open");

        const user = result.user;

        console.log("✅ Usuario autenticado en Firebase:");
        console.log("   📧 Email:", user.email);
        console.log("   🆔 UID:", user.uid);
        console.log("   👤 Nombre:", user.displayName);

        const userData = {
          firstName: user.displayName?.split(" ")[0] || "Usuario",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "Google",
          email: user.email,
          uid: user.uid
        };

        console.log("📤 Enviando al backend:", userData);

        const response = await fetch(`${CONFIG.API_URL}/api/auth/google-register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData)
        });

        console.log("📥 Respuesta del servidor - Status:", response.status);

        const resultData = await response.json();
        console.log("📦 Datos recibidos del backend:", resultData);

        if (response.ok && resultData.success) {
          // ✅ Guardar token y usuario
          localStorage.setItem('authToken', resultData.token);
          localStorage.setItem('user', JSON.stringify(resultData.user));
          localStorage.setItem('userId', resultData.user._id || resultData.user.id);  // ← AÑADIR ESTA LÍNEA
          console.log("✅ Token guardado en localStorage");
          console.log("✅ Usuario guardado:", resultData.user.email);

          // Mostrar mensaje
          const msgBox = document.getElementById("msgBox");
          if (msgBox) {
            msgBox.classList.add("msg-success");
            msgBox.innerHTML = "✅ Inicio de sesión con Google exitoso";
            msgBox.style.display = "block";
          }

          // 🔧 REDIRECCIÓN CORREGIDA A PREGUNTAS.HTML
          setTimeout(() => {
            console.log("🔄 Redirigiendo a preguntas.html...");
            window.location.href = "preguntas.html";
          }, 1500);

        } else {
          console.error("❌ Error en respuesta del servidor:", resultData);
          alert(`Error: ${resultData.message || "No se pudo iniciar sesión"}`);
          document.body.classList.remove("google-popup-open");
        }

      } catch (error) {
        // Limpiar clase cuando aparece error
        document.body.classList.remove("google-popup-open");

        console.error("❌ ERROR COMPLETO:");
        console.error("   Nombre:", error.name);
        console.error("   Mensaje:", error.message);
        console.error("   Código:", error.code);

        let errorMessage = "Error al iniciar sesión con Google";

        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = "Cerraste la ventana de Google";
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = "El navegador bloqueó el popup. Permite popups.";
        }

        alert(errorMessage);
      }
    });

    console.log("✅ Listener de Google configurado correctamente");
  }, 1000); // Esperar 1 segundo para asegurar que Firebase esté listo
});