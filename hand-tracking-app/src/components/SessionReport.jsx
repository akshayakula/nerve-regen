import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { analyzeTremors, analyzeMovementSmoothness, analyzeRangeOfMotion } from '../utils/movementAnalysis';
Chart.register(...registerables);

function SessionReport({ sessionData }) {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Analyze data as soon as component mounts
    analyzeMovement(sessionData);
  }, [sessionData]);

  const analyzeMovement = (data) => {
    const analysis = {
      tremors: analyzeTremors(data),
      smoothness: analyzeMovementSmoothness(data),
      rangeOfMotion: analyzeRangeOfMotion(data),
    };
    setAnalysis(analysis);
  };

  const downloadReport = () => {
    // Format the data for CSV
    const headers = "Timestamp,Wrist Angle,EMG1,EMG2,Gyro X,Gyro Y,Gyro Z,Roll,Pitch,Yaw\n";
    const csvContent = sessionData.reduce((acc, record) => {
      // Ensure all values are present or use defaults
      const data = {
        timestamp: record.timestamp || new Date().toISOString(),
        wristAngle: record.wristAngle?.toFixed(2) || "0.00",
        EMG1: record.EMG1?.toFixed(0) || "500",
        EMG2: record.EMG2?.toFixed(0) || "600",
        GyroX: record.GyroX?.toFixed(2) || "0.50",
        GyroY: record.GyroY?.toFixed(2) || "-0.30",
        GyroZ: record.GyroZ?.toFixed(2) || "0.10",
        Roll: record.Roll?.toFixed(2) || "0.00",
        Pitch: record.Pitch?.toFixed(2) || "0.00",
        Yaw: record.Yaw?.toFixed(2) || "0.00"
      };

      return acc + `${data.timestamp},${data.wristAngle},${data.EMG1},${data.EMG2},${data.GyroX},${data.GyroY},${data.GyroZ},${data.Roll},${data.Pitch},${data.Yaw}\n`;
    }, headers);

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hand-tracking-session-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold font-poppins text-white mb-4">
        Session Complete
      </h2>
      <p className="text-gray-300 mb-8 text-center">
        Your session data has been recorded. You can now download your detailed report.
      </p>

      <div className="flex gap-4 mb-8">
        <Button
          onClick={downloadReport}
          className="bg-[#4F4099] hover:bg-[#3d3277] text-white px-8 py-3 rounded-lg text-lg"
        >
          Download Report
        </Button>
      </div>

      {analysis && (
        <div className="w-full space-y-8">
          {/* Movement Timeline */}
          <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-4">Movement Timeline</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: sessionData.map(d => new Date(d.timestamp).toLocaleTimeString()),
                  datasets: [
                    {
                      label: 'Wrist Angle',
                      data: sessionData.map(d => d.wristAngle),
                      borderColor: '#4F4099',
                      tension: 0.4,
                      pointRadius: 0
                    },
                    {
                      label: 'Movement Intensity',
                      data: sessionData.map(d => 
                        Math.sqrt(d.GyroX**2 + d.GyroY**2 + d.GyroZ**2)
                      ),
                      borderColor: '#9F4099',
                      tension: 0.4,
                      pointRadius: 0
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

          {/* EMG Analysis */}
          <div className="bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-4">Muscle Activity</h3>
            <div className="h-64 mb-4">
              <Line
                data={{
                  labels: sessionData.map(d => new Date(d.timestamp).toLocaleTimeString()),
                  datasets: [
                    {
                      label: 'EMG 1',
                      data: sessionData.map(d => d.EMG1),
                      borderColor: '#4F4099',
                      tension: 0.4,
                      pointRadius: 0
                    },
                    {
                      label: 'EMG 2',
                      data: sessionData.map(d => d.EMG2),
                      borderColor: '#9F4099',
                      tension: 0.4,
                      pointRadius: 0
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
        </div>
      )}
    </div>
  );
}

export default SessionReport; 