import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import SensorData from './SensorData';
import SessionReport from './SessionReport';
import { Button } from './ui/button';
import { exponentialMovingAverage, lowPassFilter } from '../utils/dataSmoothing';
import DataDebugger from './DataDebugger';

function WebcamCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [handData, setHandData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showWebcam, setShowWebcam] = useState(true);
  const [sessionData, setSessionData] = useState([]);
  const [smoothedData, setSmoothedData] = useState([]);
  const [sensorBuffer, setSensorBuffer] = useState([]);
  
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
    // Function to check if the server is reachable
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/status');
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
    const statusInterval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(statusInterval);
  }, []);

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

            // Send angle to Arduino
            if (socket) {
              socket.emit('wristAngle', angle);
            }

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
  }, [model, isVideoReady, socket]);

  useEffect(() => {
    // Create socket with explicit configuration
    const newSocket = io('http://localhost:5000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['polling', 'websocket'] // Try polling first, then WebSocket
    });
    setSocket(newSocket);
    
    // Connection status handling
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setError('Connection to server lost. Please refresh the page.');
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      
      // If using websocket fails, try polling
      if (newSocket.io.opts.transports[0] === 'websocket') {
        console.log('Switching to polling transport...');
        newSocket.io.opts.transports = ['polling'];
      }
      
      setError('Failed to connect to server. Is the backend running?');
    });
    
    newSocket.on('connectionStatus', (status) => {
      console.log('Connection status:', status);
    });
    
    newSocket.on('arduinoStatus', (status) => {
      console.log('Arduino status:', status);
    });

    newSocket.on('sensorData', (data) => {
      // Validate incoming data
      if (!data || typeof data !== 'object') {
        console.error('Invalid data received:', data);
        return;
      }
      
      const timestamp = new Date().toISOString();
      // Use incoming data or default values if not available
      const sensorValues = {
        timestamp,
        EMG1: data?.EMG1 ?? 500,
        EMG2: data?.EMG2 ?? 600,
        Voltage1: data?.Voltage1 ?? 3.3,
        Voltage2: data?.Voltage2 ?? 3.5,
        GyroX: data?.GyroX ?? 0.5,
        GyroY: data?.GyroY ?? -0.3,
        GyroZ: data?.GyroZ ?? 0.1,
        Roll: data?.Roll ?? 0,
        Pitch: data?.Pitch ?? 0,
        Yaw: data?.Yaw ?? 0,
        wristAngle: null // Will be updated when hand is detected
      };

      // Log data occasionally to avoid console spam
      if (Math.random() < 0.05) {
        console.log('Received sensor data:', sensorValues);
      }
      
      // Add to buffer for smoothing
      setSensorBuffer(prev => {
        const newBuffer = [...prev, sensorValues];
        // Keep buffer at fixed size
        if (newBuffer.length > BUFFER_SIZE) {
          return newBuffer.slice(newBuffer.length - BUFFER_SIZE);
        }
        return newBuffer;
      });
    });

    // Add a ping mechanism to keep the connection alive
    const pingInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      } else {
        console.log('Socket not connected, attempting to reconnect...');
        newSocket.connect();
      }
    }, 10000);

    // If no Arduino connection, simulate data every 100ms
    const simulateData = setInterval(() => {
      const timestamp = new Date().toISOString();
      const simulatedValues = {
        timestamp,
        EMG1: 500 + Math.random() * 100,
        EMG2: 600 + Math.random() * 100,
        GyroX: 0.5 + Math.random() * 0.2,
        GyroY: -0.3 + Math.random() * 0.2,
        GyroZ: 0.1 + Math.random() * 0.2,
        Roll: Math.sin(Date.now() / 1000) * 45,  // Simulate rotation
        Pitch: Math.cos(Date.now() / 1000) * 30,
        Yaw: (Date.now() % 3600) / 10,  // Slowly increasing yaw
        wristAngle: null
      };

      // Add to buffer for smoothing
      setSensorBuffer(prev => {
        const newBuffer = [...prev, simulatedValues];
        // Keep buffer at fixed size
        if (newBuffer.length > BUFFER_SIZE) {
          return newBuffer.slice(newBuffer.length - BUFFER_SIZE);
        }
        return newBuffer;
      });
    }, 100);

    return () => {
      newSocket.disconnect();
      clearInterval(simulateData);
      clearInterval(pingInterval);
    };
  }, []);

  // Apply smoothing when buffer changes
  useEffect(() => {
    if (sensorBuffer.length === 0) return;
    
    // Only process when we have enough data for smoothing
    if (sensorBuffer.length >= BUFFER_SIZE) {
      try {
        // Create a deep copy of the buffer to avoid mutation issues
        const bufferCopy = JSON.parse(JSON.stringify(sensorBuffer));
        
        // Apply smoothing to each property individually
        const smoothedData = { ...bufferCopy[bufferCopy.length - 1] };
        
        // Apply exponential smoothing to gyroscope data
        smoothedData.GyroX = exponentialMovingAverage(
          bufferCopy.map(item => item.GyroX || 0), 
          SMOOTHING_ALPHA
        )[bufferCopy.length - 1];
        
        smoothedData.GyroY = exponentialMovingAverage(
          bufferCopy.map(item => item.GyroY || 0), 
          SMOOTHING_ALPHA
        )[bufferCopy.length - 1];
        
        smoothedData.GyroZ = exponentialMovingAverage(
          bufferCopy.map(item => item.GyroZ || 0), 
          SMOOTHING_ALPHA
        )[bufferCopy.length - 1];
        
        // Apply low-pass filter to orientation data
        smoothedData.Roll = lowPassFilter(
          bufferCopy.map(item => item.Roll || 0), 
          0.1
        )[bufferCopy.length - 1];
        
        smoothedData.Pitch = lowPassFilter(
          bufferCopy.map(item => item.Pitch || 0), 
          0.1
        )[bufferCopy.length - 1];
        
        smoothedData.Yaw = lowPassFilter(
          bufferCopy.map(item => item.Yaw || 0), 
          0.1
        )[bufferCopy.length - 1];
        
        // Add to session data
        setSessionData(prev => [...prev, smoothedData]);
        setSmoothedData(prev => [...prev, smoothedData]);
      } catch (err) {
        console.error('Error in smoothing data:', err);
        // Fallback to using the raw data
        setSessionData(prev => [...prev, sensorBuffer[sensorBuffer.length - 1]]);
      }
    } else {
      // If not enough data for smoothing, just use the raw data
      setSessionData(prev => [...prev, sensorBuffer[sensorBuffer.length - 1]]);
    }
  }, [sensorBuffer]);

  const handleEndSession = () => {
    // Stop data collection immediately
    if (socket) {
      socket.off('sensorData');
    }
    
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
        const response = await fetch('http://localhost:5000/api/cors-test');
        const data = await response.json();
        console.log('CORS test result:', data);
      } catch (err) {
        console.error('CORS test failed:', err);
      }
    };
    
    testCors();
  }, []);

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div className="relative bg-[#2a2a2a] rounded-xl p-6 shadow-xl transition-all duration-500">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
          {error}
        </div>
      )}
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
          <SensorData />
          <DataDebugger socket={socket} sensorBuffer={sensorBuffer} />
        </>
      ) : (
        <SessionReport sessionData={sessionData} />
      )}
    </div>
  );
}

export default WebcamCapture; 