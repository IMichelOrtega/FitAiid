// =============================================
// PERFIL.JS - MANEJO DE AVATAR CON BACKEND
// Adaptado a los IDs del HTML de FitAiid
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  // CONFIGURACION - Cambiar por tu URL de backend
  const API_URL = CONFIG.API_URL;

  // OBTENER USER ID del localStorage o sesion
  const userId = localStorage.getItem("userId");

  console.log("DEBUG - userId obtenido:", userId);

  if (!userId) {
    console.warn("No hay usuario logueado. El avatar no se guardara en el servidor.");
  }

  // Obtener elementos del DOM
  const avatarImg = document.getElementById("userAvatar");
  const imageUpload = document.getElementById("imageUpload");

  if (!avatarImg) {
    console.error("No se encontro el elemento con ID 'userAvatar'");
    return;
  }

  if (!imageUpload) {
    console.error("No se encontro el elemento con ID 'imageUpload'");
    return;
  }

  console.log("Avatar script inicializado correctamente");

  // =============================================
  // INTERCEPTAR LA SUBIDA DE IMAGEN
  // =============================================

  // Guardar la funcion original handleImageUpload si existe
  const originalHandleImageUpload = window.handleImageUpload;

  // Sobrescribir handleImageUpload para agregar funcionalidad del servidor
  window.handleImageUpload = function (e) {
    // Llamar a la funcion original primero (si existe)
    if (originalHandleImageUpload) {
      originalHandleImageUpload(e);
    }

    // Luego agregar nuestra funcionalidad
    const file = e.target.files[0];
    if (!file) {
      console.log("No se selecciono archivo");
      return;
    }

    // Validacion de tipo y tamano
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen.");
      return;
    }

    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      alert("La imagen es muy grande. Maximo " + maxMB + " MB.");
      return;
    }

    // Convertir a base64 y guardar en servidor
    const reader = new FileReader();

    reader.onload = async (event) => {
      const base64Image = event.target.result;

      console.log("Imagen convertida a base64, tamano:", base64Image.length, "caracteres");

      // Actualizar preview inmediatamente
      if (avatarImg) {
        avatarImg.src = base64Image;
      }

      // GUARDAR EN EL SERVIDOR (NO EN LOCALSTORAGE)
      if (userId) {
        try {
          console.log("Enviando avatar al servidor...");
          console.log("URL:", `${API_URL}/api/avatar/${userId}`);

          const response = await fetch(`${API_URL}/api/avatar/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              avatarData: base64Image
            })
          });

          console.log("Respuesta del servidor - Status:", response.status);

          const data = await response.json();
          console.log("Datos recibidos:", data);

          if (data.success) {
            console.log("âœ… Avatar guardado en el SERVIDOR para usuario:", userId);

            // Opcional: mostrar notificacion
            if (typeof mostrarNotificacion === 'function') {
              mostrarNotificacion("Avatar actualizado correctamente", "success");
            }
          } else {
            console.error("âŒ Error del servidor:", data.message);
            alert("Error al guardar avatar: " + data.message);
          }
        } catch (error) {
          console.error("âŒ Error al comunicarse con el servidor:", error);
          alert("Error al guardar avatar. Verifica tu conexion.");
        }
      } else {
        console.warn("âš ï¸ No se guardo en el servidor porque no hay userId");
        alert("No hay usuario logueado. El avatar no se guardara permanentemente.");
      }
    };

    reader.onerror = (err) => {
      console.error("Error leyendo archivo:", err);
      alert("Ocurrio un error al leer la imagen.");
    };

    reader.readAsDataURL(file);
  };

  // =============================================
  // CARGAR AVATAR AL INICIAR PAGINA
  // =============================================
  async function cargarAvatarDesdeServidor() {
    if (!userId) {
      console.warn("âš ï¸ No hay userId, no se puede cargar avatar del servidor");
      return;
    }

    try {
      console.log("ðŸ“¥ Cargando avatar desde SERVIDOR...");
      const response = await fetch(`${API_URL}/api/avatar/${userId}`);
      const data = await response.json();

      console.log("ðŸ“¥ Respuesta del servidor:", data);

      if (data.success && data.data.avatarUrl) {
        avatarImg.src = data.data.avatarUrl;
        console.log("âœ… Avatar cargado desde el SERVIDOR");
      } else {
        console.log("â„¹ï¸ Usuario no tiene avatar guardado en el servidor");
      }
    } catch (error) {
      console.error("âŒ Error al cargar avatar desde servidor:", error);
    }
  }

  // Cargar avatar al iniciar
  cargarAvatarDesdeServidor();

  // =============================================
  // INTERCEPTAR saveAvatar si existe
  // =============================================
  const originalSaveAvatar = window.saveAvatar;

  window.saveAvatar = async function () {
    // Llamar funcion original
    if (originalSaveAvatar) {
      originalSaveAvatar();
    }

    // Esperar un momento para que la imagen se actualice
    setTimeout(async () => {
      const currentAvatarSrc = avatarImg.src;

      // Solo guardar si es una imagen base64 (no URLs externas)
      if (currentAvatarSrc && currentAvatarSrc.startsWith('data:image/')) {
        if (userId) {
          try {
            console.log("ðŸ’¾ Guardando avatar seleccionado en servidor...");

            const response = await fetch(`${API_URL}/api/avatar/${userId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                avatarData: currentAvatarSrc
              })
            });

            const data = await response.json();

            if (data.success) {
              console.log("âœ… Avatar del modal guardado en servidor");
            } else {
              console.error("âŒ Error guardando avatar:", data.message);
            }
          } catch (error) {
            console.error("âŒ Error al guardar avatar:", error);
          }
        }
      }
    }, 100);
  };
});

// =============================================
// FUNCION AUXILIAR - NOTIFICACIONES
// =============================================
function mostrarNotificacion(mensaje, tipo = "info") {
  console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
}