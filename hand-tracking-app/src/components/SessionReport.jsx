import React from 'react';
import { Button } from './ui/button';

function SessionReport({ sessionData }) {
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
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold font-poppins text-white mb-4">
        Session Complete
      </h2>
      <p className="text-gray-300 mb-6">
        Your session data has been recorded. You can now download your detailed report.
      </p>
      <div className="space-y-4">
        <Button
          onClick={downloadReport}
          className="bg-[#4F4099] hover:bg-[#3d3277] text-white px-8 py-3 rounded-lg text-lg"
        >
          Download Report
        </Button>
        <div>
          <Button
            onClick={() => window.location.href = '/analysis'}
            className="bg-[#3d3277] hover:bg-[#2a2255] text-white px-8 py-3 rounded-lg text-lg"
          >
            Analyze Previous Sessions
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SessionReport; 