import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

function SensorData({ sensorBuffer, smoothedData }) {
  const [sensorData, setSensorData] = useState({
    EMG1: 500,  // Default EMG values (typical range 0-1023)
    EMG2: 600,
    GyroX: 0.5,  // Default gyro values (typical range ±250 deg/s)
    GyroY: -0.3,
    GyroZ: 0.1,
    Roll: 0.0,
    Pitch: 0.0,
    Yaw: 0.0
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('sensorData', (data) => {
      setSensorData(data);
    });

    return () => newSocket.disconnect();
  }, []);

  // Get the latest data point from the buffer
  const latestData = sensorBuffer && sensorBuffer.length > 0 
    ? sensorBuffer[sensorBuffer.length - 1] 
    : null;
  
  // Format values for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toFixed(2);
    return value;
  };
  
  // Generate EMG chart data
  const emgChartData = sensorBuffer ? sensorBuffer.slice(-20).map((data, index) => ({
    name: index,
    EMG1: data.EMG1,
    EMG2: data.EMG2
  })) : [];
  
  // Generate gyro chart data
  const gyroChartData = sensorBuffer ? sensorBuffer.slice(-20).map((data, index) => ({
    name: index,
    GyroX: data.GyroX,
    GyroY: data.GyroY,
    GyroZ: data.GyroZ
  })) : [];
  
  // Generate orientation chart data
  const orientationChartData = sensorBuffer ? sensorBuffer.slice(-20).map((data, index) => ({
    name: index,
    Roll: data.Roll,
    Pitch: data.Pitch,
    Yaw: data.Yaw
  })) : [];
  
  if (!latestData) {
    return (
      <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg">
        <h3 className="text-white text-lg mb-2">Sensor Data</h3>
        <p className="text-gray-400">Waiting for sensor data...</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg overflow-hidden max-w-full">
      <h3 className="text-white text-lg mb-2">Sensor Data</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* EMG Values */}
        <div className="bg-[#2a2a2a] p-3 rounded-lg">
          <h4 className="text-white text-sm mb-2">EMG</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">EMG1</div>
              <div className="text-lg text-white">{formatValue(latestData.EMG1)}</div>
            </div>
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">EMG2</div>
              <div className="text-lg text-white">{formatValue(latestData.EMG2)}</div>
            </div>
          </div>
        </div>
        
        {/* Gyroscope Values */}
        <div className="bg-[#2a2a2a] p-3 rounded-lg">
          <h4 className="text-white text-sm mb-2">Gyroscope</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">X</div>
              <div className="text-lg text-white">{formatValue(latestData.GyroX)}</div>
            </div>
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">Y</div>
              <div className="text-lg text-white">{formatValue(latestData.GyroY)}</div>
            </div>
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">Z</div>
              <div className="text-lg text-white">{formatValue(latestData.GyroZ)}</div>
            </div>
          </div>
        </div>
        
        {/* Orientation Values */}
        <div className="bg-[#2a2a2a] p-3 rounded-lg">
          <h4 className="text-white text-sm mb-2">Orientation</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">Roll</div>
              <div className="text-lg text-white">{formatValue(latestData.Roll)}°</div>
            </div>
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">Pitch</div>
              <div className="text-lg text-white">{formatValue(latestData.Pitch)}°</div>
            </div>
            <div className="bg-[#333] p-2 rounded">
              <div className="text-xs text-gray-400">Yaw</div>
              <div className="text-lg text-white">{formatValue(latestData.Yaw)}°</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wrist Angle */}
      <div className="bg-[#2a2a2a] p-3 rounded-lg mb-4">
        <h4 className="text-white text-sm mb-2">Hand Tracking</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="bg-[#333] p-2 rounded">
            <div className="text-xs text-gray-400">Wrist Angle</div>
            <div className="text-lg text-white">{formatValue(latestData.wristAngle)}°</div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="mt-6">
        <h4 className="text-white text-sm mb-2">EMG Signals</h4>
        <div className="h-48 bg-[#2a2a2a] p-2 rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={emgChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', fontSize: '12px' }} />
              <Legend />
              <Line type="monotone" dataKey="EMG1" stroke="#8884d8" dot={false} />
              <Line type="monotone" dataKey="EMG2" stroke="#82ca9d" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-white text-sm mb-2">Gyroscope</h4>
          <div className="h-48 bg-[#2a2a2a] p-2 rounded-lg overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gyroChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', fontSize: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="GyroX" stroke="#ff8884" dot={false} />
                <Line type="monotone" dataKey="GyroY" stroke="#82caff" dot={false} />
                <Line type="monotone" dataKey="GyroZ" stroke="#ffc658" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-white text-sm mb-2">Orientation</h4>
          <div className="h-48 bg-[#2a2a2a] p-2 rounded-lg overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orientationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', fontSize: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="Roll" stroke="#ff8884" dot={false} />
                <Line type="monotone" dataKey="Pitch" stroke="#82caff" dot={false} />
                <Line type="monotone" dataKey="Yaw" stroke="#ffc658" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SensorData; 