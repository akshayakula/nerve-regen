import React, { useState } from 'react';
import { Button } from './components/ui/button';
import WizardForm from './components/WizardForm';
import WebcamCapture from './components/WebcamCapture';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = (formData) => {
    console.log('Form data:', formData);
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        {!showForm ? (
          <>
            <h1 className="text-4xl font-bold mb-8">Hand Tracking Web App</h1>
            <div className="space-y-4">
              <Button onClick={() => setShowForm(true)}>Get Started</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </>
        ) : formSubmitted ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Hand Tracking</h2>
            <WebcamCapture />
          </div>
        ) : (
          <WizardForm onSubmit={handleFormSubmit} />
        )}
      </div>
    </div>
  );
}

export default App;
