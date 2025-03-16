const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const socketIo = require('socket.io');
const errorHandler = require('./middleware/errorHandler');
const userDataRoutes = require('./routes/userData');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
});

// Try to use different ports if the preferred one is in use
const preferredPort = process.env.PORT || 5001;
let port = preferredPort;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Arduino connection setup
let arduinoPort = null;

async function findArduino() {
  try {
    const ports = await SerialPort.list();
    const arduino = ports.find(port => 
      port.manufacturer && 
      (port.manufacturer.includes('Arduino') || 
       port.manufacturer.includes('wch.cn'))
    );
    
    if (arduino) {
      console.log('Arduino found on port:', arduino.path);
      connectToArduino(arduino.path);
    } else {
      console.log('Arduino not found. Available ports:');
      console.log(ports);
      console.log('Starting with simulated data');
    }
  } catch (err) {
    console.error('Error finding Arduino:', err);
  }
}

function connectToArduino(path) {
  try {
    arduinoPort = new SerialPort({ path, baudRate: 9600 });
    const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    // Buffer to collect partial JSON
    let jsonBuffer = '';
    
    // Buffer for smoothing
    let dataBuffer = [];
    const BUFFER_SIZE = 5;
    
    // Track data rate
    let dataCount = 0;
    let lastDataRateCheck = Date.now();
    
    arduinoPort.on('open', () => {
      console.log('Serial port open');
      
      // Send a ping to Arduino to check if it's responsive
      setTimeout(() => {
        if (dataCount === 0) {
          console.log('No data received from Arduino yet. Checking connection...');
        }
      }, 3000);
    });
    
    parser.on('data', data => {
      // Increment data counter
      dataCount++;
      
      // Log data rate every 5 seconds
      const now = Date.now();
      if (now - lastDataRateCheck > 5000) {
        const rate = dataCount / ((now - lastDataRateCheck) / 1000);
        console.log(`Arduino data rate: ${rate.toFixed(1)} Hz (${dataCount} points in 5s)`);
        dataCount = 0;
        lastDataRateCheck = now;
      }
      
      // Log raw data occasionally to avoid console spam
      if (Math.random() < 0.1) {
        console.log('Raw Arduino data:', data);
      }
      
      try {
        // Try to parse as JSON
        let sensorData;
        try {
          sensorData = JSON.parse(data);
          jsonBuffer = ''; // Reset buffer on successful parse
        } catch (e) {
          // If parsing fails, it might be partial data
          jsonBuffer += data;
          try {
            // Try to parse the accumulated buffer
            sensorData = JSON.parse(jsonBuffer);
            jsonBuffer = ''; // Reset buffer on successful parse
          } catch (e) {
            // Still not valid JSON, keep accumulating
            if (jsonBuffer.length > 1000) {
              // Buffer is too large, reset it
              console.error('JSON buffer overflow, resetting');
              jsonBuffer = '';
            } else {
              console.log('Accumulating partial JSON data, current length:', jsonBuffer.length);
            }
            return;
          }
        }
        
        // Validate data structure
        if (!sensorData || typeof sensorData !== 'object') {
          console.error('Invalid data structure:', sensorData);
          return;
        }
        
        // Store the latest data
        sensorData.timestamp = Date.now();
        latestSensorData = sensorData;
        
        // Log parsed data occasionally
        if (Math.random() < 0.05) {
          console.log('Data received:', sensorData);
        }
        
        // Apply server-side smoothing
        dataBuffer.push(sensorData);
        if (dataBuffer.length > BUFFER_SIZE) {
          dataBuffer.shift(); // Remove oldest data point
          
          // Simple averaging for gyroscope data
          const smoothedData = {
            EMG1: sensorData.EMG1,
            EMG2: sensorData.EMG2,
            GyroX: dataBuffer.reduce((sum, item) => sum + item.GyroX, 0) / dataBuffer.length,
            GyroY: dataBuffer.reduce((sum, item) => sum + item.GyroY, 0) / dataBuffer.length,
            GyroZ: dataBuffer.reduce((sum, item) => sum + item.GyroZ, 0) / dataBuffer.length,
            Roll: sensorData.Roll,
            Pitch: sensorData.Pitch,
            Yaw: sensorData.Yaw
          };
          
          // Send smoothed data to clients
          io.emit('sensorData', smoothedData);
        } else {
          // Not enough data for smoothing yet, send raw data
          io.emit('sensorData', sensorData);
        }
      } catch (e) {
        console.error('Error parsing data as JSON:', e.message);
        console.error('Failed data was:', data);
      }
    });
    
    arduinoPort.on('error', err => {
      console.error('Serial port error:', err.message);
    });
  } catch (err) {
    console.error('Error connecting to Arduino:', err);
  }
}

findArduino();

// Socket.io connection
io.engine.on("connection_error", (err) => {
  console.log(`Connection error: ${err.code} - ${err.message}`);
});

// Configure socket.io for better stability
io.on('disconnect', (reason) => {
  console.log(`Socket disconnected: ${reason}`);
});

io.on('reconnect', (attemptNumber) => {
  console.log(`Socket reconnected after ${attemptNumber} attempts`);
});

io.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Socket reconnection attempt #${attemptNumber}`);
});

io.on('reconnect_error', (error) => {
  console.log(`Socket reconnection error: ${error}`);
});

io.on('reconnect_failed', () => {
  console.log('Socket reconnection failed');
});

io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Debug all socket events
  const originalOn = socket.on;
  socket.on = function(event, handler) {
    if (event !== 'newListener' && event !== 'removeListener') {
      console.log(`Socket registered listener for: ${event}`);
    }
    return originalOn.call(this, event, function(...args) {
      if (event !== 'newListener' && event !== 'removeListener') {
        console.log(`Socket RECEIVED: ${event}`, args);
      }
      return handler.apply(this, args);
    });
  };
  
  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    console.log(`Socket EMIT: ${event}`, args);
    return originalEmit.apply(this, [event, ...args]);
  };
  
  // Send connection status to client
  socket.emit('connectionStatus', { 
    connected: true, 
    arduinoConnected: arduinoPort !== null 
  });
  
  // Handle explicit data requests
  socket.on('requestData', () => {
    console.log('EXPLICITLY received requestData event from client');
    
    // If Arduino is connected, we'll send real data in the next cycle
    // If not, send simulated data immediately
    if (!arduinoPort) {
      const simulatedData = generateSimulatedData();
      console.log('Sending simulated data in response to requestData:', simulatedData);
      socket.emit('sensorData', simulatedData);
    }
  });
  
  // Handle echo for testing
  socket.on('echo', (data) => {
    console.log('Received echo request:', data);
    if (data && data.event) {
      socket.emit(data.event, { 
        echo: true, 
        received: data,
        timestamp: Date.now(),
        message: 'Echo successful'
      });
    }
  });
  
  // Handle ping from client
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
  
  // Handle explicit disconnect request
  socket.on('forceDisconnect', () => {
    console.log('Client requested explicit disconnect');
    socket.disconnect(true);
  });
  
  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${reason}`);
    // Clean up any resources specific to this client
  });
  
  // If no Arduino is connected, send simulated data
  if (!arduinoPort) {
    console.log('No Arduino connected, sending simulated data');
    const interval = setInterval(() => {
      const simulatedData = generateSimulatedData();
      // Log every 10th simulated data point to avoid console spam
      if (Math.random() < 0.1) {
        console.log('Sending simulated data:', simulatedData);
      }
      socket.emit('sensorData', simulatedData);
    }, 100);
    
    socket.on('disconnect', () => {
      clearInterval(interval);
      console.log('Client disconnected');
    });
  } else {
    // Let the client know we have a real Arduino connection
    socket.emit('arduinoStatus', { connected: true, path: arduinoPort.path });
    
    // Send a test data point to verify data flow
    socket.emit('sensorData', {
      EMG1: 500,
      EMG2: 600,
      GyroX: 0,
      GyroY: 0,
      GyroZ: 0,
      Roll: 0,
      Pitch: 0,
      Yaw: 0,
      timestamp: Date.now(),
      isTestData: true
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  }
  
  // Handle wrist angle data from frontend
  socket.on('wristAngle', (angle) => {
    // Log occasionally to avoid console spam
    if (Math.random() < 0.05) {
      console.log('Received wrist angle from frontend:', angle);
    }
    // You could send this back to Arduino if needed
  });
});

// Routes
app.use('/api/user-data', userDataRoutes);

// Arduino status route
app.get('/api/arduino-status', (req, res) => {
  res.json({
    connected: arduinoPort !== null,
    ports: SerialPort.list().then(ports => ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer || 'Unknown'
    })))
  });
});

// Test route for CORS
app.get('/api/cors-test', (req, res) => {
  res.json({ message: 'CORS is working' });
});

// Server status route for diagnostics
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    socketConnections: io.engine.clientsCount,
    arduinoConnected: arduinoPort !== null
  });
});

// Create a route to tell clients which port we're actually using
app.get('/api/port', (req, res) => {
  res.json({ port });
});

// Latest sensor data endpoint
let latestSensorData = generateSimulatedData(); // Initialize with simulated data

// Update latest sensor data periodically
setInterval(() => {
  if (!arduinoPort) {
    // If no Arduino, update with simulated data
    latestSensorData = generateSimulatedData();
  }
  // If Arduino is connected, latestSensorData will be updated in the data handler
}, 100);

// Endpoint to get the latest sensor data
app.get('/api/sensor-data', (req, res) => {
  // Add a timestamp if not present
  if (!latestSensorData.timestamp) {
    latestSensorData.timestamp = Date.now();
  }
  
  res.json(latestSensorData);
});

// Diagnostics route for connection testing
app.get('/api/diagnostics', (req, res) => {
  res.json({
    server: {
      uptime: process.uptime(),
      timestamp: Date.now(),
      port: port,
      nodeVersion: process.version,
      platform: process.platform
    },
    socket: {
      connections: io.engine.clientsCount,
      transports: io.engine.opts.transports
    },
    arduino: {
      connected: arduinoPort !== null,
      path: arduinoPort ? arduinoPort.path : null,
      dataRate: arduinoPort ? 'Active' : 'Simulated'
    },
    memory: {
      rss: process.memoryUsage().rss / 1024 / 1024,
      heapTotal: process.memoryUsage().heapTotal / 1024 / 1024,
      heapUsed: process.memoryUsage().heapUsed / 1024 / 1024
    }
  });
});

// Data flow diagnostic endpoint
app.get('/api/data-test', (req, res) => {
  const testData = generateSimulatedData();
  testData.timestamp = Date.now();
  testData.isTestData = true;
  
  // Broadcast to all connected clients
  io.emit('sensorData', testData);
  
  res.json({
    success: true,
    message: 'Test data sent to all clients',
    clientCount: io.engine.clientsCount,
    testData
  });
});

// Error handling
app.use(errorHandler);

function startServer(portToUse) {
  server.listen(portToUse)
    .on('listening', () => {
      port = portToUse;
      console.log(`Server running on port ${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${portToUse} is busy, trying ${portToUse + 1}...`);
        startServer(portToUse + 1);
      } else {
        console.error('Server error:', err);
      }
    });
}

// Start the server with the preferred port
startServer(preferredPort);

// Helper function to generate simulated data
function generateSimulatedData() {
  return {
    EMG1: 500 + Math.random() * 100,
    EMG2: 600 + Math.random() * 100,
    GyroX: 0.5 + Math.random() * 0.2,
    GyroY: -0.3 + Math.random() * 0.2,
    GyroZ: 0.1 + Math.random() * 0.2,
    Roll: Math.sin(Date.now() / 1000) * 45,
    Pitch: Math.cos(Date.now() / 1000) * 30,
    Yaw: (Date.now() % 3600) / 10
  };
}