// =============================================
// RUTAS DE AVATAR - FITAIID
// =============================================

const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../config/AppError');
const User = require('../models/User');

// =============================================
// 📸 SUBIR/ACTUALIZAR AVATAR
// =============================================
router.post('/avatar/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { avatarData } = req.body;

  console.log('📸 Recibiendo solicitud de avatar para usuario:', userId);

  if (!avatarData) {
    throw new AppError('No se proporciono imagen', 400);
  }

  if (!avatarData.startsWith('data:image/')) {
    throw new AppError('Formato de imagen invalido', 400);
  }

  const sizeInBytes = (avatarData.length * 3) / 4;
  const maxSize = 5 * 1024 * 1024;

  if (sizeInBytes > maxSize) {
    throw new AppError('La imagen es muy grande. Maximo 5MB', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: avatarData },
    { new: true }
  );

  if (!updatedUser) {
    console.log('❌ Usuario no encontrado:', userId);
    throw new AppError('Usuario no encontrado', 404);
  }

  console.log('✅ Avatar actualizado para usuario:', userId);

  res.json({
    success: true,
    message: 'Avatar actualizado exitosamente',
    data: {
      avatarUrl: updatedUser.avatarUrl
    }
  });
}));

// =============================================
// 🖼️ OBTENER AVATAR DEL USUARIO
// =============================================
router.get('/avatar/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;

  console.log('🖼️ Obteniendo avatar para usuario:', userId);

  const user = await User.findById(userId).select('avatarUrl');

  if (!user) {
    console.log('❌ Usuario no encontrado:', userId);
    throw new AppError('Usuario no encontrado', 404);
  }

  console.log('✅ Avatar encontrado:', user.avatarUrl ? 'SI' : 'NO');

  res.json({
    success: true,
    data: {
      avatarUrl: user.avatarUrl || null
    }
  });
}));

// =============================================
// 🗑️ ELIMINAR AVATAR
// =============================================
router.delete('/avatar/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: null },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError('Usuario no encontrado', 404);
  }

  console.log('🗑️ Avatar eliminado para usuario:', userId);

  res.json({
    success: true,
    message: 'Avatar eliminado exitosamente'
  });
}));

module.exports = router;
