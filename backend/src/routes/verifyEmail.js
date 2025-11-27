// backend/src/routes/verifyEmail.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { hashToken } = require('../utils/verificationToken');

router.get('/', async (req, res) => {
  try {
    const { token, id } = req.query;
    if (!token || !id) return res.status(400).send('Faltan parámetros');

    const tokenHash = hashToken(token);
    const user = await User.findById(id);

    if (!user) return res.status(404).send('Usuario no encontrado');
    if (user.emailVerified) return res.send('Tu correo ya está verificado ✅');

    if (!user.verificationToken || !user.verificationToken.tokenHash) {
      return res.status(400).send('Token inválido');
    }

    if (user.verificationToken.tokenHash !== tokenHash) {
      return res.status(400).send('Token incorrecto o expirado');
    }

    if (user.verificationToken.expiresAt < new Date()) {
      return res.status(400).send('El enlace de verificación ha expirado');
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL}/verificacion-exitosa`);
  } catch (err) {
    console.error('Error en verificación:', err);
    res.status(500).send('Error interno del servidor');
  }
});

module.exports = router;
