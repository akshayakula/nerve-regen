import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import SensorData from './SensorData';
import Timer from './Timer';
import SessionReport from './SessionReport';

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

              // Add labels
              ctx.font = '12px Inter';
              ctx.fillStyle = 'white';
              ctx.fillText(`Point ${index}`, point[0] + 10, point[1] + 10);
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
      setSessionData(prev => [...prev, {
        timestamp,
        emg: data.EMG,
        voltage: data.Voltage,
        gyroX: data.GyroX,
        gyroY: data.GyroY,
        gyroZ: data.GyroZ,
        wristAngle: null // Will be updated when hand is detected
      }]);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleTimerComplete = () => {
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
          <Timer onComplete={handleTimerComplete} />
          <SensorData />
        </>
      ) : (
        <SessionReport sessionData={sessionData} />
      )}
    </div>
  );
}

export default WebcamCapture; 