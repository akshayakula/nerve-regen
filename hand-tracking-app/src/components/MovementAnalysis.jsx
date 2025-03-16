import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function MovementAnalysis() {
  const [reportData, setReportData] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n');
      const headers = rows[0].split(',');
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = parseFloat(values[index]) || 0;
          return obj;
        }, {});
      });
      setReportData(data);
      analyzeMovement(data);
    };
    
    reader.readAsText(file);
  }, []);

  const analyzeMovement = (data) => {
    // Calculate various metrics
    const analysis = {
      tremors: analyzeTremors(data),
      smoothness: analyzeMovementSmoothness(data),
      rangeOfMotion: analyzeRangeOfMotion(data),
      fatigue: analyzeFatigue(data),
      patterns: analyzePatterns(data)
    };
    setAnalysis(analysis);
  };

  const analyzeTremors = (data) => {
    // Analyze high-frequency oscillations in gyro data
    const gyroMagnitudes = data.map(d => 
      Math.sqrt(d['Gyro X']**2 + d['Gyro Y']**2 + d['Gyro Z']**2)
    );
    
    return {
      frequency: calculateTremorFrequency(gyroMagnitudes),
      intensity: calculateTremorIntensity(gyroMagnitudes),
      consistency: analyzeTremorConsistency(gyroMagnitudes)
    };
  };

  const analyzeMovementSmoothness = (data) => {
    // Calculate jerk metrics (rate of change of acceleration)
    const jerkMetrics = calculateJerkMetrics(data);
    return {
      smoothnessIndex: jerkMetrics.smoothnessIndex,
      jerkCost: jerkMetrics.jerkCost,
      movementQuality: assessMovementQuality(jerkMetrics)
    };
  };

  const analyzeRangeOfMotion = (data) => {
    // Analyze angular movements
    return {
      wristFlexion: calculateROMMetrics(data.map(d => d['Wrist Angle'])),
      roll: calculateROMMetrics(data.map(d => d['Roll'])),
      pitch: calculateROMMetrics(data.map(d => d['Pitch'])),
      yaw: calculateROMMetrics(data.map(d => d['Yaw']))
    };
  };

  const analyzeFatigue = (data) => {
    // Analyze EMG signals for signs of fatigue
    return {
      emgFatigue: analyzeEMGFatigue(data),
      movementDecay: analyzeMovementDecay(data),
      consistencyChange: analyzeConsistencyChange(data)
    };
  };

  const analyzePatterns = (data) => {
    // Identify recurring movement patterns
    return {
      repetitiveMovements: detectRepetitiveMovements(data),
      movementClusters: clusterMovementTypes(data),
      abnormalPatterns: detectAbnormalPatterns(data)
    };
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 font-poppins">Movement Analysis</h1>
        
        <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Upload Previous Session</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-300 mb-4
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-[#4F4099] file:text-white
              hover:file:bg-[#3d3277]"
          />
        </div>

        {analysis && (
          <div className="space-y-8">
            {/* Tremor Analysis */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-4">Tremor Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Tremor Frequency</p>
                  <p className="text-2xl text-white">{analysis.tremors.frequency.toFixed(2)} Hz</p>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Tremor Intensity</p>
                  <p className="text-2xl text-white">{analysis.tremors.intensity.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Consistency</p>
                  <p className="text-2xl text-white">{analysis.tremors.consistency.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Movement Quality */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-4">Movement Quality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Smoothness Index</p>
                  <p className="text-2xl text-white">{analysis.smoothness.smoothnessIndex.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Movement Quality Score</p>
                  <p className="text-2xl text-white">{analysis.smoothness.movementQuality.toFixed(2)}/10</p>
                </div>
              </div>
            </div>

            {/* Range of Motion */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-4">Range of Motion</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analysis.rangeOfMotion).map(([key, value]) => (
                  <div key={key} className="p-4 bg-[#1a1a1a] rounded-lg">
                    <p className="text-sm text-gray-400">{key}</p>
                    <p className="text-2xl text-white">{value.range.toFixed(2)}°</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fatigue Analysis */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-4">Fatigue Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">EMG Fatigue Index</p>
                  <p className="text-2xl text-white">{analysis.fatigue.emgFatigue.index.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Movement Decay</p>
                  <p className="text-2xl text-white">{analysis.fatigue.movementDecay.toFixed(2)}%</p>
                </div>
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Consistency Change</p>
                  <p className="text-2xl text-white">{analysis.fatigue.consistencyChange.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Movement Patterns */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-4">Movement Patterns</h3>
              <div className="space-y-4">
                <div className="p-4 bg-[#1a1a1a] rounded-lg">
                  <p className="text-sm text-gray-400">Detected Patterns</p>
                  <ul className="list-disc list-inside text-white">
                    {analysis.patterns.repetitiveMovements.map((pattern, index) => (
                      <li key={index}>{pattern.description}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovementAnalysis; 