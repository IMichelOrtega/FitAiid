// Verificar autenticación
if (!localStorage.getItem("token")) {
  window.location.replace("login.html");
}