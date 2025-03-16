const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());
app.use(express.json());

const server = require('http').createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Arduino Serial Configuration
const port = new SerialPort({
  path: '/dev/ttyACM0', // Update this based on your Arduino port
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Handle Serial Data
parser.on('data', (data) => {
  try {
    // Expecting data in format: "EMG:123 Voltage:3.5"
    const values = data.split(' ').reduce((acc, curr) => {
      const [key, value] = curr.split(':');
      acc[key] = parseFloat(value);
      return acc;
    }, {});
    
    // Broadcast data to all connected clients
    io.emit('sensorData', values);
  } catch (err) {
    console.error('Error parsing Arduino data:', err);
  }
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected');

  // Handle wrist angle updates from frontend
  socket.on('wristAngle', (angle) => {
    // Send angle to Arduino
    port.write(`ANGLE:${angle}\n`, (err) => {
      if (err) {
        console.error('Error writing to Arduino:', err);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 