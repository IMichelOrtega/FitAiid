// =============================================
// MODELO USUARIO - FITAIID 
// =============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('👤 Iniciando creación del modelo User con seguridad avanzada...');

// =============================================
// ESQUEMA DE ENTRENAMIENTO COMPLETADO
// =============================================
const completedWorkoutSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    nombre: {
        type: String,
        required: true
    },
    enfoque: {
        type: String,
        required: true
    },
    duracionTotal: {
        type: Number,
        required: true,
        min: 0
    },
    caloriasEstimadas: {
        type: Number,
        default: 0
    },
    ejerciciosCompletados: {
        type: Number,
        required: false,
        min: 0
    },
    ejerciciosDetalles: [{
        nombre: String,
        series: Number,
        repeticiones: String,
        completado: Boolean
    }]
}, { _id: true, timestamps: true });

// =============================================
// LOGROS
// =============================================
const achievementSchema = new mongoose.Schema({
    achievementId: {
        type: String,
        required: true
    },
    nombre: String,
    unlockedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// =============================================
// ESQUEMA PRINCIPAL DEL USUARIO
// =============================================
const userSchema = new mongoose.Schema({
    
    // =============================================
    // INFORMACIÓN PERSONAL
    // =============================================
    
    firstName: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres'],
        validate: {
            validator: function(name) {
                const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/;
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
                const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/;
                return nameRegex.test(name);
            },
            message: 'El apellido solo puede contener letras y espacios'
        }
    },

    phone: {
    type: String,
    trim: true,
    validate: {
        validator: function(phone) {
            if (!phone) return true;
            return /^\d{10}$/.test(phone.replace(/\s/g, ''));
        },
        message: 'El número de teléfono debe tener exactamente 10 dígitos'
    }
},

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
    // VERIFICACIÓN CORREO ELECTRÓNICO
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
    // ROL
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
    // 📸 AVATAR DEL USUARIO
    // =============================================
    
    avatarUrl: {
        type: String,
        default: null,
        validate: {
            validator: function(url) {
                if (!url) return true;
                return url.startsWith('data:image/') || url.startsWith('http');
            },
            message: 'URL de avatar inválida'
        }
    },

    // =============================================
    // PERFIL FITNESS - DATOS DEL CUESTIONARIO
    // =============================================
    
    fitnessProfile: {
        gender: {
            type: String,
            enum: ['hombre', 'mujer', null],
            default: null
        },
        age: {
            type: Number,
            min: [14, 'La edad mínima es 14 años'],
            max: [100, 'La edad máxima es 100 años'],
            default: null
        },
        height: {
            type: Number,
            min: [100, 'La altura mínima es 100 cm'],
            max: [250, 'La altura máxima es 250 cm'],
            default: null
        },
        weight: {
            type: Number,
            min: [30, 'El peso mínimo es 30 kg'],
            max: [300, 'El peso máximo es 300 kg'],
            default: null
        },
        fitnessLevel: {
            type: String,
            enum: ['principiante', 'intermedio', 'avanzado', null],
            default: null,
            index: true
        },
        mainGoal: {
            type: String,
            enum: ['tonificar', 'ganar masa muscular', 'bajar de peso', null],
            default: null,
            index: true
        },
        medicalConditions: {
            type: String,
            default: '',
            maxlength: [500, 'Máximo 500 caracteres']
        },
        trainingLocation: {
            type: String,
            enum: ['casa', 'gym', null],
            default: null
        },
        trainingDaysPerWeek: {
            type: Number,
            min: [1, 'Mínimo 1 día'],
            max: [7, 'Máximo 7 días'],
            default: null
        },
        sessionDuration: {
            type: String,
            enum: ['30 min', '45 min', '1 hr', '+1 hr', null],
            default: null
        },
        questionnaireCompleted: {
            type: Boolean,
            default: false,
            index: true
        },
        questionnaireCompletedAt: {
            type: Date,
            default: null
        }
    },
    rutinaSemanal: [{
        nombre: {
            type: String,
            trim: true
        },
        esDescanso: {
            type: Boolean,
            default: false
        },
        enfoque: {
            type: String,
            trim: true
        },
        duracion: {
            type: String
        },
        duracionTotal: {
            type: Number
        },
        caloriasEstimadas: {
            type: Number,
            default: 0
        },
        mensaje: {
            type: String
        },
        ejercicios: [{
            nombre: {
                type: String,
                required: true
            },
            series: {
                type: Number,
                default: 3
            },
            repeticiones: {
                type: String
            },
            descanso: {
                type: String
            },
            musculoObjetivo: {
                type: String
            },
            tecnica: {
                type: String
            },
            completado: {
                type: Boolean,
                default: false
            }
        }],
        completado: {
            type: Boolean,
            default: false
        },
        fechaCompletado: {
            type: Date,
            default: null
        }
    }],





    // =============================================
    // 🔄 SISTEMA DE CICLO AUTOMÁTICO DE DÍAS
    // =============================================
    diaActualIndex: {
        type: Number,
        default: 0,
        min: 0
    },
    
    cicloActual: {
        type: Number,
        default: 1,
        min: 1
    },
    
    fechaInicioRutina: {
        type: Date,
        default: null
    },
    
    ultimoDiaCompletado: {
        type: Date,
        default: null
    },
    
    diasCompletadosEsteCiclo: {
        type: Number,
        default: 0,
        min: 0
    },

    // =============================================
    // 📊 SISTEMA DE ESTADÍSTICAS Y SEGUIMIENTO (NUEVO)
    // =============================================
    
    fitnessStats: {
        type: {
            workoutHistory: [completedWorkoutSchema],
            
            totalWorkouts: {
                type: Number,
                default: 0,
                min: 0
            },
            totalExercises: {
                type: Number,
                default: 0,
                min: 0
            },
            totalMinutes: {
                type: Number,
                default: 0,
                min: 0
            },
            totalCalories: {
                type: Number,
                default: 0,
                min: 0
            },
            
            currentStreak: {
                type: Number,
                default: 0,
                min: 0
            },
            maxStreak: {
                type: Number,
                default: 0,
                min: 0
            },
            lastWorkoutDate: {
                type: Date,
                default: null
            },
            
            achievements: [achievementSchema],
            
            lastStatsUpdate: {
                type: Date,
                default: Date.now
            }
        },
        default: {
            workoutHistory: [],
            totalWorkouts: 0,
            totalExercises: 0,
            totalMinutes: 0,
            totalCalories: 0,
            currentStreak: 0,
            maxStreak: 0,
            lastWorkoutDate: null,
            achievements: [],
            lastStatsUpdate: Date.now()
        }
    },
    // =============================================
    // 🔔 NOTIFICACIONES PUSH
    // =============================================
    
    notificationsEnabled: {
        type: Boolean,
        default: false
    },
    // =============================================
    // 💾 RUTINA ACTUAL Y GUARDADA
    // =============================================
    
    currentRoutine: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    savedRoutine: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    routineHistory: [{
        rutina: mongoose.Schema.Types.Mixed,
        generatedAt: {
            type: Date,
            default: Date.now
        },
        savedAt: Date
    }]
},
{
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
    
}
);

// =============================================
// CAMPOS VIRTUALES - PROPIEDADES CALCULADAS
// =============================================

userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

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
// MIDDLEWARE PARA ENCRIPTACIÓN DE CONTRASEÑAS
// =============================================

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        console.log(`🔒 Contraseña encriptada para: ${this.email}`);
        next();
    } catch (error) {
        console.error(`❌ Error encriptando contraseña:`, error.message);
        next(error);
    }
});

userSchema.post('save', function(doc) {
    console.log(`✅ Usuario guardado: ${doc.email}`);
});

// =============================================
// MÉTODOS DE INSTANCIA (TODOS ORIGINALES + NUEVOS)
// =============================================

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error al verificar contraseña');
    }
};

userSchema.methods.generateAuthToken = function() {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role
    };
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
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
        return this.save();
    }
    return Promise.resolve(this);
};

userSchema.methods.removeFromWishlist = function(productId) {
    this.wishlist = this.wishlist.filter(id => !id.equals(productId));
    return this.save();
};

// =============================================
// 🏋️ MÉTODOS FITNESS NUEVOS
// =============================================

userSchema.methods.registrarEntrenamiento = async function(workoutData) {
    console.log(`📝 Registrando entrenamiento para ${this.email}`);
    
    const workout = {
        date: new Date(),
        nombre: workoutData.nombre,
        enfoque: workoutData.enfoque,
        duracionTotal: workoutData.duracionTotal,
        caloriasEstimadas: workoutData.caloriasEstimadas || 0,
        ejerciciosCompletados: workoutData.ejercicios?.length || 0,
        ejerciciosDetalles: workoutData.ejercicios || []
    };
    
    this.fitnessStats.workoutHistory.push(workout);
    
    this.fitnessStats.totalWorkouts += 1;
    this.fitnessStats.totalExercises += workout.ejerciciosCompletados;
    this.fitnessStats.totalMinutes += workout.duracionTotal;
    this.fitnessStats.totalCalories += workout.caloriasEstimadas;
    this.fitnessStats.lastWorkoutDate = workout.date;
    this.fitnessStats.lastStatsUpdate = new Date();
    
    this.calcularRacha();
    this.verificarLogros();
    
    await this.save();
    
    console.log(`✅ Entrenamiento registrado: ${workout.nombre}`);
    console.log(`   📊 Total: ${this.fitnessStats.totalWorkouts} entrenamientos`);
    console.log(`   🔥 Racha: ${this.fitnessStats.currentStreak} días`);
    
    return workout;
};

userSchema.methods.calcularRacha = function() {
    const workouts = this.fitnessStats.workoutHistory;
    
    if (workouts.length === 0) {
        this.fitnessStats.currentStreak = 0;
        this.fitnessStats.maxStreak = 0;
        return;
    }
    
    const sortedWorkouts = workouts
        .map(w => new Date(w.date))
        .sort((a, b) => b - a);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWorkout = new Date(sortedWorkouts[0]);
    lastWorkout.setHours(0, 0, 0, 0);
    
    const daysSinceLastWorkout = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastWorkout <= 1) {
        let currentStreak = 1;
        
        for (let i = 1; i < sortedWorkouts.length; i++) {
            const currentDate = new Date(sortedWorkouts[i]);
            currentDate.setHours(0, 0, 0, 0);
            
            const prevDate = new Date(sortedWorkouts[i - 1]);
            prevDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                currentStreak++;
            } else if (daysDiff === 0) {
                continue;
            } else {
                break;
            }
        }
        
        this.fitnessStats.currentStreak = currentStreak;
        this.fitnessStats.maxStreak = Math.max(
            this.fitnessStats.maxStreak, 
            currentStreak
        );
    } else {
        this.fitnessStats.currentStreak = 0;
    }
};

userSchema.methods.verificarLogros = function() {
    const stats = this.fitnessStats;
    const logros = [
        {
            id: 'first_workout',
            nombre: 'Primera Rutina',
            condicion: stats.totalWorkouts >= 1
        },
        {
            id: 'week_streak',
            nombre: 'Racha de 7 días',
            condicion: stats.currentStreak >= 7
        },
        {
            id: 'ten_workouts',
            nombre: 'Dedicación',
            condicion: stats.totalWorkouts >= 10
        },
        {
            id: 'fifty_workouts',
            nombre: 'Guerrero',
            condicion: stats.totalWorkouts >= 50
        },
        {
            id: 'month_streak',
            nombre: 'Leyenda',
            condicion: stats.currentStreak >= 30
        },
        {
            id: 'hundred_exercises',
            nombre: 'Incansable',
            condicion: stats.totalExercises >= 100
        }
    ];
    
    logros.forEach(logro => {
        if (logro.condicion) {
            const yaDesbloqueado = stats.achievements.some(
                a => a.achievementId === logro.id
            );
            
            if (!yaDesbloqueado) {
                stats.achievements.push({
                    achievementId: logro.id,
                    nombre: logro.nombre,
                    unlockedAt: new Date()
                });
                console.log(`🏆 ¡Logro desbloqueado! ${logro.nombre}`);
            }
        }
    });
};

userSchema.methods.obtenerEstadisticas = function() {
    return {
        totalWorkouts: this.fitnessStats.totalWorkouts,
        totalExercises: this.fitnessStats.totalExercises,
        totalMinutes: this.fitnessStats.totalMinutes,
        totalHours: (this.fitnessStats.totalMinutes / 60).toFixed(1),
        totalCalories: this.fitnessStats.totalCalories,
        currentStreak: this.fitnessStats.currentStreak,
        maxStreak: this.fitnessStats.maxStreak,
        lastWorkoutDate: this.fitnessStats.lastWorkoutDate,
        achievements: this.fitnessStats.achievements,
        workoutHistory: this.fitnessStats.workoutHistory.slice(-30)
    };
};

userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
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
        fitnessProfile: this.fitnessProfile || {
            questionnaireCompleted: false
        },
        bmi: this.bmi,
        bmiCategory: this.bmiCategory,
        fitnessStats: this.obtenerEstadisticas()
    };
};

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
    return this.findOne({ 
        email: email.toLowerCase() 
    }).select('+password');
};

userSchema.statics.findByCredentials = async function(email) {
    return this.findOne({ 
        email: email.toLowerCase() 
    }).select('+password');
};

userSchema.statics.getActiveUsers = function(limit = 50) {
    return this.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-password');
};

userSchema.statics.getUsersByRole = function(role) {
    return this.find({ role: role, isActive: true })
        .sort({ createdAt: -1 });
};

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
// MÉTODOS PARA GESTIÓN DEL CICLO DE ENTRENAMIENTO
// =============================================

userSchema.methods.getDiaActual = function() {
    if (!this.rutinaSemanal || this.rutinaSemanal.length === 0) {
        return null;
    }
    
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const diaData = this.rutinaSemanal[this.diaActualIndex];
    
    return {
        indice: this.diaActualIndex,
        nombre: diasSemana[this.diaActualIndex],
        ...diaData
    };
};

userSchema.methods.completarDiaYAvanzar = async function() {
    if (!this.rutinaSemanal || this.rutinaSemanal.length === 0) {
        throw new Error('No hay rutina asignada');
    }

    const totalDias = this.rutinaSemanal.length;
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
    this.rutinaSemanal[this.diaActualIndex].completado = true;
    this.rutinaSemanal[this.diaActualIndex].fechaCompletado = new Date();
    this.ultimoDiaCompletado = new Date();
    this.diasCompletadosEsteCiclo += 1;
    
    // Buscar el siguiente día de ENTRENAMIENTO (saltar descansos)
    let siguienteIndex = (this.diaActualIndex + 1) % totalDias;
    while (this.rutinaSemanal[siguienteIndex]?.esDescanso && siguienteIndex !== 0) {
        siguienteIndex = (siguienteIndex + 1) % totalDias;
    }

    let nuevoCiclo = false;
    if (siguienteIndex <= this.diaActualIndex) {
        nuevoCiclo = true;
        this.cicloActual += 1;
        this.diasCompletadosEsteCiclo = 0;
        
        this.rutinaSemanal.forEach(dia => {
            dia.completado = false;
            dia.fechaCompletado = null;
        });
        
        console.log(`🔄 ¡Ciclo ${this.cicloActual - 1} completado! Iniciando ciclo ${this.cicloActual}`);
    }
    
    const indexAnterior = this.diaActualIndex;
    this.diaActualIndex = siguienteIndex;
    
    await this.save();
    
    return {
        exito: true,
        diaCompletado: diasSemana[indexAnterior],
        indexCompletado: indexAnterior,
        siguienteDia: diasSemana[siguienteIndex],
        siguienteIndex: siguienteIndex,
        nuevoCiclo: nuevoCiclo,
        cicloActual: this.cicloActual,
        mensaje: nuevoCiclo 
            ? `¡Felicidades! Has completado el ciclo ${this.cicloActual - 1}. Empiezas de nuevo con ${diasSemana[siguienteIndex]}.`
            : `Día ${diasSemana[indexAnterior]} completado. Siguiente: ${diasSemana[siguienteIndex]}.`
    };
};

userSchema.methods.reiniciarRutina = async function() {
    this.diaActualIndex = 0;
    this.diasCompletadosEsteCiclo = 0;
    
    if (this.rutinaSemanal && this.rutinaSemanal.length > 0) {
        this.rutinaSemanal.forEach(dia => {
            dia.completado = false;
            dia.fechaCompletado = null;
        });
    }
    
    await this.save();
    
    console.log('🔄 Rutina reiniciada al primer día');
    return {
        exito: true,
        mensaje: 'Rutina reiniciada al primer día',
        diaActual: this.getDiaActual()
    };
};

userSchema.methods.getProgresoRutina = function() {
    if (!this.rutinaSemanal || this.rutinaSemanal.length === 0) {
        return null;
    }
    
    const totalDias = this.rutinaSemanal.length;
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
    return {
        cicloActual: this.cicloActual,
        diaActualIndex: this.diaActualIndex,
        diaActualNombre: diasSemana[this.diaActualIndex],
        totalDias: totalDias,
        diasCompletadosEsteCiclo: this.diasCompletadosEsteCiclo,
        porcentajeCiclo: Math.round((this.diasCompletadosEsteCiclo / totalDias) * 100),
        fechaInicioRutina: this.fechaInicioRutina,
        ultimoDiaCompletado: this.ultimoDiaCompletado,
        rutinaSemanal: this.rutinaSemanal.map((dia, index) => ({
            indice: index,
            dia: diasSemana[index],
            nombre: dia.nombre,
            enfoque: dia.enfoque,
            completado: dia.completado,
            fechaCompletado: dia.fechaCompletado,
            esActual: index === this.diaActualIndex
        }))
    };
};

userSchema.methods.inicializarRutina = async function() {
    if (!this.rutinaSemanal || this.rutinaSemanal.length === 0) {
        throw new Error('No hay rutina para inicializar');
    }
    
    this.diaActualIndex = 0;
    this.cicloActual = 1;
    this.diasCompletadosEsteCiclo = 0;
    this.fechaInicioRutina = new Date();
    
    this.rutinaSemanal.forEach(dia => {
        dia.completado = false;
        dia.fechaCompletado = null;
    });
    
    await this.save();
    
    console.log('✅ Rutina inicializada correctamente');
    return {
        exito: true,
        mensaje: 'Rutina inicializada',
        primerDia: this.getDiaActual()
    };
};

// =============================================
// CREAR Y EXPORTAR EL MODELO
// =============================================

const User = mongoose.model('User', userSchema);

console.log('✅ Modelo User creado exitosamente');
console.log('📋 Collection en MongoDB: users');
console.log('🏋️ Con sistema completo de estadísticas fitness');


module.exports = User;