# ✅ Hand Tracking & Arduino Mega Integration Plan

## 📌 **Step 1: Define Communication Flow**
- [x] **Arduino → Backend → Frontend (Sensor Data Display)**
  - [ ] Read **EMG signals, voltage, frequency** from sensors.
  - [ ] Send sensor data to the **Node.js backend** over **Serial communication**.
  - [ ] Backend processes data and **forwards to React frontend** via **WebSockets**.
  - [ ] Display sensor data in real-time on the UI.

- [x] **Frontend → Backend → Arduino (Wrist Angle Control)**
  - [ ] User inputs **wrist angle** in React.
  - [ ] React sends angle value to **Node.js backend**.
  - [ ] Backend forwards the angle to **Arduino via Serial**.
  - [ ] Arduino processes the command and adjusts hardware accordingly.

---

## 📌 **Step 2: Set Up the Backend (Node.js)**
- [x] **Initialize Node.js Project**
  - [x] Run `npm init -y` to create `package.json`.
  - [x] Install dependencies:
    ```bash
    npm install express cors socket.io serialport
    ```

- [x] **Create `server.js`** and Implement Serial Communication
  - [x] Set up **Express server**.
  - [x] Set up **SerialPort** to read Arduino data.
  - [x] Set up **WebSockets (`socket.io`)** to communicate with React frontend.

- [x] **Test Backend with Sample Arduino Data**
  - [x] Print incoming sensor data in the backend console.
  - [x] Forward test data to the frontend.

---

## 📌 **Step 3: Set Up Arduino Mega**
- [x] **Read Analog Sensor Data**
  - [x] Read EMG signal from `A0`.
  - [x] Read Voltage from `A1`.

- [x] **Send Sensor Data Over Serial** to Node.js.
  - [x] Format data as a readable string (`"EMG:123 Voltage:3.5"`).

- [x] **Listen for Serial Commands (Wrist Angle Input)**
  - [x] Read Serial input for commands (e.g., `"ANGLE:45"`).
  - [x] Parse the wrist angle and adjust accordingly.

- [x] **Test Serial Communication in Arduino IDE**
  - [x] Ensure data is properly transmitted to Node.js.
  - [x] Ensure received commands affect hardware.

---

## 📌 **Step 4: Set Up React Frontend**
- [x] **Install WebSockets Client (`socket.io-client`)**
  ```bash
  npm install socket.io-client