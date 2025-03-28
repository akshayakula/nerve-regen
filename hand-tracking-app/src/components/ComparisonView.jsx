import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { analyzeTremors, analyzeMovementSmoothness, analyzeRangeOfMotion, analyzeEMGActivity, analyzeMotionPatterns } from '../utils/movementAnalysis';

Chart.register(...registerables);

function ComparisonView({ currentData, onBack }) {
  const [previousData, setPreviousData] = useState(null);
  const [previousAnalysis, setPreviousAnalysis] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Analyze current data
    if (currentData) {
      const analysis = {
        tremors: analyzeTremors(currentData),
        smoothness: analyzeMovementSmoothness(currentData),
        rangeOfMotion: analyzeRangeOfMotion(currentData),
        emgActivity: analyzeEMGActivity(currentData),
        motionPatterns: analyzeMotionPatterns(currentData),
      };
      setCurrentAnalysis(analysis);
    }
  }, [currentData]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null); // Clear any previous errors
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        
        // Parse CSV data
        const data = rows.slice(1)
          .filter(row => row.trim() !== '')
          .map(row => {
            const values = row.split(',');
            return headers.reduce((obj, header, index) => {
              const key = header.trim();
              // Convert to appropriate types
              if (key === 'timestamp') {
                obj[key] = values[index];
              } else {
                obj[key] = parseFloat(values[index]) || 0;
              }
              return obj;
            }, {});
          });

        // Validate that we have enough data
        if (data.length === 0) {
          throw new Error("The CSV file doesn't contain any valid data rows");
        }
        
        // Check if the CSV has the required columns
        const requiredColumns = ['Timestamp', 'Wrist Angle', 'EMG1', 'EMG2', 'Gyro X', 'Gyro Y', 'Gyro Z'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          throw new Error(`CSV is missing required columns: ${missingColumns.join(', ')}`);
        }

        // Map column names to match our expected format
        const processedData = data.map(item => ({
          timestamp: item.Timestamp,
          wristAngle: item['Wrist Angle'] || 0,
          EMG1: item.EMG1 || 0,
          EMG2: item.EMG2 || 0,
          GyroX: item['Gyro X'] || 0,
          GyroY: item['Gyro Y'] || 0,
          GyroZ: item['Gyro Z'] || 0,
          Roll: item.Roll || 0,
          Pitch: item.Pitch || 0,
          Yaw: item.Yaw || 0
        }));

        setPreviousData(processedData);
        
        // Analyze the uploaded data
        const analysis = {
          tremors: analyzeTremors(processedData),
          smoothness: analyzeMovementSmoothness(processedData),
          rangeOfMotion: analyzeRangeOfMotion(processedData),
          emgActivity: analyzeEMGActivity(processedData),
          motionPatterns: analyzeMotionPatterns(processedData),
        };
        setPreviousAnalysis(analysis);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setError(`Error parsing the CSV file: ${error.message}`);
        setPreviousData(null);
        setPreviousAnalysis(null);
      }
    };
    
    reader.readAsText(file);
  }, []);

  // Render the comparison only when both analyses are available
  const renderComparison = () => {
    if (!currentAnalysis || !previousAnalysis || !previousData) return null;
    
    return (
      <div className="w-full space-y-8">
        {/* Movement Timeline Comparison */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Movement Timeline Comparison</h3>
          <div className="h-64">
            <Line
              data={{
                datasets: [
                  {
                    label: 'Current - Wrist Angle',
                    data: currentData.map(d => ({
                      x: new Date(d.timestamp).toLocaleTimeString(),
                      y: d.wristAngle
                    })),
                    borderColor: '#4F4099',
                    tension: 0.4,
                    pointRadius: 0
                  },
                  {
                    label: 'Previous - Wrist Angle',
                    data: previousData.map(d => ({
                      x: new Date(d.timestamp).toLocaleTimeString(),
                      y: d.wristAngle
                    })),
                    borderColor: '#9F4099',
                    tension: 0.4,
                    pointRadius: 0,
                    borderDash: [5, 5]
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                  y: { 
                    grid: { color: '#333' },
                    beginAtZero: true
                  },
                  x: { 
                    grid: { color: '#333' },
                    ticks: {
                      maxTicksLimit: 10,
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                },
                plugins: {
                  legend: {
                    labels: {
                      color: '#fff'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Tremor Analysis Comparison */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Tremor Analysis Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Tremor Frequency</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.tremors.frequency.toFixed(2)} Hz</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.tremors.frequency.toFixed(2)} Hz</p>
                </div>
                <div className="text-sm">
                  <p className={`${currentAnalysis.tremors.frequency < previousAnalysis.tremors.frequency ? 'text-green-400' : 'text-red-400'}`}>
                    Change: {((currentAnalysis.tremors.frequency - previousAnalysis.tremors.frequency) / previousAnalysis.tremors.frequency * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Tremor Intensity</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.tremors.intensity.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.tremors.intensity.toFixed(2)}</p>
                </div>
                <div className="text-sm">
                  <p className={`${currentAnalysis.tremors.intensity < previousAnalysis.tremors.intensity ? 'text-green-400' : 'text-red-400'}`}>
                    Change: {((currentAnalysis.tremors.intensity - previousAnalysis.tremors.intensity) / previousAnalysis.tremors.intensity * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Consistency</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.tremors.consistency.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.tremors.consistency.toFixed(2)}%</p>
                </div>
                <div className="text-sm">
                  <p className={`${currentAnalysis.tremors.consistency > previousAnalysis.tremors.consistency ? 'text-green-400' : 'text-red-400'}`}>
                    Change: {((currentAnalysis.tremors.consistency - previousAnalysis.tremors.consistency) / previousAnalysis.tremors.consistency * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Movement Quality Comparison */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Movement Quality Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Smoothness Index</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.smoothness.smoothnessIndex.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.smoothness.smoothnessIndex.toFixed(2)}</p>
                </div>
                <div className="text-sm">
                  <p className={`${currentAnalysis.smoothness.smoothnessIndex > previousAnalysis.smoothness.smoothnessIndex ? 'text-green-400' : 'text-red-400'}`}>
                    Change: {((currentAnalysis.smoothness.smoothnessIndex - previousAnalysis.smoothness.smoothnessIndex) / previousAnalysis.smoothness.smoothnessIndex * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Movement Quality Score</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{Math.min(10, currentAnalysis.smoothness.movementQuality).toFixed(2)}/10</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{Math.min(10, previousAnalysis.smoothness.movementQuality).toFixed(2)}/10</p>
                </div>
                <div className="text-sm">
                  <p className={`${currentAnalysis.smoothness.movementQuality > previousAnalysis.smoothness.movementQuality ? 'text-green-400' : 'text-red-400'}`}>
                    Change: {((currentAnalysis.smoothness.movementQuality - previousAnalysis.smoothness.movementQuality) / previousAnalysis.smoothness.movementQuality * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EMG Analysis Comparison */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Muscle Activity Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Average EMG Amplitude</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.emgActivity.averageAmplitude.toFixed(2)} mV</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.emgActivity.averageAmplitude.toFixed(2)} mV</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Muscle Fatigue Index</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.emgActivity.fatigueIndex.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.emgActivity.fatigueIndex.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Activation Pattern Score</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.emgActivity.activationScore.toFixed(2)}/10</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.emgActivity.activationScore.toFixed(2)}/10</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <Line
              data={{
                datasets: [
                  {
                    label: 'Current - EMG 1',
                    data: currentData.map(d => ({
                      x: new Date(d.timestamp).toLocaleTimeString(),
                      y: d.EMG1
                    })),
                    borderColor: '#4F4099',
                    tension: 0.4,
                    pointRadius: 0
                  },
                  {
                    label: 'Previous - EMG 1',
                    data: previousData.map(d => ({
                      x: new Date(d.timestamp).toLocaleTimeString(),
                      y: d.EMG1
                    })),
                    borderColor: '#9F4099',
                    tension: 0.4,
                    pointRadius: 0,
                    borderDash: [5, 5]
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                  y: { 
                    grid: { color: '#333' },
                    beginAtZero: true
                  },
                  x: { 
                    grid: { color: '#333' },
                    ticks: {
                      maxTicksLimit: 10,
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                },
                plugins: {
                  legend: {
                    labels: {
                      color: '#fff'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Motion Pattern Analysis */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Motion Pattern Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Movement Efficiency</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.motionPatterns.efficiency.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.motionPatterns.efficiency.toFixed(2)}%</p>
                </div>
                <div className="text-sm">
                  <p className={`${currentAnalysis.motionPatterns.efficiency > previousAnalysis.motionPatterns.efficiency ? 'text-green-400' : 'text-red-400'}`}>
                    Change: {((currentAnalysis.motionPatterns.efficiency - previousAnalysis.motionPatterns.efficiency) / previousAnalysis.motionPatterns.efficiency * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-gray-400">Movement Complexity</p>
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm text-purple-300">Current</p>
                  <p className="text-xl text-white">{currentAnalysis.motionPatterns.complexity.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Previous</p>
                  <p className="text-xl text-white">{previousAnalysis.motionPatterns.complexity.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <Bar
              data={{
                labels: ['Speed', 'Accuracy', 'Control', 'Coordination'],
                datasets: [
                  {
                    label: 'Current Session',
                    data: [
                      currentAnalysis.motionPatterns.speed,
                      currentAnalysis.motionPatterns.accuracy,
                      currentAnalysis.motionPatterns.control,
                      currentAnalysis.motionPatterns.coordination
                    ],
                    backgroundColor: '#4F4099'
                  },
                  {
                    label: 'Previous Session',
                    data: [
                      previousAnalysis.motionPatterns.speed,
                      previousAnalysis.motionPatterns.accuracy,
                      previousAnalysis.motionPatterns.control,
                      previousAnalysis.motionPatterns.coordination
                    ],
                    backgroundColor: '#9F4099'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: '#333' },
                    ticks: { color: '#fff' }
                  },
                  x: {
                    grid: { color: '#333' },
                    ticks: { color: '#fff' }
                  }
                },
                plugins: {
                  legend: {
                    labels: { color: '#fff' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Detailed Progress Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Movement Quality</h4>
              <p className="text-white mb-2">
                {currentAnalysis.smoothness.movementQuality > previousAnalysis.smoothness.movementQuality ? 
                  `Movement quality has improved by ${((currentAnalysis.smoothness.movementQuality - previousAnalysis.smoothness.movementQuality) / previousAnalysis.smoothness.movementQuality * 100).toFixed(1)}%. This indicates better control and coordination.` :
                  `Movement quality has decreased by ${((previousAnalysis.smoothness.movementQuality - currentAnalysis.smoothness.movementQuality) / previousAnalysis.smoothness.movementQuality * 100).toFixed(1)}%. This might be due to fatigue or other factors.`
                }
              </p>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Muscle Activity</h4>
              <p className="text-white mb-2">
                EMG analysis shows {
                  currentAnalysis.emgActivity.averageAmplitude > previousAnalysis.emgActivity.averageAmplitude ?
                  'increased muscle activation' : 'decreased muscle activation'
                }, with a fatigue index of {currentAnalysis.emgActivity.fatigueIndex.toFixed(2)}.
              </p>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Motion Patterns</h4>
              <p className="text-white mb-2">
                Movement efficiency is {
                  currentAnalysis.motionPatterns.efficiency > previousAnalysis.motionPatterns.efficiency ?
                  'improving' : 'showing room for improvement'
                }, with notable changes in {
                  Object.entries(currentAnalysis.motionPatterns)
                    .filter(([key, value]) => 
                      key !== 'efficiency' && 
                      Math.abs((value - previousAnalysis.motionPatterns[key]) / previousAnalysis.motionPatterns[key]) > 0.1
                    )
                    .map(([key]) => key)
                    .join(', ')
                }.
              </p>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside text-white space-y-2">
                {currentAnalysis.tremors.intensity > previousAnalysis.tremors.intensity && (
                  <li>Focus on stability exercises to reduce tremor intensity</li>
                )}
                {currentAnalysis.smoothness.smoothnessIndex < previousAnalysis.smoothness.smoothnessIndex && (
                  <li>Practice slow, controlled movements to improve smoothness</li>
                )}
                {currentAnalysis.emgActivity.fatigueIndex > previousAnalysis.emgActivity.fatigueIndex && (
                  <li>Consider shorter exercise sessions or more rest between movements</li>
                )}
                {currentAnalysis.motionPatterns.accuracy < previousAnalysis.motionPatterns.accuracy && (
                  <li>Work on precision exercises to improve movement accuracy</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold font-poppins text-white mb-4">
        Report Comparison
      </h2>
      
      <div className="flex gap-4 mb-8">
        <Button
          onClick={onBack}
          className="bg-[#3d3277] hover:bg-[#2a2255] text-white px-6 py-2 rounded-lg"
        >
          Back to Current Report
        </Button>
      </div>

      {error && (
        <div className="bg-red-900 text-white p-4 rounded-lg mb-6 w-full max-w-xl">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!previousData || !previousAnalysis ? (
        <div className="bg-[#2a2a2a] rounded-xl p-8 shadow-xl w-full max-w-xl">
          <h3 className="text-xl font-bold text-white mb-6">Upload Previous Report</h3>
          <p className="text-gray-300 mb-6">
            Upload a previously downloaded CSV report to compare with your current session.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-white file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0 file:bg-[#4F4099] file:text-white
                      hover:file:bg-[#3d3277] cursor-pointer"
          />
        </div>
      ) : (
        renderComparison()
      )}
    </div>
  );
}

export default ComparisonView; 