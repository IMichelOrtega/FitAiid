const express = require("express");
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../config/AppError');
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const User = require("../models/User");

// ✅ Obtener perfil del usuario autenticado
router.get("/profile", protect, catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }
  res.json({ success: true, user });
}));

// ✅ Actualizar foto de perfil
router.post("/profile/photo", protect, upload.single("fotoPerfil"), catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError("No se subió ninguna imagen", 400);
  }

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
}));

module.exports = router;
