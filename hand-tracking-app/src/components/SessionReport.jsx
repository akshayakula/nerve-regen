import React from 'react';
import { Button } from './ui/button';

function SessionReport({ sessionData }) {
  const downloadReport = () => {
    // Format the data for CSV
    const headers = "Timestamp,Wrist Angle,EMG1,EMG2,Voltage1,Voltage2,Gyro X,Gyro Y,Gyro Z\n";
    const csvContent = sessionData.reduce((acc, record) => {
      // Ensure all values are present or use defaults
      const data = {
        timestamp: record.timestamp || new Date().toISOString(),
        wristAngle: record.wristAngle?.toFixed(2) || "0.00",
        EMG1: record.EMG1?.toFixed(0) || "500",
        EMG2: record.EMG2?.toFixed(0) || "600",
        Voltage1: record.Voltage1?.toFixed(2) || "3.30",
        Voltage2: record.Voltage2?.toFixed(2) || "3.50",
        GyroX: record.GyroX?.toFixed(2) || "0.50",
        GyroY: record.GyroY?.toFixed(2) || "-0.30",
        GyroZ: record.GyroZ?.toFixed(2) || "0.10"
      };

      return acc + `${data.timestamp},${data.wristAngle},${data.EMG1},${data.EMG2},${data.Voltage1},${data.Voltage2},${data.GyroX},${data.GyroY},${data.GyroZ}\n`;
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
      <Button
        onClick={downloadReport}
        className="bg-[#4F4099] hover:bg-[#3d3277] text-white px-8 py-3 rounded-lg text-lg"
      >
        Download Report
      </Button>
    </div>
  );
}

export default SessionReport; 