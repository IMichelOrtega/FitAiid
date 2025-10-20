// =============================================
// CONTROLADOR DE AUTENTICACIÓN - TECHSTORE PRO
// =============================================

const User = require('../models/User');
const logger = require('../config/logger');


console.log('🔐 Inicializando controlador de autenticación');

// =============================================
// FUNCIÓN 1: REGISTER - CREAR NUEVA CUENTA
// =============================================

/**
 * @desc    Registrar nuevo usuario
 * @route   POST /api/auth/register
 * @access  Público
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, provider } = req.body;

    console.log(`📝 Intento de registro: ${email}`);

    // VALIDACIÓN 1: Verificar campos requeridos
    if (!firstName || !lastName || !email) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos',
        details: 'firstName, lastName y email son obligatorios'
      });
    }

    // VALIDACIÓN 2: Verificar que el email no esté registrado
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
      // Generamos una contraseña temporal que cumpla la validación
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

    // CREAR USUARIO
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: finalPassword, // ahora puede venir de Google
      phone,
      role: role || 'customer',
      provider: provider || 'local'
    });

    await user.save();

    logger.audit('USER_REGISTERED', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    const token = user.generateAuthToken();
    const publicProfile = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: publicProfile
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


