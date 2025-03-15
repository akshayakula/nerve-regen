const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  handDominance: {
    type: String,
    enum: ['Left', 'Right'],
    required: true
  },
  treatment: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  symptomsDate: {
    type: Date,
    required: true
  },
  handTrackingData: [{
    timestamp: Date,
    wristAngle: Number,
    landmarks: [[Number]],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  arduinoData: [{
    timestamp: Date,
    milliAmps: Number,
    volts: Number,
    hertz: Number,
    frequency: Number,
    electrode_id: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('UserData', userDataSchema); 