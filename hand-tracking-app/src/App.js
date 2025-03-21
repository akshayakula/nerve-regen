import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import WizardForm from './components/WizardForm';
import WebcamCapture from './components/WebcamCapture';
import LearnMore from './components/LearnMore';
import ConnectionTester from './components/ConnectionTester';
import '@fontsource/inter';
import '@fontsource/poppins';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [serverPort, setServerPort] = useState(null);

  const handleFormSubmit = (formData) => {
    console.log('Form data:', formData);
    setFormSubmitted(true);
  };

  useEffect(() => {
    const testDirectConnection = async () => {
      try {
        console.log('Testing direct connection to port 5001...');
        const response = await fetch('http://localhost:5001/api/status');
        if (response.ok) {
          const data = await response.json();
          console.log('Direct connection successful:', data);
        } else {
          console.error('Direct connection failed with status:', response.status);
        }
      } catch (err) {
        console.error('Direct connection test failed:', err);
      }
    };
    
    testDirectConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl transition-all duration-300 ease-in-out">
          {showLearnMore ? (
            <LearnMore onBack={() => setShowLearnMore(false)} />
          ) : !showForm ? (
            <div className="text-center space-y-8 animate-fadeIn">
              <h1 className="text-5xl font-bold font-poppins mb-8 text-white">
              Regen - EMG and Motion Analysis
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Track and analyze hand movements with precision
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-[#4F4099] hover:bg-[#3d3277] text-white px-8 py-3 rounded-lg text-lg flex-1 sm:flex-initial"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowLearnMore(true)}
                  className="border-[#4F4099] text-[#4F4099] hover:bg-[#4F4099] hover:text-white px-8 py-3 rounded-lg text-lg flex-1 sm:flex-initial"
                >
                  Learn More
                </Button>
              </div>
            </div>
          ) : formSubmitted ? (
            <div className="animate-slideIn">
              {!connectionTested ? (
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl text-center mb-6">Connection Test</h2>
                  <p className="text-gray-400 text-center mb-8">
                    Before starting, let's make sure your device can connect to the backend server.
                  </p>
                  <ConnectionTester 
                    onConnectionSuccess={(port) => {
                      setConnectionTested(true);
                      setServerPort(5001);
                    }} 
                  />
                </div>
              ) : (
                <WebcamCapture initialPort={5001} />
              )}
            </div>
          ) : (
            <div className="animate-slideIn">
              <WizardForm onSubmit={handleFormSubmit} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
