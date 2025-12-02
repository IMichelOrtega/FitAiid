// =============================================
// MODELO USUARIO - FITAIID FITNESS PLATFORM
// =============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('👤 Iniciando creación del modelo User con seguridad avanzada...');

// =============================================
// ESQUEMA DEL USUARIO
// =============================================

const userSchema = new mongoose.Schema({
    
    // =============================================
    // INFORMACIÓN PERSONAL BÁSICA
    // =============================================
    
    firstName: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres'],
        validate: {
            validator: function(name) {
                const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
                return nameRegex.test(name);
            },
            message: 'El nombre solo puede contener letras y espacios'
        }
    },
    
    lastName: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        trim: true,
        minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
        maxlength: [50, 'El apellido no puede tener más de 50 caracteres'],
        validate: {
            validator: function(name) {
                const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
                return nameRegex.test(name);
            },
            message: 'El apellido solo puede contener letras y espacios'
        }
    },

    // =============================================
    // INFORMACIÓN DE CONTACTO
    // =============================================
    
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function(phone) {
                if (!phone) return true;
                const phoneRegex = /^(\+57)?[3][0-9]{9}$/;
                return phoneRegex.test(phone.replace(/\s/g, ''));
            },
            message: 'Por favor ingresa un número de teléfono colombiano válido (ej: +57 3123456789)'
        }
    },

    // =============================================
    // EMAIL - IDENTIFICADOR ÚNICO Y CRÍTICO
    // =============================================
    
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },
            message: 'Por favor ingresa un email válido'
        },
        index: true
    },

    // =============================================
    // CONTRASEÑA - SEGURIDAD CRÍTICA
    // =============================================
    
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        validate: {
            validator: function(password) {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
                return passwordRegex.test(password);
            },
            message: 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula y número'
        },
        select: false
    },

    // =============================================
    // VERIFICACIÓN DE EMAIL
    // =============================================
    
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    verificationToken: {
        type: String,
        default: null
    },
    
    verificationTokenExpires: {
        type: Date,
        default: null
    },
    
    verificationCode: {
        type: String,
        select: false
    },
    
    verificationCodeExpires: {
        type: Date,
        select: false
    },

    // =============================================
    // ROLES Y PERMISOS
    // =============================================
    
    role: {
        type: String,
        enum: {
            values: ['customer', 'admin', 'moderator'],
            message: '{VALUE} no es un rol válido'
        },
        default: 'customer',
        index: true
    },
    
    // =============================================
    // ESTADO DE LA CUENTA
    // =============================================
    
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // =============================================
    // RECUPERACIÓN DE CONTRASEÑA
    // =============================================
    
    resetPasswordCode: {
        type: String,
        select: false
    },
    
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    
    // =============================================
    // INFORMACIÓN DE ACTIVIDAD Y SESIONES
    // =============================================
    
    lastLogin: {
        type: Date,
        default: Date.now
    },
    
    loginAttempts: {
        type: Number,
        default: 0,
        max: [10, 'Demasiados intentos de login']
    },
    
    lockUntil: {
        type: Date
    },

    // =============================================
    // INFORMACIÓN COMERCIAL E HISTORIAL
    // =============================================
    
    totalOrders: {
        type: Number,
        default: 0,
        min: [0, 'El total de órdenes no puede ser negativo']
    },
    
    totalSpent: {
        type: Number,
        default: 0,
        min: [0, 'El total gastado no puede ser negativo']
    },
    
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: [0, 'Los puntos de lealtad no pueden ser negativos']
    },

    // =============================================
    // 🏋️ PERFIL FITNESS - DATOS DEL CUESTIONARIO
    // =============================================
    
    fitnessProfile: {
        // Pregunta 1: Género
        gender: {
            type: String,
            enum: ['hombre', 'mujer', null],
            default: null
        },
        
        // Pregunta 2: Edad
        age: {
            type: Number,
            min: [14, 'La edad mínima es 14 años'],
            max: [100, 'La edad máxima es 100 años'],
            default: null
        },
        
        // Pregunta 3: Altura en cm
        height: {
            type: Number,
            min: [100, 'La altura mínima es 100 cm'],
            max: [250, 'La altura máxima es 250 cm'],
            default: null
        },
        
        // Pregunta 4: Peso en kg
        weight: {
            type: Number,
            min: [30, 'El peso mínimo es 30 kg'],
            max: [300, 'El peso máximo es 300 kg'],
            default: null
        },
        
        // Pregunta 5: Nivel de experiencia
        fitnessLevel: {
            type: String,
            enum: ['principiante', 'intermedio', 'avanzado', null],
            default: null,
            index: true
        },
        
        // Pregunta 6: Objetivo principal
        mainGoal: {
            type: String,
            enum: ['tonificar', 'ganar masa muscular', 'bajar de peso', null],
            default: null,
            index: true
        },
        
        // Pregunta 7: Lesión o condición médica
        medicalConditions: {
            type: String,
            default: '',
            maxlength: [500, 'Máximo 500 caracteres']
        },
        
        // Pregunta 8: Lugar de entrenamiento
        trainingLocation: {
            type: String,
            enum: ['casa', 'gym', null],
            default: null
        },
        
        // Pregunta 9: Días por semana
        trainingDaysPerWeek: {
            type: Number,
            min: [1, 'Mínimo 1 día'],
            max: [7, 'Máximo 7 días'],
            default: null
        },
        
        // Pregunta 10: Tiempo por sesión
        sessionDuration: {
            type: String,
            enum: ['30 min', '45 min', '1 hr', '+1 hr', null],
            default: null
        },
        
        // Control de cuestionario
        questionnaireCompleted: {
            type: Boolean,
            default: false,
            index: true
        },
        
        questionnaireCompletedAt: {
            type: Date,
            default: null
        }
    }
    
}, {
    // =============================================
    // OPCIONES DEL SCHEMA
    // =============================================
    
    timestamps: true,
    
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password;
            delete ret.resetPasswordCode;
            delete ret.resetPasswordExpire;
            delete ret.loginAttempts;
            delete ret.lockUntil;
            return ret;
        }
    },
    
    toObject: { 
        virtuals: true 
    }
});

// =============================================
// CAMPOS VIRTUALES - PROPIEDADES CALCULADAS
// =============================================

userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

userSchema.virtual('fullAddress').get(function() {
    if (!this.address || !this.address.street) return '';
    
    const parts = [];
    if (this.address.street) parts.push(this.address.street);
    if (this.address.city) parts.push(this.address.city);
    if (this.address.state) parts.push(this.address.state);
    if (this.address.zipCode) parts.push(`CP ${this.address.zipCode}`);
    if (this.address.country && this.address.country !== 'Colombia') {
        parts.push(this.address.country);
    }
    
    return parts.join(', ');
});

userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('customerLevel').get(function() {
    if (this.totalSpent >= 5000000) return 'platinum';
    if (this.totalSpent >= 2000000) return 'gold';
    if (this.totalSpent >= 500000) return 'silver';
    return 'bronze';
});

userSchema.virtual('formattedTotalSpent').get(function() {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(this.totalSpent);
});

// =============================================
// 🏋️ VIRTUALES FITNESS - IMC Y CATEGORÍA
// =============================================

userSchema.virtual('bmi').get(function() {
    if (!this.fitnessProfile?.weight || !this.fitnessProfile?.height) {
        return null;
    }
    
    const heightInMeters = this.fitnessProfile.height / 100;
    const bmi = this.fitnessProfile.weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
});

userSchema.virtual('bmiCategory').get(function() {
    const bmi = this.bmi;
    if (!bmi) return null;
    
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
});

// =============================================
// MIDDLEWARE PARA ENCRIPTACIÓN DE CONTRASEÑAS
// =============================================

userSchema.pre('save', async function(next) {
    console.log(`🔍 Procesando usuario antes de guardar: ${this.email}`);
    
    if (!this.isModified('password')) {
        console.log(`💤 Usuario ${this.email}: contraseña no modificada, saltando encriptación`);
        return next();
    }
    
    try {
        console.log(`🔐 Encriptando contraseña para usuario: ${this.email}`);
        
        const saltRounds = 12;
        const originalLength = this.password.length;
        
        this.password = await bcrypt.hash(this.password, saltRounds);
        
        console.log(`✅ Contraseña encriptada exitosamente:`);
        console.log(`   📧 Email: ${this.email}`);
        console.log(`   📏 Longitud original: ${originalLength} caracteres`);
        console.log(`   🔒 Longitud encriptada: ${this.password.length} caracteres`);
        
        next();
        
    } catch (error) {
        console.error(`❌ Error encriptando contraseña para ${this.email}:`);
        console.error(`   🐛 Error: ${error.message}`);
        next(error);
    }
});

userSchema.post('save', function(doc) {
    console.log(`✅ Usuario guardado exitosamente:`);
    console.log(`   👤 Nombre: ${doc.fullName}`);
    console.log(`   📧 Email: ${doc.email}`);
    console.log(`   👑 Rol: ${doc.role}`);
    console.log(`   🆔 ID: ${doc._id}`);
});

userSchema.pre('remove', function(next) {
    console.log(`🗑️ Preparando eliminación de usuario: ${this.email}`);
    next();
});

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log(`🔍 Verificando contraseña para usuario: ${this.email}`);
        
        const startTime = Date.now();
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        const endTime = Date.now();
        
        if (isMatch) {
            console.log(`✅ Contraseña CORRECTA para: ${this.email}`);
        } else {
            console.log(`❌ Contraseña INCORRECTA para: ${this.email}`);
        }
        
        console.log(`   ⏱️ Tiempo de verificación: ${endTime - startTime}ms`);
        return isMatch;
        
    } catch (error) {
        console.error(`❌ Error verificando contraseña para ${this.email}:`);
        throw new Error('Error interno al verificar contraseña');
    }
};

userSchema.methods.incrementLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
        console.log(`🔒 Cuenta bloqueada temporalmente: ${this.email}`);
    }
    
    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { 
            loginAttempts: 1, 
            lockUntil: 1 
        },
        $set: { 
            lastLogin: new Date() 
        }
    });
};

userSchema.methods.addPurchase = function(orderTotal) {
    this.totalOrders += 1;
    this.totalSpent += orderTotal;
    
    const pointsEarned = Math.floor(orderTotal / 1000);
    this.loyaltyPoints += pointsEarned;
    
    console.log(`💰 Compra registrada para ${this.email}`);
    return this.save();
};

userSchema.methods.addToWishlist = function(productId) {
    if (!this.wishlist.includes(productId)) {
        this.wishlist.push(productId);
        console.log(`❤️ Producto agregado a wishlist de ${this.email}`);
        return this.save();
    }
    return Promise.resolve(this);
};

userSchema.methods.removeFromWishlist = function(productId) {
    this.wishlist = this.wishlist.filter(id => !id.equals(productId));
    console.log(`💔 Producto removido de wishlist de ${this.email}`);
    return this.save();
};

userSchema.methods.generateAuthToken = function() {
    console.log(`🎫 Generando token JWT para usuario: ${this.email}`);
    
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role
    };
    
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
    
    console.log('✅ Token JWT generado exitosamente');
    return token;
};

userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        phone: this.phone,
        isActive: this.isActive,
        isEmailVerified: this.isEmailVerified,
        customerLevel: this.customerLevel,
        totalOrders: this.totalOrders,
        totalSpent: this.totalSpent,
        formattedTotalSpent: this.formattedTotalSpent,
        loyaltyPoints: this.loyaltyPoints,
        createdAt: this.createdAt,
        fitnessProfile: this.fitnessProfile || { // ⭐ AGREGAR FITNESS PROFILE
            questionnaireCompleted: false
        },
        bmi: this.bmi, // ⭐ AGREGAR IMC
        bmiCategory: this.bmiCategory // ⭐ AGREGAR CATEGORÍA IMC
    };
};
// =============================================
// 🏋️ MÉTODO FITNESS: Contexto para el chatbot
// =============================================

userSchema.methods.getFitnessContext = function() {
    const profile = this.fitnessProfile;
    
    if (!profile || !profile.questionnaireCompleted) {
        return "Usuario sin perfil fitness completado";
    }
    
    return `
**PERFIL FITNESS DEL USUARIO:**
- Nombre: ${this.firstName} ${this.lastName}
- Género: ${profile.gender || 'No especificado'}
- Edad: ${profile.age || 'No especificada'} años
- Altura: ${profile.height || 'No especificada'} cm
- Peso: ${profile.weight || 'No especificado'} kg
- IMC: ${this.bmi || 'No calculado'} (${this.bmiCategory || 'N/A'})
- Nivel: ${profile.fitnessLevel || 'No especificado'}
- Objetivo: ${profile.mainGoal || 'No especificado'}
- Condiciones médicas: ${profile.medicalConditions || 'Ninguna'}
- Entrena en: ${profile.trainingLocation || 'No especificado'}
- Días por semana: ${profile.trainingDaysPerWeek || 'No especificado'}
- Duración sesión: ${profile.sessionDuration || 'No especificado'}

Usa esta información para personalizar tus recomendaciones.`;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

userSchema.statics.findByEmail = function(email) {
    console.log(`🔍 Buscando usuario por email: ${email}`);
    return this.findOne({ 
        email: email.toLowerCase() 
    }).select('+password');
};

userSchema.statics.findByCredentials = async function(email) {
    console.log(`🔐 Buscando usuario para login: ${email}`);
    return this.findOne({ 
        email: email.toLowerCase() 
    }).select('+password');
};

userSchema.statics.getActiveUsers = function(limit = 50) {
    console.log(`👥 Obteniendo usuarios activos (límite: ${limit})...`);
    return this.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-password');
};

userSchema.statics.getUsersByRole = function(role) {
    console.log(`👑 Obteniendo usuarios con rol: ${role}...`);
    return this.find({ role: role, isActive: true })
        .sort({ createdAt: -1 });
};

userSchema.statics.getUserStats = function() {
    console.log('📈 Calculando estadísticas de usuarios...');
    
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
                customerUsers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
                totalOrders: { $sum: '$totalOrders' },
                totalSpent: { $sum: '$totalSpent' },
                averageSpent: { $avg: '$totalSpent' },
                totalLoyaltyPoints: { $sum: '$loyaltyPoints' }
            }
        }
    ]);
};

userSchema.statics.getUsersByLevel = function(level) {
    const spentRanges = {
        'bronze': { min: 0, max: 499999 },
        'silver': { min: 500000, max: 1999999 },
        'gold': { min: 2000000, max: 4999999 },
        'platinum': { min: 5000000, max: Infinity }
    };
    
    const range = spentRanges[level];
    if (!range) {
        throw new Error('Nivel de cliente inválido');
    }
    
    return this.find({
        totalSpent: { 
            $gte: range.min, 
            $lt: range.max === Infinity ? Number.MAX_SAFE_INTEGER : range.max 
        },
        isActive: true
    }).sort({ totalSpent: -1 });
};

// =============================================
// 🏋️ MÉTODO ESTÁTICO FITNESS: Estadísticas
// =============================================

userSchema.statics.getFitnessStats = async function() {
    return this.aggregate([
        {
            $match: { 
                'fitnessProfile.questionnaireCompleted': true 
            }
        },
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                principiantes: { 
                    $sum: { 
                        $cond: [{ $eq: ['$fitnessProfile.fitnessLevel', 'principiante'] }, 1, 0] 
                    } 
                },
                intermedios: { 
                    $sum: { 
                        $cond: [{ $eq: ['$fitnessProfile.fitnessLevel', 'intermedio'] }, 1, 0] 
                    } 
                },
                avanzados: { 
                    $sum: { 
                        $cond: [{ $eq: ['$fitnessProfile.fitnessLevel', 'avanzado'] }, 1, 0] 
                    } 
                }
            }
        }
    ]);
};

// =============================================
// CREAR Y EXPORTAR EL MODELO
// =============================================

const User = mongoose.model('User', userSchema);

console.log('✅ Modelo User creado exitosamente');
console.log('📋 Collection en MongoDB: users');
console.log('🏋️ Campos fitness integrados correctamente');

module.exports = User;