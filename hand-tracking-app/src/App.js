import React, { useState } from 'react';
import { Button } from './components/ui/button';
import WizardForm from './components/WizardForm';

function App() {
  const [showForm, setShowForm] = useState(false);

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
        ) : (
          <WizardForm />
        )}
      </div>
    </div>
  );
}

export default App;
