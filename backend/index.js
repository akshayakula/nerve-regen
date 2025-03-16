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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

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
    
    arduinoPort.on('open', () => {
      console.log('Serial port open');
    });
    
    parser.on('data', data => {
      // Log raw data from Arduino
      console.log('Raw Arduino data:', data);
      
      try {
        const sensorData = JSON.parse(data);
        console.log('Data received:', sensorData);
        io.emit('sensorData', sensorData);
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
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // If no Arduino is connected, send simulated data
  if (!arduinoPort) {
    const interval = setInterval(() => {
      const simulatedData = {
        EMG1: 500 + Math.random() * 100,
        EMG2: 600 + Math.random() * 100,
        GyroX: 0.5 + Math.random() * 0.2,
        GyroY: -0.3 + Math.random() * 0.2,
        GyroZ: 0.1 + Math.random() * 0.2,
        Roll: Math.sin(Date.now() / 1000) * 45,
        Pitch: Math.cos(Date.now() / 1000) * 30,
        Yaw: (Date.now() % 3600) / 10
      };
      socket.emit('sensorData', simulatedData);
    }, 100);
    
    socket.on('disconnect', () => {
      clearInterval(interval);
      console.log('Client disconnected');
    });
  } else {
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  }
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

// Error handling
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});