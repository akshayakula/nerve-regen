import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

function WebcamCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [handData, setHandData] = useState(null);

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
          
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Get hand landmarks
          const hands = await model.estimateHands(video);
          
          if (hands.length > 0) {
            const hand = hands[0];
            setHandData(hand);
            
            // Draw connecting lines
            ctx.strokeStyle = '#4F4099';
            ctx.lineWidth = 2;

            // Draw palm
            const palm = hand.annotations.palmBase[0];
            hand.annotations.thumb.forEach((point, i) => {
              if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(palm[0], palm[1]);
                ctx.lineTo(point[0], point[1]);
                ctx.stroke();
              }
            });

            // Draw fingers
            ['thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'pinky'].forEach(finger => {
              const points = hand.annotations[finger];
              ctx.beginPath();
              ctx.moveTo(points[0][0], points[0][1]);
              points.forEach((point) => {
                ctx.lineTo(point[0], point[1]);
              });
              ctx.stroke();
            });

            // Draw landmarks
            hand.landmarks.forEach((point, index) => {
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
            const wrist = hand.annotations.palmBase[0];
            const middleFinger = hand.annotations.middleFinger[0];
            const angle = Math.atan2(
              middleFinger[1] - wrist[1],
              middleFinger[0] - wrist[0]
            ) * 180 / Math.PI;

            // Draw angle display
            ctx.font = '16px Inter';
            ctx.fillStyle = 'white';
            ctx.fillText(`Wrist Angle: ${angle.toFixed(2)}°`, 10, 30);
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

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div className="relative bg-[#2a2a2a] rounded-xl p-6 shadow-xl">
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
        className="rounded-lg shadow-lg transform scale-x-[-1]"
        width="640"
        height="480"
      />
      {handData && (
        <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-white">Hand Data</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            {handData.landmarks.map((point, index) => (
              <div key={index}>
                Point {index}: ({point[0].toFixed(1)}, {point[1].toFixed(1)}, {point[2].toFixed(1)})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WebcamCapture; 