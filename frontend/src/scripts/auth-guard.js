// Verificar autenticación
const token = localStorage.getItem("authToken") || localStorage.getItem("token");
const userId = localStorage.getItem("userId");

if (!token || !userId) {
  console.log("❌ No autenticado, redirigiendo a login...");
  window.location.replace("login.html");
} else {
  console.log("✅ Usuario autenticado:", userId);
}