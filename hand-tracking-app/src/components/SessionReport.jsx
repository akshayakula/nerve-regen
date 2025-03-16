import React from 'react';
import { Button } from './ui/button';

function SessionReport({ sessionData }) {
  const downloadReport = () => {
    // Format the data for CSV
    const headers = "Timestamp,Wrist Angle,EMG Value,Voltage,Gyro X,Gyro Y,Gyro Z\n";
    const csvContent = sessionData.reduce((acc, record) => {
      return acc + `${record.timestamp},${record.wristAngle},${record.emg},${record.voltage},${record.gyroX},${record.gyroY},${record.gyroZ}\n`;
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