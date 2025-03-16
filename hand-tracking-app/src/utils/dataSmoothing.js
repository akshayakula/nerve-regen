/**
 * Utility functions for smoothing sensor data
 */

/**
 * Simple moving average filter
 * @param {Array} data - Array of data points
 * @param {Number} windowSize - Size of the moving average window
 * @param {String} property - Property to smooth (if data is an array of objects)
 * @returns {Array} - Smoothed data
 */
export const movingAverage = (data, windowSize = 5, property = null) => {
  if (!data || data.length === 0) return [];
  if (data.length < windowSize) return data;
  
  const result = [];
  
  // If we're smoothing a property in objects
  if (property) {
    // First windowSize-1 points remain the same
    for (let i = 0; i < windowSize - 1; i++) {
      result.push({...data[i]});
    }
    
    // Apply moving average for the rest
    for (let i = windowSize - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += data[i - j][property];
      }
      
      const smoothedValue = sum / windowSize;
      const newPoint = {...data[i]};
      newPoint[property] = smoothedValue;
      result.push(newPoint);
    }
  } 
  // If we're smoothing an array of values
  else {
    // First windowSize-1 points remain the same
    for (let i = 0; i < windowSize - 1; i++) {
      result.push(data[i]);
    }
    
    // Apply moving average for the rest
    for (let i = windowSize - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += data[i - j];
      }
      result.push(sum / windowSize);
    }
  }
  
  return result;
};

/**
 * Exponential moving average filter
 * @param {Array} data - Array of data points
 * @param {Number} alpha - Smoothing factor (0-1, lower = more smoothing)
 * @param {String} property - Property to smooth (if data is an array of objects)
 * @returns {Array} - Smoothed data
 */
export const exponentialMovingAverage = (data, alpha = 0.2, property = null) => {
  if (!data || data.length === 0) return [];
  
  const result = [];
  
  // If we're smoothing a property in objects
  if (property) {
    // First point remains the same
    result.push({...data[0]});
    
    // Apply EMA for the rest
    for (let i = 1; i < data.length; i++) {
      const prevSmoothed = result[i-1][property];
      const current = data[i][property];
      const smoothedValue = alpha * current + (1 - alpha) * prevSmoothed;
      
      const newPoint = {...data[i]};
      newPoint[property] = smoothedValue;
      result.push(newPoint);
    }
  } 
  // If we're smoothing an array of values
  else {
    // First point remains the same
    result.push(data[0]);
    
    // Apply EMA for the rest
    for (let i = 1; i < data.length; i++) {
      const prevSmoothed = result[i-1];
      const current = data[i];
      result.push(alpha * current + (1 - alpha) * prevSmoothed);
    }
  }
  
  return result;
};

/**
 * Low-pass filter
 * @param {Array} data - Array of data points
 * @param {Number} cutoff - Cutoff frequency (0-1)
 * @param {String} property - Property to smooth (if data is an array of objects)
 * @returns {Array} - Smoothed data
 */
export const lowPassFilter = (data, cutoff = 0.1, property = null) => {
  if (!data || data.length === 0) return [];
  
  const result = [];
  const RC = 1.0 / (2.0 * Math.PI * cutoff);
  const dt = 1.0; // Assuming uniform time steps
  const alpha = dt / (RC + dt);
  
  // If we're smoothing a property in objects
  if (property) {
    // First point remains the same
    result.push({...data[0]});
    
    // Apply filter for the rest
    for (let i = 1; i < data.length; i++) {
      const prevFiltered = result[i-1][property];
      const current = data[i][property];
      const filteredValue = prevFiltered + alpha * (current - prevFiltered);
      
      const newPoint = {...data[i]};
      newPoint[property] = filteredValue;
      result.push(newPoint);
    }
  } 
  // If we're smoothing an array of values
  else {
    // First point remains the same
    result.push(data[0]);
    
    // Apply filter for the rest
    for (let i = 1; i < data.length; i++) {
      const prevFiltered = result[i-1];
      const current = data[i];
      result.push(prevFiltered + alpha * (current - prevFiltered));
    }
  }
  
  return result;
};

/**
 * Kalman filter for 1D data
 * @param {Array} data - Array of data points
 * @param {Number} processNoise - Process noise (Q)
 * @param {Number} measurementNoise - Measurement noise (R)
 * @param {String} property - Property to smooth (if data is an array of objects)
 * @returns {Array} - Smoothed data
 */
export const kalmanFilter = (data, processNoise = 0.01, measurementNoise = 1, property = null) => {
  if (!data || data.length === 0) return [];
  
  const result = [];
  let estimate = property ? data[0][property] : data[0];
  let errorCovariance = 1;
  
  // If we're smoothing a property in objects
  if (property) {
    for (let i = 0; i < data.length; i++) {
      // Prediction step
      const predictedCovariance = errorCovariance + processNoise;
      
      // Update step
      const kalmanGain = predictedCovariance / (predictedCovariance + measurementNoise);
      const measurement = data[i][property];
      estimate = estimate + kalmanGain * (measurement - estimate);
      errorCovariance = (1 - kalmanGain) * predictedCovariance;
      
      const newPoint = {...data[i]};
      newPoint[property] = estimate;
      result.push(newPoint);
    }
  } 
  // If we're smoothing an array of values
  else {
    for (let i = 0; i < data.length; i++) {
      // Prediction step
      const predictedCovariance = errorCovariance + processNoise;
      
      // Update step
      const kalmanGain = predictedCovariance / (predictedCovariance + measurementNoise);
      const measurement = data[i];
      estimate = estimate + kalmanGain * (measurement - estimate);
      errorCovariance = (1 - kalmanGain) * predictedCovariance;
      
      result.push(estimate);
    }
  }
  
  return result;
}; 