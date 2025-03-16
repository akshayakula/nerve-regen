import React, { useState, useEffect } from 'react';

function DataDebugger({ sensorBuffer }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [lastDataTimestamp, setLastDataTimestamp] = useState(null);
  const [dataRate, setDataRate] = useState(0);
  const [dataPoints, setDataPoints] = useState(0);
  
  useEffect(() => {
    // Set connection status based on data flow
    if (sensorBuffer && sensorBuffer.length > 0) {
      setConnectionStatus('Connected');
    }
  }, [sensorBuffer]);
  
  // Calculate data rate
  useEffect(() => {
    if (sensorBuffer.length === 0) return;
    
    const now = Date.now();
    setDataPoints(prev => prev + 1);
    
    if (lastDataTimestamp) {
      const timeDiff = now - lastDataTimestamp;
      if (timeDiff > 0) {
        // Calculate data rate as points per second
        setDataRate(1000 / timeDiff);
      }
    }
    
    setLastDataTimestamp(now);
  }, [sensorBuffer, lastDataTimestamp]);
  
  if (!isExpanded) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-[#1a1a1a] p-2 rounded-lg cursor-pointer z-50"
        onClick={() => setIsExpanded(true)}
      >
        <span className="text-white text-xs">Debug</span>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-[#1a1a1a] p-4 rounded-lg shadow-xl z-50 w-80">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white text-sm font-bold">Data Debugger</h3>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(false)}
        >
          ✕
        </button>
      </div>
      
      <div className="text-xs text-gray-300 space-y-1">
        <div className="flex justify-between">
          <span>Connection:</span>
          <span className={
            connectionStatus === 'Connected' ? 'text-green-400' : 
            connectionStatus === 'Disconnected' ? 'text-red-400' : 'text-yellow-400'
          }>
            {connectionStatus}
          </span>
        </div>
        
        {connectionStatus !== 'Connected' && (
          <div className="text-yellow-400 text-xs mt-1">
            Waiting for data...
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Data Rate:</span>
          <span>{dataRate.toFixed(1)} Hz</span>
        </div>
        
        <div className="flex justify-between">
          <span>Data Points:</span>
          <span>{dataPoints}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Buffer Size:</span>
          <span>{sensorBuffer.length}</span>
        </div>
        
        {sensorBuffer.length > 0 && (
          <div className="mt-2">
            <div className="text-white font-bold mb-1">Latest Data:</div>
            <div className="bg-[#2a2a2a] p-2 rounded text-gray-300 overflow-auto max-h-32">
              <pre className="text-xs">
                {JSON.stringify(sensorBuffer[sensorBuffer.length - 1], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataDebugger; 