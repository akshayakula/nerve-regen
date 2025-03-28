# Nerve Regeneration Hand Tracking System

A real-time hand tracking and EMG signal visualization system that combines webcam-based motion tracking with Arduino-based EMG sensors for monitoring nerve regeneration progress.

## Features

- Real-time hand tracking using TensorFlow.js
- EMG signal visualization from two channels
- Motion tracking with MPU6050 (gyroscope and accelerometer)
- Interactive data visualization with real-time charts
- Session recording and analysis
- Responsive web interface

## System Components

1. **Arduino Hardware**: EMG sensors and motion data collection
2. **Node.js Backend**: Data processing and API server
3. **React Frontend**: Real-time visualization and user interface

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Arduino IDE
- Arduino Uno or compatible board
- EMG sensors (MAX4466 amplifier modules x2)
- MPU6050 module
- Webcam

### Installation

1. **Arduino Setup**
   ```bash
   # Upload the Arduino sketch from the arduino directory
   cd arduino
   # Open EMG_Motion_Sensor.ino in Arduino IDE and upload
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start   # Runs on port 5001
   ```

3. **Frontend Setup**
   ```bash
   cd hand-tracking-app
   npm install
   npm start   # Opens http://localhost:3000
   ```

### Hardware Configuration

#### EMG Sensors
- Connect MAX4466 modules to Arduino:
  - EMG1: VCC → 3.3V, GND → GND, OUT → A0
  - EMG2: VCC → 3.3V, GND → GND, OUT → A1

#### MPU6050
- Connect to Arduino:
  - VCC → 3.3V
  - GND → GND
  - SCL → A5
  - SDA → A4

## Usage

1. Start the backend and frontend servers
2. Allow webcam access when prompted
3. Position your hand in view of the webcam
4. Click "Start" to begin tracking
5. View real-time data visualization
6. End session to see analysis

### Troubleshooting

- **No Arduino Connection**: Check USB connection and COM port
- **Poor EMG Signal**: Verify sensor connections and electrode placement
- **Tracking Issues**: Ensure good lighting and clear webcam view

## Contributing

Contributions are welcome! Please submit pull requests for any improvements.

## License

This project is licensed under the MIT License.
