const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hand-tracking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Arduino Setup
let arduinoPort;
try {
  // List available ports and connect to Arduino
  SerialPort.list().then(ports => {
    const arduinoPortInfo = ports.find(port => port.manufacturer?.includes('Arduino'));
    if (arduinoPortInfo) {
      arduinoPort = new SerialPort({
        path: arduinoPortInfo.path,
        baudRate: 9600
      });

      arduinoPort.on('open', () => {
        console.log('Serial port opened');
      });

      arduinoPort.on('data', (data) => {
        console.log('Received data from Arduino:', data.toString());
      });

      arduinoPort.on('error', (err) => {
        console.error('Serial port error:', err);
      });
    } else {
      console.log('No Arduino found');
    }
  });
} catch (err) {
  console.error('Error setting up Arduino:', err);
}

// Routes
app.post('/api/user-data', async (req, res) => {
  try {
    const { formData, handData } = req.body;
    // TODO: Save to MongoDB
    console.log('Received data:', { formData, handData });
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
