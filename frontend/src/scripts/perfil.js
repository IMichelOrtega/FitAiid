// dashboard.js — pega todo esto y guarda

document.addEventListener("DOMContentLoaded", () => {
  // Obtener referencias
  const uploadBtn = document.getElementById("uploadBtn");
  const avatarInput = document.getElementById("avatarInput");
  const avatarImg = document.getElementById("avatarImg");

  // Validar que existan los elementos
  if (!uploadBtn || !avatarInput || !avatarImg) {
    console.error("Elementos del avatar no encontrados. IDs requeridas: uploadBtn, avatarInput, avatarImg");
    return;
  }

  console.log("Avatar script inicializado correctamente");

  // Click en botón abre selector de archivos
  uploadBtn.addEventListener("click", (e) => {
    e.preventDefault();
    avatarInput.click();
  });

  // También permitir click en la propia imagen para subir
  avatarImg.addEventListener("click", () => avatarInput.click());

  // Manejar la selección de archivo
  avatarInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      console.log("No se seleccionó archivo");
      return;
    }

    // Validación simple de tipo y tamaño (opcional)
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen.");
      return;
    }
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      alert("La imagen es muy grande. Máximo " + maxMB + " MB.");
      return;
    }

    // Mostrar preview usando FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarImg.src = e.target.result;
      try {
        // Guardar en localStorage para que persista recarga
        localStorage.setItem("userAvatar", e.target.result);
        console.log("Avatar guardado en localStorage");
      } catch (err) {
        console.warn("No se pudo guardar en localStorage:", err);
      }
    };
    reader.onerror = (err) => {
      console.error("Error leyendo archivo:", err);
      alert("Ocurrió un error al leer la imagen.");
    };
    reader.readAsDataURL(file);
  });

  // Al cargar la página, cargar avatar guardado si existe
  const savedAvatar = localStorage.getItem("userAvatar");
  if (savedAvatar) {
    avatarImg.src = savedAvatar;
    console.log("Avatar cargado desde localStorage");
  }
});
