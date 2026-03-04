const mongoose = require('mongoose');

const workoutProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number, // minutos
    default: 0
  },
  calories: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  'WorkoutProgress',
  workoutProgressSchema,
  'workoutprogresses' // 
);
