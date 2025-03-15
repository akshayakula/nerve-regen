import React from 'react';
import { Button } from './components/ui/button';

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Hand Tracking Web App</h1>
        <div className="space-y-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </div>
  );
}

export default App;
