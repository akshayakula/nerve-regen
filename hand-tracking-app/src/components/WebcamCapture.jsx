import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import SensorData from './SensorData';
import SessionReport from './SessionReport';
import { Button } from './ui/button';

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
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('sensorData', (data) => {
      const timestamp = new Date().toISOString();
      // Use incoming data or default values if not available
      const sensorValues = {
        EMG1: data?.EMG1 ?? 500,
        EMG2: data?.EMG2 ?? 600,
        Voltage1: data?.Voltage1 ?? 3.3,
        Voltage2: data?.Voltage2 ?? 3.5,
        GyroX: data?.GyroX ?? 0.5,
        GyroY: data?.GyroY ?? -0.3,
        GyroZ: data?.GyroZ ?? 0.1
      };

      setSessionData(prev => [...prev, {
        timestamp,
        ...sensorValues,
        wristAngle: null // Will be updated when hand is detected
      }]);
    });

    // If no Arduino connection, simulate data every 100ms
    const simulateData = setInterval(() => {
      const timestamp = new Date().toISOString();
      setSessionData(prev => [...prev, {
        timestamp,
        EMG1: 500 + Math.random() * 100,
        EMG2: 600 + Math.random() * 100,
        GyroX: 0.5 + Math.random() * 0.2,
        GyroY: -0.3 + Math.random() * 0.2,
        GyroZ: 0.1 + Math.random() * 0.2,
        wristAngle: null
      }]);
    }, 100);

    return () => {
      newSocket.disconnect();
      clearInterval(simulateData);
    };
  }, []);

  const handleEndSession = () => {
    setShowWebcam(false);
    // Stop the webcam
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div className="relative bg-[#2a2a2a] rounded-xl p-6 shadow-xl transition-all duration-500">
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
        </>
      ) : (
        <SessionReport sessionData={sessionData} />
      )}
    </div>
  );
}

export default WebcamCapture; 