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
  return {
    smoothnessIndex: calculateSmoothnessIndex(data),
    movementQuality: calculateMovementQuality(data)
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
  // Simple frequency estimation from peak counting
  let peaks = 0;
  for (let i = 1; i < magnitudes.length - 1; i++) {
    if (magnitudes[i] > magnitudes[i-1] && magnitudes[i] > magnitudes[i+1]) {
      peaks++;
    }
  }
  // Convert to Hz assuming 100ms sampling rate
  return (peaks * 10) / magnitudes.length;
}

function calculateTremorIntensity(magnitudes) {
  return Math.std(magnitudes);
}

function analyzeTremorConsistency(magnitudes) {
  // Calculate consistency as inverse of variance
  const variance = Math.std(magnitudes) ** 2;
  return Math.max(0, 100 - (variance * 100));
}

function calculateSmoothnessIndex(data) {
  // Calculate smoothness based on acceleration changes
  const accelerations = data.map(d => 
    Math.sqrt(d.GyroX**2 + d.GyroY**2 + d.GyroZ**2)
  );
  const changes = accelerations.slice(1).map((a, i) => 
    Math.abs(a - accelerations[i])
  );
  return 10 - Math.min(10, Math.mean(changes));
}

function calculateMovementQuality(data) {
  // Quality score based on movement consistency and smoothness
  const smoothness = calculateSmoothnessIndex(data);
  const gyroMagnitudes = data.map(d => 
    Math.sqrt(d.GyroX**2 + d.GyroY**2 + d.GyroZ**2)
  );
  const consistency = analyzeTremorConsistency(gyroMagnitudes);
  return (smoothness * 0.6 + (consistency/100) * 0.4) * 10;
}

function calculateROMMetrics(angles) {
  const validAngles = angles.filter(a => !isNaN(a));
  if (validAngles.length === 0) return { range: 0, mean: 0, std: 0 };
  return {
    range: Math.max(...validAngles) - Math.min(...validAngles),
    mean: Math.mean(validAngles),
    std: Math.std(validAngles)
  };
}

// Math helpers
Math.mean = arr => arr.reduce((a, b) => a + b) / arr.length;
Math.std = arr => {
  const mean = Math.mean(arr);
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / arr.length);
}; 