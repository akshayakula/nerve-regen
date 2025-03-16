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
  path: '/dev/ttyACM0',
  baudRate: 115200,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Handle Serial Data
parser.on('data', (data) => {
  try {
    // Parse the new data format
    const values = data.split(' ').reduce((acc, curr) => {
      const [key, value] = curr.split(':');
      acc[key] = parseFloat(value);
      return acc;
    }, {});
    
    // Format data for frontend
    const formattedData = {
      EMG1: values.EMG1,
      EMG2: values.EMG2,
      Voltage1: values.Voltage1,
      Voltage2: values.Voltage2,
      GyroX: values.GyroX,
      GyroY: values.GyroY,
      GyroZ: values.GyroZ
    };
    
    io.emit('sensorData', formattedData);
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