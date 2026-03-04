// =============================================
// CONTROLADOR DE RUTINAS - FITAIID
// Sistema de ciclo automático de días
// =============================================

const User = require('../models/User');
const AppError = require('../config/AppError');

/**
 * Obtener el día actual de entrenamiento del usuario
 * GET /api/rutina/:userId/dia-actual
 */
exports.obtenerDiaActual = async (req, res) => {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    
    const diaActual = user.getDiaActual();
    
    if (!diaActual) {
        throw new AppError('No hay rutina asignada. Genera una rutina primero.', 404);
    }
    
    const progreso = user.getProgresoRutina();
    
    res.json({
        success: true,
        data: {
            diaActual,
            progreso
        }
    });
};

/**
 * Completar el día actual y avanzar al siguiente
 * POST /api/rutina/:userId/completar-dia
 */
exports.completarDia = async (req, res) => {
    const { userId } = req.params;
    const { duracion, calorias, ejerciciosCompletados } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    
    const diaActual = user.getDiaActual();
    
    if (!diaActual) {
        throw new AppError('No hay rutina asignada', 404);
    }
    
    // Verificar que no esté ya completado
    if (diaActual.completado) {
        const progreso = user.getProgresoRutina();
        throw new AppError('Este día ya fue completado', 400);
    }
    
    // Registrar en estadísticas (usando el método existente)
    if (duracion && calorias) {
        const workoutData = {
            nombre: diaActual.nombre || `Entrenamiento ${diaActual.nombre}`,
            enfoque: diaActual.enfoque || 'General',
            duracionTotal: duracion,
            caloriasEstimadas: calorias,
            ejerciciosCompletados: ejerciciosCompletados || diaActual.ejercicios?.length || 0,
            ejercicios: diaActual.ejercicios || []
        };
        
        await user.registrarEntrenamiento(workoutData);
    }
    
    // Completar día y avanzar al siguiente (CON REINICIO AUTOMÁTICO)
    const resultado = await user.completarDiaYAvanzar();
    
    res.json({
        success: true,
        message: resultado.mensaje,
        data: {
            ...resultado,
            estadisticas: user.obtenerEstadisticas()
        }
    });
};

/**
 * Obtener progreso general de la rutina
 * GET /api/rutina/:userId/progreso
 */
exports.obtenerProgreso = async (req, res) => {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    
    const progreso = user.getProgresoRutina();
    
    if (!progreso) {
        throw new AppError('No hay rutina asignada', 404);
    }
    
    res.json({
        success: true,
        data: progreso
    });
};

/**
 * Reiniciar rutina manualmente al primer día
 * POST /api/rutina/:userId/reiniciar
 */
exports.reiniciarRutina = async (req, res) => {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    
    const resultado = await user.reiniciarRutina();
    
    res.json({
        success: true,
        message: resultado.mensaje,
        data: resultado.diaActual
    });
};

/**
 * Guardar rutina semanal generada (YA EXISTENTE - MODIFICADO)
 * POST /api/guardar-rutina
 */
exports.guardarRutina = async (req, res) => {
    const { userId, rutina } = req.body;
    
    if (!userId || !rutina) {
        throw new AppError('Faltan datos: userId y rutina son requeridos', 400);
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    
    // Actualizar rutina semanal
    user.rutinaSemanal = rutina.dias || rutina;
    
    // INICIALIZAR el sistema de ciclo automático
    await user.inicializarRutina();
    
    const primerDia = user.getDiaActual();
    
    res.json({
        success: true,
        message: 'Rutina guardada exitosamente',
        data: {
            totalDias: user.rutinaSemanal.length,
            primerDia: primerDia.nombre,
            cicloActual: user.cicloActual
        }
    });
};

/**
 * Saltar al siguiente día manualmente (sin completar el actual)
 * POST /api/rutina/:userId/siguiente-dia
 */
exports.saltarSiguienteDia = async (req, res) => {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }
    
    if (!user.rutinaSemanal || user.rutinaSemanal.length === 0) {
        throw new AppError('No hay rutina asignada', 404);
    }
    
    const totalDias = user.rutinaSemanal.length;
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
    // Avanzar sin marcar como completado
    const siguienteIndex = (user.diaActualIndex + 1) % totalDias;
    user.diaActualIndex = siguienteIndex;
    
    await user.save();
    
    res.json({
        success: true,
        message: 'Avanzado al siguiente día',
        data: {
            diaActual: diasSemana[siguienteIndex],
            index: siguienteIndex
        }
    });
};

module.exports = exports;