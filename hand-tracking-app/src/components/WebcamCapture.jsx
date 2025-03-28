import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import SensorData from './SensorData';
import SessionReport from './SessionReport';
import { Button } from './ui/button';
import { exponentialMovingAverage, lowPassFilter } from '../utils/dataSmoothing';
import DataDebugger from './DataDebugger';

// Function to calculate wrist angle from hand landmarks
const calculateWristAngle = (handData) => {
  if (!handData || !handData.annotations) return null;
  
  try {
    // Get wrist and middle finger base points
    const wrist = handData.annotations.palmBase[0];
    const middleFingerBase = handData.annotations.middleFinger[0];
    
    if (!wrist || !middleFingerBase) return null;
    
    // Calculate angle in radians
    const deltaX = middleFingerBase[0] - wrist[0];
    const deltaY = middleFingerBase[1] - wrist[1];
    const angleRad = Math.atan2(deltaY, deltaX);
    
    // Convert to degrees and normalize to 0-360 range
    let angleDeg = (angleRad * 180) / Math.PI;
    angleDeg = (angleDeg + 360) % 360;
    
    // Adjust angle based on hand orientation
    // This may need calibration based on your specific use case
    return angleDeg;
  } catch (err) {
    console.error('Error calculating wrist angle:', err);
    return null;
  }
};

function WebcamCapture({ initialPort }) {
  console.log('WebcamCapture initialized with port:', initialPort);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [handData, setHandData] = useState(null);
  const [showWebcam, setShowWebcam] = useState(true);
  const [sessionData, setSessionData] = useState([]);
  const [smoothedData, setSmoothedData] = useState([]);
  const [sensorBuffer, setSensorBuffer] = useState([]);
  const [lastDataTimestamp, setLastDataTimestamp] = useState(0);
  const [dataReceived, setDataReceived] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  
  // Smoothing parameters
  const BUFFER_SIZE = 5;
  const SMOOTHING_ALPHA = 0.2;

  // Initialize webcam
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' 
          },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Error accessing webcam: ' + err.message);
      }
    }

    setupCamera();

    return () => {
      // Cleanup: stop all video streams when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Check server connectivity
  useEffect(() => {
    // Skip initial check if we don't have a port yet
    // Always use port 5001
    const portToUse = 5001;
    
    // Function to check if the server is reachable
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`http://localhost:${portToUse}/api/status`);
        if (response.ok) {
          const data = await response.json();
          console.log('Server status:', data);
          setError(null);
        } else {
          console.error('Server returned error status:', response.status);
          setError('Server is not responding properly. Status: ' + response.status);
        }
      } catch (err) {
        console.error('Failed to reach server:', err);
        setError('Cannot connect to server. Please ensure the backend is running.');
      }
    };
    
    // Check immediately on component mount
    checkServerStatus();
    
    // Then check periodically
    const statusInterval = setInterval(checkServerStatus, 60000); // Check less frequently
    
    return () => clearInterval(statusInterval);
  }, []); // No dependencies since we're always using port 5001

  // Handle video loaded
  const handleVideoLoad = () => {
    setIsVideoReady(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Load handpose model
  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready(); // Ensure TensorFlow.js is ready
        const loadedModel = await handpose.load();
        setModel(loadedModel);
        console.log('Handpose model loaded');
      } catch (err) {
        setError('Error loading handpose model: ' + err.message);
      }
    }

    loadModel();
  }, []);

  // Detect hands
  useEffect(() => {
    if (!model || !videoRef.current || !isVideoReady || !canvasRef.current) return;

    let requestId;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    async function detect() {
      try {
        if (video.readyState === video.HAVE_ENOUGH_DATA &&
            video.videoWidth > 0 &&
            video.videoHeight > 0) {
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Clear previous frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Save the current context state
          ctx.save();
          
          // Mirror the context for the video
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
          
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Restore the context to normal for annotations
          ctx.restore();

          // Get hand landmarks
          const hands = await model.estimateHands(video);
          
          if (hands.length > 0) {
            const hand = hands[0];
            setHandData(hand);
            
            // Mirror the hand coordinates
            const mirroredHand = {
              ...hand,
              landmarks: hand.landmarks.map(point => [
                canvas.width - point[0],
                point[1],
                point[2]
              ]),
              annotations: Object.fromEntries(
                Object.entries(hand.annotations).map(([key, points]) => [
                  key,
                  points.map(point => [
                    canvas.width - point[0],
                    point[1],
                    point[2]
                  ])
                ])
              )
            };
            
            // Draw connecting lines
            ctx.strokeStyle = '#4F4099';
            ctx.lineWidth = 2;

            // Draw palm
            const palm = mirroredHand.annotations.palmBase[0];
            mirroredHand.annotations.thumb.forEach((point, i) => {
              if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(palm[0], palm[1]);
                ctx.lineTo(point[0], point[1]);
                ctx.stroke();
              }
            });

            // Draw fingers
            ['thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'pinky'].forEach(finger => {
              const points = mirroredHand.annotations[finger];
              ctx.beginPath();
              ctx.moveTo(points[0][0], points[0][1]);
              points.forEach((point) => {
                ctx.lineTo(point[0], point[1]);
              });
              ctx.stroke();
            });

            // Draw landmarks
            mirroredHand.landmarks.forEach((point, index) => {
              ctx.beginPath();
              ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
              ctx.fillStyle = '#4F4099';
              ctx.fill();
            });

            // Calculate and display wrist angle
            const wrist = mirroredHand.annotations.palmBase[0];
            const middleFinger = mirroredHand.annotations.middleFinger[0];
            const angle = Math.atan2(
              middleFinger[1] - wrist[1],
              middleFinger[0] - wrist[0]
            ) * 180 / Math.PI;

            // Draw angle display
            ctx.font = '16px Inter';
            ctx.fillStyle = 'white';
            ctx.fillText(`Wrist Angle: ${angle.toFixed(2)}°`, 10, 30);

            // Update the latest session data entry with the wrist angle
            setSessionData(prev => {
              const newData = [...prev];
              if (newData.length > 0) {
                newData[newData.length - 1].wristAngle = angle;
              }
              return newData;
            });
          }
        }

        requestId = requestAnimationFrame(detect);
      } catch (err) {
        console.error('Detection error:', err);
      }
    }

    detect();

    return () => {
      if (requestId) {
        cancelAnimationFrame(requestId);
      }
    };
  }, [model, isVideoReady]);

  // Start polling when component mounts
  useEffect(() => {
    // Check server status first
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/status');
        if (response.ok) {
          console.log('Server is available, starting polling');
          startPolling();
        } else {
          setError('Server is not responding properly');
        }
      } catch (err) {
        console.error('Failed to reach server:', err);
        setError('Cannot connect to server. Please ensure the backend is running.');
      }
    };
    
    checkServerStatus();
    
    // Clean up on unmount
    return () => {
      stopPolling();
    };
  }, []);

  // Apply smoothing to sensor data
  useEffect(() => {
    if (sensorBuffer.length === 0) return;
    
    // Apply smoothing to the buffer
    const smoothed = {};
    
    // Get the latest data point
    const latestData = sensorBuffer[sensorBuffer.length - 1];
    
    // Apply smoothing to each numeric property
    Object.keys(latestData).forEach(key => {
      if (typeof latestData[key] === 'number') {
        // Extract values for this property from the buffer
        const values = sensorBuffer.map(d => d[key]);
        
        // Apply exponential moving average
        smoothed[key] = exponentialMovingAverage(values, SMOOTHING_ALPHA);
      } else {
        // For non-numeric properties, just use the latest value
        smoothed[key] = latestData[key];
      }
    });
    
    // Update smoothed data
    setSmoothedData(smoothed);
    
    // With HTTP polling, we don't need to send data back to the server
    // If needed, we could implement a POST request here
    
  }, [sensorBuffer]);

  const handleEndSession = () => {
    // Stop data collection immediately
    stopPolling();
    
    // Add a final timestamp marker
    const finalTimestamp = new Date().toISOString();
    setSessionData(prev => {
      // Mark the last entry with a flag
      const finalData = [...prev];
      if (finalData.length > 0) {
        finalData[finalData.length - 1].isFinalDataPoint = true;
      }
      return finalData;
    });
    
    setShowWebcam(false);
    // Stop the webcam
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Test CORS configuration
  useEffect(() => {
    const testCors = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/cors-test');
        const data = await response.json();
        console.log('CORS test result:', data);
      } catch (err) {
        console.error('CORS test failed:', err);
      }
    };
    
    testCors();
  }, []);

  // Discover the actual server port
  useEffect(() => {
    // Force port to be 5001
    console.log('Forcing server port to 5001');
    return;
    
    // Skip port discovery if we already have an initialPort
    if (initialPort) {
      console.log('Using provided initialPort:', initialPort);
      return;
    }
    
    const discoverPort = async () => {
      // Try common ports
      const portsToTry = [5001]; // Only try port 5001 since we know the server is on this port
      
      for (const port of portsToTry) {
        try {
          const response = await fetch(`http://localhost:${port}/api/port`);
          if (response.ok) {
            const data = await response.json();
            console.log(`Server found on port ${data.port}`);
            return;
          }
        } catch (err) {
          console.log(`No server on port ${port}`);
        }
      }
      
      setError('Could not find the server on any common port');
    };
    
    discoverPort();
  }, [initialPort]);

  // Function to request data directly
  const requestData = () => {
    console.log('Requesting data directly...');
    
    // Make a direct API call to fetch sensor data
    fetch('http://localhost:5001/api/sensor-data')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Sensor data received:', data);
        processSensorData(data);
        setConnectionStatus('connected');
      })
      .catch(err => {
        console.error('Failed to fetch sensor data:', err);
        setConnectionStatus('disconnected');
        setError('Failed to fetch sensor data. Is the server running?');
      });
  };

  // Function to fetch sensor data
  const fetchSensorData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('http://localhost:5001/api/sensor-data');
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the received data
      processSensorData(data);
      
      // Update connection status
      setConnectionStatus('connected');
      setError(null);
      
      // Log data occasionally
      if (dataCount % 20 === 0) {
        console.log('Sensor data received:', data);
      }
      
      setIsFetching(false);
      return data;
    } catch (err) {
      console.error('Failed to fetch sensor data:', err);
      setConnectionStatus('disconnected');
      setError('Failed to fetch sensor data. Is the server running?');
      setIsFetching(false);
      return null;
    }
  };

  // Function to process sensor data
  const processSensorData = (data) => {
    if (!data) return;
    
    // Update data tracking
    setDataReceived(true);
    setDataCount(prev => prev + 1);
    setLastDataTimestamp(Date.now());
    
    // Log data periodically
    if (dataCount % 20 === 0) {
      console.log(`Received ${dataCount} data points. Latest:`, data);
    }
    
    const timestamp = new Date().toISOString();
    // Use incoming data or default values if not available
    const sensorValues = {
      timestamp,
      EMG1: data.EMG1 || 0,
      EMG2: data.EMG2 || 0,
      GyroX: data.GyroX || 0,
      GyroY: data.GyroY || 0,
      GyroZ: data.GyroZ || 0,
      Roll: data.Roll || 0,
      Pitch: data.Pitch || 0,
      Yaw: data.Yaw || 0,
      wristAngle: handData ? calculateWristAngle(handData) : null
    };
    
    // Add to buffer for smoothing
    setSensorBuffer(prev => {
      const newBuffer = [...prev, sensorValues];
      // Keep buffer at fixed size
      if (newBuffer.length > BUFFER_SIZE) {
        return newBuffer.slice(newBuffer.length - BUFFER_SIZE);
      }
      return newBuffer;
    });
    
    // Add to session data
    setSessionData(prev => [...prev, sensorValues]);
  };

  // Function to start polling
  const startPolling = () => {
    if (isPolling) return;
    
    console.log('Starting sensor data polling');
    setIsPolling(true);
    
    // Fetch immediately
    fetchSensorData();
    
    // Then set up interval
    const interval = setInterval(() => {
      fetchSensorData();
    }, 1000); // Poll every second
    
    setPollingInterval(interval);
  };

  // Function to stop polling
  const stopPolling = () => {
    if (!isPolling) return;
    
    console.log('Stopping sensor data polling');
    setIsPolling(false);
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Simulate sensor data for testing
  useEffect(() => {
    if (isPolling || !isVideoReady) return;
    
    console.log('No socket connection, simulating sensor data');
    
    const simulateData = setInterval(() => {
      const timestamp = new Date().toISOString();
      const simulatedData = {
        timestamp,
        EMG1: 500 + Math.random() * 100,
        EMG2: 600 + Math.random() * 100,
        GyroX: 0.5 + Math.random() * 0.2,
        GyroY: -0.3 + Math.random() * 0.2,
        GyroZ: 0.1 + Math.random() * 0.2,
        Roll: Math.sin(Date.now() / 1000) * 45,
        Pitch: Math.cos(Date.now() / 1000) * 30,
        Yaw: (Date.now() % 3600) / 10,
        wristAngle: handData ? calculateWristAngle(handData) : null
      };
      
      // Process the simulated data
      processSensorData(simulatedData);
      
    }, 100);
    
    return () => clearInterval(simulateData);
  }, [isPolling, isVideoReady, handData]);

  return (
    <div className="relative bg-[#2a2a2a] rounded-xl p-6 shadow-xl transition-all duration-500 max-w-full overflow-x-hidden">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
          {error}
          {connectionStatus === 'disconnected' && (
            <button 
              className="ml-2 bg-white text-red-500 px-2 py-1 rounded text-xs"
              onClick={() => {
                startPolling();
              }}
            >
              Retry Connection
            </button>
          )}
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center text-xs text-gray-400 z-40">
        <div className={`w-2 h-2 rounded-full mr-1 ${
          connectionStatus === 'connected' 
            ? isFetching 
              ? 'bg-yellow-500 animate-pulse' 
              : 'bg-green-500' 
            : 'bg-red-500'
        }`}></div>
        {connectionStatus === 'connected' 
          ? isFetching 
            ? 'Fetching data...' 
            : 'Connected' 
          : 'Disconnected'} (Port: 5001)
        {connectionStatus === 'connected' && (
          <>
            <span className="mx-2">|</span>
            <div className={`w-2 h-2 rounded-full mr-1 ${dataReceived ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>{dataReceived ? `Data: ${dataCount}` : 'No data'}</span>
          </>
        )}
        {connectionStatus === 'disconnected' && (
          <button 
            className="ml-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
            onClick={() => {
              startPolling();
            }}
          >
            Retry
          </button>
        )}
      </div>
      {showWebcam ? (
        <>
          <video
            ref={videoRef}
            className="hidden"
            width="640"
            height="480"
            playsInline
            onLoadedData={handleVideoLoad}
          />
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-lg"
            width="640"
            height="480"
          />
          <Button
            onClick={handleEndSession}
            className="absolute top-8 right-4 bg-[#4F4099] hover:bg-[#3d3277] text-white px-6 py-2 rounded-lg"
          >
            End Session
          </Button>
          <SensorData sensorBuffer={sensorBuffer} smoothedData={smoothedData} />
          <DataDebugger sensorBuffer={sensorBuffer} />
        </>
      ) : (
        <SessionReport sessionData={sessionData} />
      )}
    </div>
  );
}

export default WebcamCapture;