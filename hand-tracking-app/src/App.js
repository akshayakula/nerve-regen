import React, { useState } from 'react';
import { Button } from './components/ui/button';
import WizardForm from './components/WizardForm';
import WebcamCapture from './components/WebcamCapture';
import '@fontsource/inter';
import '@fontsource/poppins';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = (formData) => {
    console.log('Form data:', formData);
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl transition-all duration-300 ease-in-out">
          {!showForm ? (
            <div className="text-center space-y-8 animate-fadeIn">
              <h1 className="text-5xl font-bold font-poppins mb-8 text-white">
                Hand Tracking Web App
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
                  className="border-[#4F4099] text-[#4F4099] hover:bg-[#4F4099] hover:text-white px-8 py-3 rounded-lg text-lg flex-1 sm:flex-initial"
                >
                  Learn More
                </Button>
              </div>
            </div>
          ) : formSubmitted ? (
            <div className="animate-slideIn">
              <h2 className="text-3xl font-bold font-poppins mb-8">Hand Tracking</h2>
              <WebcamCapture />
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
