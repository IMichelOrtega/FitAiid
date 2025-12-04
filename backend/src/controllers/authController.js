// =============================================
// CONTROLADOR DE AUTENTICACIÓN - TECHSTORE PRO
// =============================================
const admin = require('../config/FirebaseAdmin'); // ⬅️ AGREGAR ESTA LÍNEA
const User = require('../models/User');
const logger = require('../config/logger');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
console.log('🔐 Inicializando controlador de autenticación');
const {
  savePendingVerification,
  getPendingVerification,
  deletePendingVerification
} = require('../utils/pendingVerifications');

// =============================================
// FUNCIÓN 1: REGISTER - PREPARAR REGISTRO (NO GUARDA EN BD)
// =============================================

// =============================================
// FUNCIÓN 1: REGISTER - REGISTRO DIRECTO (PARA GOOGLE)
// =============================================

/**
 * @desc    Registrar nuevo usuario directo en MongoDB (para Google/OAuth)
 * @route   POST /api/auth/register
 * @access  Público
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, provider } = req.body;

    console.log(`📝 Registro directo para: ${email} (Provider: ${provider || 'local'})`);

    // VALIDACIÓN 1: Verificar campos requeridos
    if (!firstName || !lastName || !email) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos',
        details: 'firstName, lastName y email son obligatorios'
      });
    }

    // VALIDACIÓN 2: Verificar que el email NO esté registrado
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`❌ Email ya registrado: ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }

    // VALIDACIÓN 3: Contraseña o proveedor
    let finalPassword = password;
    if (!password && provider === 'google') {
      finalPassword = 'GoogleTemp123';
      console.log('🟢 Registro con Google: contraseña temporal aplicada');
    }

    if (!finalPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña requerida',
        message: 'Debes proporcionar una contraseña o usar proveedor OAuth'
      });
    }

    // ✅ CREAR USUARIO DIRECTAMENTE EN MONGODB
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: finalPassword,
      phone,
      role: role || 'customer',
      provider: provider || 'local',
      isEmailVerified: provider === 'google', // Google ya verifica
      isActive: true
    });

    await user.save();
    console.log(`💾 Usuario guardado en MongoDB: ${email}`);

    logger.audit('USER_REGISTERED', {
      userId: user._id,
      email: user.email,
      role: user.role,
      provider: provider || 'local',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    const token = user.generateAuthToken();
    // OBTENER PERFIL PÚBLICO
const publicProfile = user.getPublicProfile();

// ⭐ AGREGAR FITNESS PROFILE AL LOGIN
const userResponse = {
    ...publicProfile,
    fitnessProfile: user.fitnessProfile || {
        questionnaireCompleted: false
    }
};

console.log(`🎫 Token generado para: ${user.email}`);
console.log(`🏋️ Cuestionario completado: ${user.fitnessProfile?.questionnaireCompleted || false}`);

// RESPUESTA EXITOSA
res.status(200).json({
    success: true,
    message: 'Login exitoso',
    token,
    user: userResponse
});

  } catch (error) {
    console.error(`❌ Error en register: ${error.message}`);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: messages
      });
    }

    next(error);
  }
};

// =============================================
// NUEVA FUNCIÓN: REGISTER WITH CODE - REGISTRO CON CÓDIGO
// =============================================

/**
 * @desc    Registro con código de verificación (NO guarda en MongoDB hasta verificar)
 * @route   POST /api/auth/register-with-code
 * @access  Público
 */
const registerWithCode = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    console.log(`📝 Registro con código para: ${email}`);

    // VALIDACIÓN 1: Verificar campos requeridos
    if (!firstName || !lastName || !email || !password) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos',
        details: 'firstName, lastName, email y password son obligatorios'
      });
    }

    // VALIDACIÓN 2: Verificar que el email NO esté registrado
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`❌ Email ya registrado: ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }

    // GENERAR CÓDIGO DE 6 DÍGITOS
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔢 Código generado: ${verificationCode}`);

    // ✨ GUARDAR DATOS TEMPORALMENTE (NO EN MONGODB)
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password, // Se encriptará cuando se guarde en MongoDB
      phone,
      role: role || 'customer',
      provider: 'local'
    };

    savePendingVerification(email, verificationCode, userData);

    // ENVIAR EMAIL CON CÓDIGO
    try {
      await sendVerificationCodeEmail(email, firstName, verificationCode);
      console.log(`📧 Código enviado a: ${email}`);
    } catch (err) {
      console.error(`❌ Error enviando email: ${err.message}`);
      // Limpiar verificación si falla el email
      deletePendingVerification(email);
      return res.status(500).json({
        success: false,
        error: 'Error al enviar email',
        message: 'No se pudo enviar el código de verificación'
      });
    }

    // ✅ RESPUESTA EXITOSA (USUARIO AÚN NO ESTÁ EN BD)
    res.status(200).json({
      success: true,
      message: 'Código de verificación enviado a tu correo',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error(`❌ Error en registerWithCode: ${error.message}`);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: messages
      });
    }

    next(error);
  }
};

// =============================================
// FUNCIÓN 2: LOGIN - AUTENTICAR USUARIO
// =============================================

/**
 * @desc    Login de usuario
 * @route   POST /api/auth/login
 * @access  Público
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        console.log(`🔐 Intento de login: ${email}`);
        
        // VALIDACIÓN 1: Verificar campos requeridos
        if (!email || !password) {
            console.log('❌ Faltan credenciales');
            return res.status(400).json({
                success: false,
                error: 'Credenciales incompletas',
                message: 'Email y contraseña son requeridos'
            });
        }
        
        // BUSCAR USUARIO (incluye contraseña para verificar)
        const user = await User.findByCredentials(email);
        
        if (!user) {
                logger.warn('Login failed - User not found', { email, ip: req.ip });
                return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }
        
        // VERIFICAR SI LA CUENTA ESTÁ ACTIVA
        if (!user.isActive) {
            console.log(`❌ Cuenta inactiva: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada. Contacta soporte.'
            });
        }
        
        // VERIFICAR SI LA CUENTA ESTÁ BLOQUEADA
        if (user.isLocked) {
            console.log(`🔒 Cuenta bloqueada: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Cuenta bloqueada',
                message: 'Demasiados intentos fallidos. Intenta en 30 minutos.'
            });
        }
        
        // COMPARAR CONTRASEÑA
        const isPasswordCorrect = await user.comparePassword(password);
        
        if (!isPasswordCorrect) {
            logger.warn('Login failed - Invalid password', {
            email,
            ip: req.ip
            });
            
            // Incrementar intentos fallidos
            await user.incrementLoginAttempts();
            
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }
        
        // LOGIN EXITOSO
        logger.audit('USER_LOGIN', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('user-agent')
        });

        logger.info('Login exitoso', { email: user.email });
        
        // Resetear intentos fallidos
        await user.resetLoginAttempts();
        
        // GENERAR TOKEN JWT
        const token = user.generateAuthToken();
        
        // OBTENER PERFIL PÚBLICO
        const publicProfile = user.getPublicProfile();
        
        console.log(`🎫 Token generado para: ${user.email}`);
        
        // RESPUESTA EXITOSA
        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            user: publicProfile
        });
        
    } catch (error) {
        console.error(`❌ Error en login: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 3: GET PROFILE - OBTENER PERFIL
// =============================================

/**
 * @desc    Obtener perfil del usuario autenticado
 * @route   GET /api/auth/profile
 * @access  Privado (requiere token)
 */
const getProfile = async (req, res, next) => {
    try {
        // req.user será agregado por middleware de autenticación (Parte 3C3)
        // Por ahora usamos ID de query params para testing
        const userId = req.query.userId || req.user?.id;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'ID de usuario requerido',
                message: 'Proporciona userId en query params'
            });
        }
        
        console.log(`👤 Obteniendo perfil: ${userId}`);
        
        // BUSCAR USUARIO
        const user = await User.findById(userId)
            .populate('wishlist', 'name price mainImage')  // Incluir productos de wishlist
            .select('-password');  // Excluir contraseña
        
        if (!user) {
            console.log(`❌ Usuario no encontrado: ${userId}`);
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // OBTENER PERFIL PÚBLICO
        const publicProfile = user.getPublicProfile();
        
        console.log(`✅ Perfil obtenido: ${user.email}`);
        
        // RESPUESTA EXITOSA
        res.status(200).json({
            success: true,
            user: publicProfile
        });
        
    } catch (error) {
        console.error(`❌ Error en getProfile: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 4: UPDATE PROFILE - ACTUALIZAR PERFIL
// =============================================

/**
 * @desc    Actualizar perfil del usuario
 * @route   PUT /api/auth/profile
 * @access  Privado (requiere token)
 */
const updateProfile = async (req, res, next) => {
    try {
        // Por ahora usamos userId de query params para testing
        const userId = req.query.userId || req.user?.id;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'ID de usuario requerido'
            });
        }
        
        console.log(`✏️ Actualizando perfil: ${userId}`);
        
        // CAMPOS PERMITIDOS PARA ACTUALIZAR
        const allowedUpdates = [
            'firstName', 
            'lastName', 
            'phone', 
            'dateOfBirth',
            'gender',
            'avatar',
            'address'
        ];
        
        // FILTRAR SOLO CAMPOS PERMITIDOS
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        
        // VALIDAR QUE HAY ALGO QUE ACTUALIZAR
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar',
                allowedFields: allowedUpdates
            });
        }
        
        // ACTUALIZAR USUARIO
        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { 
                new: true,           // Retornar documento actualizado
                runValidators: true  // Ejecutar validaciones
            }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        console.log(`✅ Perfil actualizado: ${user.email}`);
        
        // OBTENER PERFIL PÚBLICO ACTUALIZADO
        const publicProfile = user.getPublicProfile();
        
        // RESPUESTA EXITOSA
        res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            user: publicProfile
        });
        
    } catch (error) {
        console.error(`❌ Error en updateProfile: ${error.message}`);
        
        // Errores de validación
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Error de validación',
                details: messages
            });
        }
        
        next(error);
    }
};

// =============================================
// EXPORTAR FUNCIONES
// =============================================

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};

console.log('✅ Controlador de autenticación exportado');
console.log('📋 Funciones disponibles:');
console.log('   • register - Crear nueva cuenta');
console.log('   • login - Autenticar usuario');
console.log('   • getProfile - Obtener perfil');
console.log('   • updateProfile - Actualizar perfil');

// =============================================
// LOGIN CON GOOGLE (SOLO LOGIN - NO REGISTRA)
// =============================================
/**
 * @desc    Login con Google - SOLO para usuarios ya registrados
 * @route   POST /api/auth/google
 * @access  Público
 */
const googleLogin = async (req, res) => {
  try {
    const { firstName, lastName, email, uid } = req.body;

    if (!email || !uid) {
      return res.status(400).json({ 
        success: false,
        message: "El email y UID son obligatorios" 
      });
    }

    console.log(`🔍 Login con Google para: ${email}`);

    // ✅ BUSCAR USUARIO EN MONGODB PRIMERO
    let user = await User.findOne({ email: email.toLowerCase() });

    // ❌ SI NO EXISTE EN MONGODB, RECHAZAR LOGIN
    if (!user) {
      console.log(`❌ Usuario NO registrado en MongoDB: ${email}`);
      return res.status(404).json({
        success: false,
        userNotFound: true,
        message: "Este correo no está registrado. Por favor regístrate primero."
      });
    }

    console.log(`✅ Usuario encontrado en MongoDB: ${email}`);

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta soporte.'
      });
    }

    logger.audit('USER_LOGIN_GOOGLE', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    // 🎫 GENERAR TOKEN JWT
    const token = user.generateAuthToken();
    
    // 📦 OBTENER PERFIL PÚBLICO
    const publicProfile = user.getPublicProfile();

    // ⭐ AGREGAR FITNESS PROFILE
    const userResponse = {
      ...publicProfile,
      fitnessProfile: user.fitnessProfile || {
        questionnaireCompleted: false
      }
    };

    console.log(`✅ Login con Google exitoso: ${email}`);

    // ✅ DEVOLVER TOKEN Y USUARIO
    return res.status(200).json({
      success: true,
      message: "Inicio de sesión con Google exitoso",
      token: token,
      user: userResponse
    });

  } catch (err) {
    console.error("❌ Error en googleLogin:", err);
    res.status(500).json({ 
      success: false,
      message: "Error al iniciar sesión con Google",
      error: err.message 
    });
  }
};
// =============================================
// REGISTRO CON GOOGLE (SOLO REGISTRO - CREA USUARIO)
// =============================================
/**
 * @desc    Registro con Google - Crea nuevo usuario
 * @route   POST /api/auth/google-register
 * @access  Público
 */
const googleRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, uid } = req.body;

    if (!email || !uid) {
      return res.status(400).json({ 
        success: false,
        message: "El email y UID son obligatorios" 
      });
    }

    console.log(`📝 Registro con Google para: ${email}`);

    // ✅ VERIFICAR QUE NO EXISTA YA EN MONGODB
    let existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.log(`❌ Usuario YA existe en MongoDB: ${email}`);
      return res.status(400).json({
        success: false,
        userExists: true,
        message: "Este correo ya está registrado. Por favor inicia sesión."
      });
    }

    // ✅ VERIFICAR EN FIREBASE QUE EL UID SEA VÁLIDO
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUser(uid);
      console.log(`✅ Usuario verificado en Firebase: ${email}`);
    } catch (firebaseError) {
      console.error(`❌ Error Firebase: ${firebaseError.code}`);
      return res.status(400).json({
        success: false,
        message: "Error al verificar con Google. Intenta de nuevo."
      });
    }

    // ✅ CREAR NUEVO USUARIO EN MONGODB
    const user = new User({
      firstName: firstName || firebaseUser.displayName?.split(' ')[0] || 'Usuario',
      lastName: lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'Google',
      email: email.toLowerCase(),
      password: 'GoogleTemp123',
      provider: 'google',
      isEmailVerified: true,
      isActive: true,
      role: 'customer'
    });

    await user.save();
    console.log(`💾 Usuario creado en MongoDB: ${email}`);

    logger.audit('USER_REGISTERED_GOOGLE', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    // 🎫 GENERAR TOKEN JWT
    const token = user.generateAuthToken();
    
    // 📦 OBTENER PERFIL PÚBLICO
    const publicProfile = user.getPublicProfile();

    // ⭐ AGREGAR FITNESS PROFILE
    const userResponse = {
      ...publicProfile,
      fitnessProfile: user.fitnessProfile || {
        questionnaireCompleted: false
      }
    };

    console.log(`✅ Registro con Google exitoso: ${email}`);

    // ✅ DEVOLVER TOKEN Y USUARIO
    return res.status(201).json({
      success: true,
      message: "Registro con Google exitoso",
      token: token,
      user: userResponse
    });

  } catch (err) {
    console.error("❌ Error en googleRegister:", err);
    res.status(500).json({ 
      success: false,
      message: "Error al registrarse con Google",
      error: err.message 
    });
  }
};
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com", // ej: smtp.gmail.com
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationCodeEmail = async (email, firstName, code) => {
  const mailOptions = {
    from: `"FitAiid 💪" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Código de Verificación - FitAiid",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">¡Bienvenido a FitAiid!</h2>
        <p>Hola ${firstName},</p>
        <p>Gracias por registrarte. Tu código de verificación es:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">
            ${code}
          </h1>
        </div>
        <p>Este código expira en <strong>15 minutos</strong>.</p>
        <p style="color: #999; font-size: 14px;">Si no te registraste, ignora este correo.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};


// =============================================
// RECUPERACIÓN DE CONTRASEÑA
// =============================================

/**
 * @desc    Solicitar código de recuperación
 * @route   POST /api/auth/forgot-password
 * @access  Público
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    console.log(`🔑 Solicitud de recuperación para: ${email}`);

    // ✅ BUSCAR USUARIO EN MONGODB
    const user = await User.findOne({ email: email.toLowerCase() });

    // ❌ SI NO EXISTE EN LA BASE DE DATOS
    if (!user) {
      console.log(`❌ Usuario NO encontrado en BD: ${email}`);
      return res.status(404).json({
        success: false,
        userNotFound: true,
        message: 'Este correo no está registrado. Por favor regístrate primero.'
      });
    }

    // ✅ SI EXISTE, CONTINUAR CON EL CÓDIGO
    console.log(`✅ Usuario encontrado en BD: ${email}`);

    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📱 Código generado: ${resetCode}`);

    // Hashear el código antes de guardarlo
    const resetCodeHash = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    // Guardar código hasheado y expiración (15 minutos)
    user.resetPasswordCode = resetCodeHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Configurar email
    const mailOptions = {
      from: `"FitAiid 💪" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Código de Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Código de Recuperación de Contraseña</h2>
          <p>Hola ${user.firstName},</p>
          <p>Has solicitado restablecer tu contraseña. Tu código de verificación es:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">
              ${resetCode}
            </h1>
          </div>
          <p>Este código expirará en <strong>15 minutos</strong>.</p>
          <p style="color: #999; font-size: 14px;">Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      `
    };

    // Enviar email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Código enviado a: ${email}`);

    logger.audit('PASSWORD_RESET_REQUESTED', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Código enviado al correo electrónico'
    });

  } catch (error) {
    console.error(`❌ Error en forgotPassword: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Verificar código de recuperación
 * @route   POST /api/auth/verify-code
 * @access  Público
 */
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
    }

    console.log(`🔍 Verificando código para: ${email}`);

    // Hash del código recibido
    const codeHash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    // Buscar usuario con código válido y no expirado
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordCode: codeHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log(`❌ Código inválido o expirado para: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    console.log(`✅ Código verificado para: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Código verificado correctamente'
    });

  } catch (error) {
    console.error(`❌ Error en verifyResetCode: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el código'
    });
  }
};

/**
 * @desc    Restablecer contraseña con código
 * @route   POST /api/auth/reset-password
 * @access  Público
 */
const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    // Validar datos
    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, código y contraseña son requeridos'
      });
    }

    // Validar contraseña
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    console.log(`🔐 Restableciendo contraseña para: ${email}`);

    // Hash del código recibido
    const codeHash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    // Buscar usuario con código válido y no expirado
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordCode: codeHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log(`❌ Código inválido o expirado para: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Actualizar contraseña (el middleware de User.js la encriptará automáticamente)
    user.password = password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log(`✅ Contraseña actualizada para: ${email}`);

    logger.audit('PASSWORD_RESET_COMPLETED', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error(`❌ Error en resetPassword: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña'
    });
  }
};
/**
 * @desc    Verificar código y CREAR usuario en MongoDB
 * @route   POST /api/auth/verify-registration
 * @access  Público
 */
const verifyRegistrationCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
    }

    console.log(`🔍 Verificando código para: ${email}`);

    // ✅ OBTENER DATOS TEMPORALES
    const verification = getPendingVerification(email);

    if (!verification) {
      console.log(`❌ No hay verificación pendiente o expiró para: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado. Solicita uno nuevo.'
      });
    }

    // ✅ VERIFICAR CÓDIGO
    if (verification.code !== code) {
      console.log(`❌ Código incorrecto para: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Código incorrecto'
      });
    }

    console.log(`✅ Código correcto para: ${email}`);

    // ✅ AHORA SÍ CREAR USUARIO EN MONGODB
    const user = new User({
      ...verification.userData,
      isEmailVerified: true,  // Ya verificado
      isActive: true
    });

    await user.save();
    console.log(`💾 Usuario guardado en MongoDB: ${email}`);

    // ✅ ELIMINAR VERIFICACIÓN TEMPORAL
    deletePendingVerification(email);

    // ✅ REGISTRAR AUDITORÍA
    logger.audit('USER_REGISTERED', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // ✅ GENERAR TOKEN
    const token = user.generateAuthToken();
    const publicProfile = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: '¡Registro completado exitosamente!',
      token,
      user: publicProfile
    });

  } catch (error) {
    console.error(`❌ Error en verifyRegistrationCode: ${error.message}`);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al completar el registro'
    });
  }
};
/**
 * @desc    Reenviar código de verificación
 * @route   POST /api/auth/resend-verification
 * @access  Público
 */
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    console.log(`🔄 Reenvío solicitado para: ${email}`);

    // Verificar que haya una verificación pendiente
    const verification = getPendingVerification(email);

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'No hay ningún registro pendiente para este email'
      });
    }

    // Generar NUEVO código
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Actualizar código temporal
    savePendingVerification(email, newCode, verification.userData);

    // Enviar nuevo email
    await sendVerificationCodeEmail(
      email, 
      verification.userData.firstName, 
      newCode
    );

    console.log(`📧 Nuevo código enviado a: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Nuevo código enviado a tu correo'
    });

  } catch (error) {
    console.error(`❌ Error en resendVerificationCode: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar código'
    });
  }
};


module.exports = {
    register,
    registerWithCode,
    login,
    getProfile,
    updateProfile,
    googleLogin,
    googleRegister,
    verifyRegistrationCode, 
    forgotPassword,
    resendVerificationCode,
    verifyResetCode,
    resetPassword
};
