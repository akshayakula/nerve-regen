import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function SensorData() {
  const [sensorData, setSensorData] = useState({ EMG: 0, Voltage: 0 });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('sensorData', (data) => {
      setSensorData(data);
    });

    return () => newSocket.disconnect();
  }, []);

  return (
    <div className="mt-4 p-4 bg-[#2a2a2a] rounded-lg shadow-xl">
      <h3 className="text-lg font-semibold mb-4 text-white font-poppins">Sensor Data</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-[#1a1a1a] rounded-lg">
          <p className="text-sm text-gray-400">EMG Signal 1</p>
          <p className="text-xl text-white">{sensorData.EMG1}</p>
        </div>
        <div className="p-3 bg-[#1a1a1a] rounded-lg">
          <p className="text-sm text-gray-400">EMG Signal 2</p>
          <p className="text-xl text-white">{sensorData.EMG2}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-[#1a1a1a] rounded-lg">
          <p className="text-sm text-gray-400">Voltage 1</p>
          <p className="text-xl text-white">{sensorData.Voltage1.toFixed(2)}V</p>
        </div>
        <div className="p-3 bg-[#1a1a1a] rounded-lg">
          <p className="text-sm text-gray-400">Voltage 2</p>
          <p className="text-xl text-white">{sensorData.Voltage2.toFixed(2)}V</p>
        </div>
      </div>
    </div>
  );
}

export default SensorData; 