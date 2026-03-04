// backend/src/routes/verifyEmail.js
const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../config/AppError');
const User = require('../models/User');
const { hashToken } = require('../utils/verificationToken');

router.get('/', catchAsync(async (req, res) => {
  const { token, id } = req.query;
  
  if (!token || !id) {
    throw new AppError('Faltan parámetros', 400);
  }

  const tokenHash = hashToken(token);
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  
  if (user.emailVerified) {
    return res.send('Tu correo ya está verificado ✅');
  }

  if (!user.verificationToken || !user.verificationToken.tokenHash) {
    throw new AppError('Token inválido', 400);
  }

  if (user.verificationToken.tokenHash !== tokenHash) {
    throw new AppError('Token incorrecto o expirado', 400);
  }

  if (user.verificationToken.expiresAt < new Date()) {
    throw new AppError('El enlace de verificación ha expirado', 400);
  }

  user.emailVerified = true;
  user.verificationToken = undefined;
  await user.save();

  return res.redirect(`${process.env.FRONTEND_URL}/verificacion-exitosa`);
}));

module.exports = router;
