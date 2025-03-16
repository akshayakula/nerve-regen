// Tremor Analysis
export const analyzeTremors = (data) => {
  const gyroMagnitudes = data.map(d => 
    Math.sqrt(d.GyroX**2 + d.GyroY**2 + d.GyroZ**2)
  );
  
  return {
    frequency: calculateTremorFrequency(gyroMagnitudes),
    intensity: calculateTremorIntensity(gyroMagnitudes),
    consistency: analyzeTremorConsistency(gyroMagnitudes)
  };
};

// Movement Smoothness
export const analyzeMovementSmoothness = (data) => {
  const jerkMetrics = calculateJerkMetrics(data);
  return {
    smoothnessIndex: calculateSmoothnessIndex(data),
    jerkCost: jerkMetrics.jerkCost,
    movementQuality: assessMovementQuality(jerkMetrics)
  };
};

// Range of Motion
export const analyzeRangeOfMotion = (data) => {
  return {
    wristFlexion: calculateROMMetrics(data.map(d => d.wristAngle)),
    roll: calculateROMMetrics(data.map(d => d.Roll)),
    pitch: calculateROMMetrics(data.map(d => d.Pitch)),
    yaw: calculateROMMetrics(data.map(d => d.Yaw))
  };
};

// Helper functions
function calculateTremorFrequency(magnitudes) {
  // Implement FFT analysis here
  return 4.2; // Example value
}

function calculateTremorIntensity(magnitudes) {
  return Math.std(magnitudes);
}

function analyzeTremorConsistency(magnitudes) {
  return 85; // Example value
}

function calculateSmoothnessIndex(data) {
  return 7.8; // Example value
}

function calculateROMMetrics(angles) {
  return {
    range: Math.max(...angles) - Math.min(...angles),
    mean: Math.mean(angles),
    std: Math.std(angles)
  };
}

// Math helpers
Math.mean = arr => arr.reduce((a, b) => a + b) / arr.length;
Math.std = arr => {
  const mean = Math.mean(arr);
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / arr.length);
}; 