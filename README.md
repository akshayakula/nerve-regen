# EMG and Motion Tracking System

A comprehensive system for capturing, visualizing, and analyzing electromyography (EMG) signals and motion data from an Arduino-based sensor setup, combined with webcam-based hand tracking.

![System Screenshot](docs/images/system-screenshot.png)

## Features

- Real-time EMG signal visualization from two channels
- 3D motion tracking with MPU6050 (gyroscope and accelerometer)
- Webcam-based hand tracking with TensorFlow.js
- Data synchronization between physical sensors and visual tracking
- Interactive data visualization with real-time charts
- Session recording and analysis
- Responsive web interface

## System Architecture

The system consists of three main components:

1. **Arduino Hardware**: Collects EMG signals and motion data
2. **Node.js Backend**: Processes sensor data and serves it to the frontend
3. **React Frontend**: Visualizes data and provides user interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Arduino IDE
- Arduino Uno or compatible board
- MAX4466 amplifier modules (x2)
- MPU6050 gyroscope/accelerometer module
- Electrodes for EMG sensing
- Webcam

### Hardware Setup

#### Arduino Wiring Diagram

![Arduino Wiring Diagram](docs/images/arduino-wiring.png)

#### EMG Sensor Setup (MAX4466)

1. Connect the MAX4466 amplifier modules to the Arduino:
   - MAX4466 #1 (EMG1):
     - VCC → 3.3V on Arduino
     - GND → GND on Arduino
     - OUT → A0 on Arduino
   - MAX4466 #2 (EMG2):
     - VCC → 3.3V on Arduino
     - GND → GND on Arduino
     - OUT → A1 on Arduino

2. Electrode Placement:
   - For each EMG channel, you'll need 3 electrodes:
     - Positive electrode: Place on the muscle belly
     - Negative electrode: Place on the tendon or bone near the muscle
     - Reference electrode: Place on a neutral area (e.g., bony prominence)
   - Connect the electrodes to the MAX4466 input using shielded cables

#### MPU6050 Setup

1. Connect the MPU6050 to the Arduino:
   - VCC → 3.3V on Arduino
   - GND → GND on Arduino
   - SCL → A5 on Arduino
   - SDA → A4 on Arduino
   - INT → D2 on Arduino (optional, for interrupt-based reading)

### Software Installation

#### Arduino Setup

1. Install the required libraries in Arduino IDE:
   - `Wire.h` (included with Arduino IDE)
   - `MPU6050.h` (Install via Library Manager)

2. Upload the Arduino sketch:
   ```
   cd arduino
   // Open EMG_Motion_Sensor.ino in Arduino IDE and upload to your board
   ```

#### Backend Setup

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Start the backend server:
   ```
   npm start
   ```
   The server will run on port 5001 by default.

#### Frontend Setup

1. Install dependencies:
   ```
   cd hand-tracking-app
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```
   The application will open in your browser at http://localhost:3000

## Usage

1. Complete the "Getting Started" form to set up your session
2. Allow webcam access when prompted
3. Position your hand in the webcam view
4. Click "Start Polling" to begin receiving sensor data
5. Perform movements to see real-time data visualization
6. Click "End Session" when finished to view your session report

### Calibration

For best results, calibrate the system before each use:

1. Keep your hand still in a neutral position
2. Click "Calibrate" in the interface
3. Follow the on-screen instructions

### Electrode Placement Tips

- Clean the skin with alcohol before placing electrodes
- Use conductive gel to improve signal quality
- Secure electrodes with medical tape to prevent movement
- Place electrodes along the muscle fiber direction
- Maintain consistent electrode spacing (2-3 cm apart)

## Troubleshooting

### Common Issues

#### No Arduino Connection
- Check that the Arduino is properly connected via USB
- Verify the correct COM port is being used
- Ensure the correct Arduino sketch is uploaded

#### Poor EMG Signal Quality
- Check electrode placement and contact
- Verify MAX4466 connections
- Reduce environmental electrical noise
- Check battery levels if using battery power

#### Motion Tracking Issues
- Ensure MPU6050 is properly connected
- Calibrate the MPU6050 on a flat, stable surface
- Check I2C connections (SDA/SCL)

#### Webcam Hand Tracking Problems
- Ensure adequate lighting
- Position hand clearly in the frame
- Check that webcam permissions are granted
- Try a different browser if issues persist

## Advanced Configuration

### Arduino Sampling Rate

The default sampling rate is 100Hz. To modify:

1. Open `arduino/EMG_Motion_Sensor.ino`
2. Locate the `sampleInterval` variable
3. Adjust the value (in milliseconds)
4. Upload the updated sketch

### Backend Server Port

The default port is 5001. To change:

1. Open `backend/index.js`
2. Modify the `preferredPort` variable
3. Restart the backend server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TensorFlow.js team for the handpose model
- Arduino community for libraries and examples
- All contributors and testers
