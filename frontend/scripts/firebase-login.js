// ==============================
// FIREBASE LOGIN CON GOOGLE
// ==============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzpmKxgVzx6qHgEAsz82xSHM8ANjF8HTI",
  authDomain: "fitaiid-9c617.firebaseapp.com",
  projectId: "fitaiid-9c617",
  storageBucket: "fitaiid-9c617.firebasestorage.app",
  messagingSenderId: "698827830015",
  appId: "1:698827830015:web:ad141d6f1b8803edadd2ca",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Función para mostrar mensajes
function showMessage(text, type = "error") {
  const box = document.getElementById("login-message");
  if (!box) return;

  box.textContent = text;
  box.className = "message " + type;
  box.style.display = "block";

  // Ocultar después de 4 segundos
  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

// ==============================
// LOGIN CON GOOGLE 
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLoginBtn");

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      console.log("🔵 Click en botón de Google detectado");

      try {
        // Agregar clase para prevenir scroll
        document.body.classList.add("google-popup-open");

        googleProvider.setCustomParameters({ prompt: "select_account" });

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

        const result = await signInWithPopup(auth, googleProvider);
        
        // Detener la observación cuando el popup se cierra
        popupObserver.disconnect();
        document.body.classList.remove("google-popup-open");

        const user = result.user;

        console.log("✅ Usuario autenticado en Firebase:");
        console.log("   📧 Email:", user.email);
        console.log("   👤 Nombre:", user.displayName);

        // Enviar al backend
        const response = await fetch(`${CONFIG.API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: user.displayName?.split(" ")[0] || "Usuario",
            lastName: user.displayName?.split(" ").slice(1).join(" ") || "Google",
            email: user.email,
            uid: user.uid
          })
        });

        const data = await response.json();
        console.log("📦 Respuesta del servidor:", data);

        if (response.ok && (data.success || data.token)) {
          showMessage("✅ Inicio de sesión exitoso", "success");

          // ⭐ GUARDAR TODOS LOS DATOS NECESARIOS
          if (data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("authToken", data.token); // Para compatibilidad
            console.log("✅ Token guardado");
          }

          if (data.user) {
            // Guardar userId
            const odid = data.user._id || data.user.id;
            if (odid) {
              localStorage.setItem("userId", odid);
              console.log("✅ userId guardado:", odid);
            }

            // Guardar email
            if (data.user.email) {
              localStorage.setItem("userEmail", data.user.email);
              console.log("✅ Email guardado:", data.user.email);
            }

            // Guardar objeto completo del usuario
            localStorage.setItem("user", JSON.stringify(data.user));
            console.log("✅ Usuario completo guardado");
          }

          // Verificar qué se guardó
          console.log("📋 Verificando localStorage:");
          console.log("   - token:", localStorage.getItem("token"));
          console.log("   - authToken:", localStorage.getItem("authToken"));
          console.log("   - userId:", localStorage.getItem("userId"));
          console.log("   - user:", localStorage.getItem("user"));

          // Verificar si el usuario completó el cuestionario
          const hasCompletedQuestionnaire = data.user?.fitnessProfile?.questionnaireCompleted;

          // Redirigir después de 1.5s
          setTimeout(() => {
            if (hasCompletedQuestionnaire) {
              console.log("🔄 Usuario con cuestionario completado → home.html");
              window.location.href = "home.html";
            } else {
              console.log("🔄 Usuario sin cuestionario → preguntas.html");
              window.location.href = "preguntas.html";
            }
          }, 1500);

        } else if (data.userNotFound) {
          // 🔹 CASO ESPECIAL: Usuario no registrado
          showMessage("⚠️ Este correo no está registrado. Por favor regístrate primero.", "error");

          // Opcional: Redirigir al registro después de 3 segundos
          setTimeout(() => {
            window.location.href = "register.html";
          }, 3000);

        } else {
          console.error("❌ Error en respuesta:", data);
          showMessage("⚠️ " + (data.message || "Error al iniciar sesión"), "error");
          document.body.classList.remove("google-popup-open");
        }

      } catch (error) {
        // Limpiar clase cuando aparece error
        document.body.classList.remove("google-popup-open");

        console.error("❌ Error con Google:", error);
        console.error("   Código:", error.code);
        console.error("   Mensaje:", error.message);

        if (error.code === "auth/popup-closed-by-user") {
          showMessage("Cerraste la ventana de Google", "error");
        } else if (error.code === "auth/popup-blocked") {
          showMessage("El navegador bloqueó el popup. Permite popups.", "error");
        } else {
          showMessage("Error al iniciar sesión con Google", "error");
        }
      }
    });

    console.log("✅ Listener de Google Login configurado");
  } else {
    console.warn("⚠️ Botón de Google Login no encontrado (googleLoginBtn)");
  }
});