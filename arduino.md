# ✅ Hand Tracking & Arduino Mega Integration Plan

## 📌 **Step 1: Define Communication Flow**
- [ ] **Arduino → Backend → Frontend (Sensor Data Display)**
  - [ ] Read **EMG signals, voltage, frequency** from sensors.
  - [ ] Send sensor data to the **Node.js backend** over **Serial communication**.
  - [ ] Backend processes data and **forwards to React frontend** via **WebSockets**.
  - [ ] Display sensor data in real-time on the UI.

- [ ] **Frontend → Backend → Arduino (Wrist Angle Control)**
  - [ ] User inputs **wrist angle** in React.
  - [ ] React sends angle value to **Node.js backend**.
  - [ ] Backend forwards the angle to **Arduino via Serial**.
  - [ ] Arduino processes the command and adjusts hardware accordingly.

---

## 📌 **Step 2: Set Up the Backend (Node.js)**
- [ ] **Initialize Node.js Project**
  - [ ] Run `npm init -y` to create `package.json`.
  - [ ] Install dependencies:
    ```bash
    npm install express cors socket.io serialport
    ```

- [ ] **Create `server.js`** and Implement Serial Communication
  - [ ] Set up **Express server**.
  - [ ] Set up **SerialPort** to read Arduino data.
  - [ ] Set up **WebSockets (`socket.io`)** to communicate with React frontend.

- [ ] **Test Backend with Sample Arduino Data**
  - [ ] Print incoming sensor data in the backend console.
  - [ ] Forward test data to the frontend.

---

## 📌 **Step 3: Set Up Arduino Mega**
- [ ] **Read Analog Sensor Data**
  - [ ] Read EMG signal from `A0`.
  - [ ] Read Voltage from `A1`.

- [ ] **Send Sensor Data Over Serial** to Node.js.
  - [ ] Format data as a readable string (`"EMG:123 Voltage:3.5"`).

- [ ] **Listen for Serial Commands (Wrist Angle Input)**
  - [ ] Read Serial input for commands (e.g., `"ANGLE:45"`).
  - [ ] Parse the wrist angle and adjust accordingly.

- [ ] **Test Serial Communication in Arduino IDE**
  - [ ] Ensure data is properly transmitted to Node.js.
  - [ ] Ensure received commands affect hardware.

---

## 📌 **Step 4: Set Up React Frontend**
- [ ] **Install WebSockets Client (`socket.io-client`)**
  ```bash
  npm install socket.io-client