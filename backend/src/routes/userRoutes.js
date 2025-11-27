// backend/src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const User = require("../models/User");

// ✅ Obtener perfil del usuario autenticado
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Actualizar foto de perfil
router.post("/profile/photo", protect, upload.single("fotoPerfil"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No se subió ninguna imagen" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fotoPerfil: `/uploads/${req.file.filename}` },
      { new: true }
    );

    res.json({
      success: true,
      message: "Foto de perfil actualizada correctamente",
      user,
    });
  } catch (error) {
    console.error("Error al subir la foto:", error);
    res.status(500).json({ success: false, message: "Error al subir la foto" });
  }
});

module.exports = router;
