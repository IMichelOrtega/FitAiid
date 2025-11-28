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
  box.textContent = text;
  box.className = "message " + type;
  box.style.display = "block";

  // Ocultar después de 4 segundos
  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

// ==============================
// LOGIN CON GOOGLE (MODIFICADO)
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLoginBtn");
  
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        googleProvider.setCustomParameters({ prompt: "select_account" });
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Enviar al backend
        const response = await fetch("http://localhost:5000/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: user.displayName?.split(" ")[0] || "",
            lastName: user.displayName?.split(" ")[1] || "",
            email: user.email,
            uid: user.uid
          })
        });

        const data = await response.json();
        console.log("📦 Respuesta del servidor:", data);

        if (response.ok && data.token) {
          showMessage("✅ Inicio de sesión exitoso", "success");
          
          // Guardar token
          localStorage.setItem("token", data.token);

          // Redirigir
          setTimeout(() => {
            window.location.href = "home.html";
          }, 1500);

        } else if (data.userNotFound) {
          // 🔹 CASO ESPECIAL: Usuario no registrado
          showMessage("⚠️ Este correo no está registrado. Por favor regístrate primero.", "error");
          
          // Opcional: Redirigir al registro después de 3 segundos
          setTimeout(() => {
            window.location.href = "register.html";
          }, 3000);

        } else {
          showMessage("⚠️ " + (data.message || "Error al iniciar sesión"), "error");
        }

      } catch (error) {
        console.error("❌ Error con Google:", error);
        
        if (error.code === "auth/popup-closed-by-user") {
          showMessage("Cerraste la ventana de Google", "error");
        } else {
          showMessage("Error al iniciar sesión con Google", "error");
        }
      }
    });
  }
});