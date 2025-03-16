import React from 'react';
import { Button } from './ui/button';

function LearnMore({ onBack }) {
  return (
    <div className="animate-fadeIn">
      <div className="bg-[#2a2a2a] rounded-xl p-8 shadow-xl">
        <h1 className="text-4xl font-bold font-poppins mb-6 text-white">
          About Regen Project
        </h1>
        
        <div className="space-y-6 text-gray-300">
          <p className="text-lg">
            Welcome to the H2AI Hackathon's Regen Project - an innovative approach to tracking and analyzing hand movements
            for individuals with Parkinson's disease.
          </p>

          <div className="space-y-4">
            <h2 className="text-2xl font-poppins text-white">Key Features</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Real-time hand tracking using TensorFlow.js</li>
              <li>Precise wrist angle measurements</li>
              <li>Integration with Arduino sensors for comprehensive data collection</li>
              <li>Secure data storage for longitudinal analysis</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-poppins text-white">Our Mission</h2>
            <p>
              To provide healthcare professionals and researchers with accurate, real-time data for better understanding and 
              treating movement disorders. By combining machine learning with accessible technology, we aim to make movement 
              analysis more accessible and informative.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-poppins text-white">How It Works</h2>
            <p>
              Using your device's webcam and our advanced hand tracking algorithms, we capture precise measurements of hand 
              movements and wrist angles. This data is enhanced with EMG readings from Arduino sensors, providing a 
              comprehensive view of motor function.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={onBack}
            className="bg-[#4F4099] hover:bg-[#3d3277] text-white px-8 py-3 rounded-lg text-lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LearnMore; 