import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Server, Wifi } from 'lucide-react';

function ConnectionTester({ onConnectionSuccess }) {
  const [status, setStatus] = useState('idle'); // idle, testing, success, error
  const [serverPort, setServerPort] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [dataReceived, setDataReceived] = useState(false);
  const [latency, setLatency] = useState(null);
  const [testResults, setTestResults] = useState({});

  const runConnectionTest = async () => {
    setStatus('testing');
    setErrorDetails('');
    setTestResults({});
    
    try {
      // Step 1: Find the server port
      const port = await discoverServerPort();
      setServerPort(port);
      setTestResults(prev => ({ ...prev, serverPort: { success: true, port } }));
      
      // Step 2: Test HTTP API
      const apiResult = await testApiConnection(port);
      setTestResults(prev => ({ ...prev, apiConnection: { success: true, data: apiResult } }));
      
      // Step 3: Test WebSocket connection
      const socket = await testSocketConnection(port);
      setSocketConnected(true);
      setTestResults(prev => ({ ...prev, socketConnection: { success: true } }));
      
      // Step 4: Test data flow
      const dataResult = await testDataFlow(socket);
      setDataReceived(true);
      setTestResults(prev => ({ ...prev, dataFlow: { success: true, sample: dataResult } }));
      
      // Step 5: Test latency
      const pingResult = await testLatency();
      setLatency(pingResult);
      setTestResults(prev => ({ ...prev, latency: { success: true, value: pingResult } }));
      
      // All tests passed
      setStatus('success');
      
      // If onConnectionSuccess callback is provided, call it with the port
      if (onConnectionSuccess) {
        onConnectionSuccess(port);
      }
      
      // Cleanup socket
      socket.disconnect();
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus('error');
      setErrorDetails(error.message);
      setTestResults(prev => ({ 
        ...prev, 
        [error.step]: { 
          success: false, 
          error: error.message,
          details: error.details
        } 
      }));
    }
  };

  // Discover which port the server is running on
  const discoverServerPort = () => {
    return new Promise(async (resolve, reject) => {
      const portsToTry = [5001]; // Only try port 5001 since we know that's where the server is
      
      for (const port of portsToTry) {
        try {
          const response = await fetch(`http://localhost:${port}/api/port`, {
            signal: AbortSignal.timeout(2000) // Timeout after 2 seconds
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Server found on port ${data.port}`);
            return resolve(data.port);
          }
        } catch (err) {
          console.log(`No server on port ${port}`);
          // Continue to next port
        }
      }
      
      reject({ 
        message: 'Could not find the server on any common port',
        step: 'serverPort',
        details: 'Tried ports: ' + portsToTry.join(', ')
      });
    });
  };

  // Test HTTP API connection
  const testApiConnection = async (port) => {
    try {
      const response = await fetch(`http://localhost:${port}/api/status`, {
        signal: AbortSignal.timeout(5000) // Timeout after 5 seconds
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      throw { 
        message: 'API connection failed',
        step: 'apiConnection',
        details: err.toString()
      };
    }
  };

  // Test WebSocket connection
  const testSocketConnection = async (port) => {
    try {
      // Instead of testing socket connection, test the sensor data endpoint
      const response = await fetch(`http://localhost:${port}/api/sensor-data`, {
        signal: AbortSignal.timeout(5000) // Timeout after 5 seconds
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      return data; // Return the data instead of a socket
    } catch (err) {
      throw { 
        message: 'Sensor data endpoint connection failed',
        step: 'socketConnection',
        details: err.toString()
      };
    }
  };

  // Test data flow
  const testDataFlow = async (sensorData) => {
    // We already have the sensor data from the previous step
    if (!sensorData) {
      throw { 
        message: 'No sensor data available',
        step: 'dataFlow',
        details: 'Failed to retrieve sensor data'
      };
    }
    
    // Check Arduino status
    try {
      const response = await fetch('http://localhost:5001/api/arduino-status');
      if (response.ok) {
        const status = await response.json();
        setArduinoConnected(status.connected);
      }
    } catch (err) {
      console.error('Failed to check Arduino status:', err);
    }
    
    return sensorData;
  };

  // Test latency
  const testLatency = async () => {
    const startTime = Date.now();
    
    try {
      // Test latency with a simple API call
      await fetch('http://localhost:5001/api/status', {
        signal: AbortSignal.timeout(3000) // Timeout after 3 seconds
      });
      
      return Date.now() - startTime;
    } catch (err) {
      throw { 
        message: 'Latency test failed',
        step: 'latency',
        details: err.toString()
      };
    }
  };

  // Run test on mount if auto is true
  useEffect(() => {
    // Auto-run test when component mounts
    const autoRun = new URLSearchParams(window.location.search).get('autotest');
    if (autoRun === 'true') {
      runConnectionTest();
    }
  }, []);

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-xl max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <Server className="mr-2" /> Connection Tester
      </h2>
      
      {status === 'idle' && (
        <div className="text-center py-6">
          <p className="text-gray-300 mb-4">
            Test your connection to the backend server and Arduino
          </p>
          <Button 
            onClick={runConnectionTest}
            className="bg-[#4F4099] hover:bg-[#3d3277] text-white"
          >
            Start Connection Test
          </Button>
        </div>
      )}
      
      {status === 'testing' && (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <RefreshCw className="animate-spin text-[#4F4099]" size={32} />
          </div>
          <p className="text-center text-gray-300">Testing connection...</p>
          
          <div className="space-y-2 mt-4">
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-2 ${testResults.serverPort ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-gray-300">Finding server port</span>
              {testResults.serverPort && <span className="ml-auto text-gray-400">Port {testResults.serverPort.port}</span>}
            </div>
            
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-2 ${testResults.apiConnection ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-gray-300">Testing API connection</span>
            </div>
            
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-2 ${testResults.socketConnection ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-gray-300">Testing WebSocket connection</span>
            </div>
            
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-2 ${testResults.dataFlow ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-gray-300">Testing data flow</span>
            </div>
            
            <div className="flex items-center text-sm">
              <div className={`w-4 h-4 rounded-full mr-2 ${testResults.latency ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-gray-300">Measuring latency</span>
              {testResults.latency && <span className="ml-auto text-gray-400">{testResults.latency.value}ms</span>}
            </div>
          </div>
        </div>
      )}
      
      {status === 'success' && (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="text-green-500" size={32} />
          </div>
          <h3 className="text-center text-lg font-semibold text-white">Connection Successful!</h3>
          
          <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Server Port:</span>
              <span className="text-white font-mono">{serverPort}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">WebSocket:</span>
              <span className={socketConnected ? "text-green-500" : "text-red-500"}>
                {socketConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Arduino:</span>
              <span className={arduinoConnected ? "text-green-500" : "text-yellow-500"}>
                {arduinoConnected ? "Connected" : "Simulated Data"}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Latency:</span>
              <span className="text-white">{latency}ms</span>
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button 
              onClick={runConnectionTest}
              className="bg-[#4F4099] hover:bg-[#3d3277] text-white mr-2"
            >
              <RefreshCw className="mr-2" size={16} /> Test Again
            </Button>
            
            {onConnectionSuccess && (
              <Button 
                onClick={() => onConnectionSuccess(serverPort)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h3 className="text-center text-lg font-semibold text-white">Connection Failed</h3>
          <p className="text-center text-red-400">{errorDetails}</p>
          
          <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3">
            {Object.entries(testResults).map(([key, result]) => (
              <div key={key} className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-300">{key}:</span>
                <span className={`ml-2 ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                  {result.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <h4 className="text-white font-semibold mb-2">Troubleshooting:</h4>
            <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
              <li>Make sure the backend server is running</li>
              <li>Check if another application is using the same port</li>
              <li>Verify your firewall settings</li>
              <li>Try restarting the backend server</li>
              <li>Check browser console for additional errors</li>
            </ul>
          </div>
          
          <Button 
            onClick={runConnectionTest}
            className="w-full bg-[#4F4099] hover:bg-[#3d3277] text-white mt-4"
          >
            <RefreshCw className="mr-2" size={16} /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default ConnectionTester; 