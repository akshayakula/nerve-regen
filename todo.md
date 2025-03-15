# Hand Tracking Web App - TODO List

## Project Setup

- [x] **Create React App**:
  - Run `npx create-react-app hand-tracking-app` and navigate to the project folder.

- [x] **Install Dependencies**:
  - Run `npm install @shadcn/ui tailwindcss` to install ShadCN and Tailwind CSS.

- [x] **Set Up Tailwind CSS**:
  - Initialize Tailwind by running `npx tailwindcss init`.
  - Update `tailwind.config.js` and `src/index.css` to include Tailwind's directives.

## Front-End Development

### Step 1: Set Up React App with ShadCN

- [x] **Set up ShadCN**:
  - Install `@shadcn/ui` and ensure the button renders correctly in `App.js`.

- [x] **Test Tailwind CSS Integration**:
  - Ensure that basic Tailwind styling works by testing with a button or simple style.

### Step 2: Implement Wizard Form

- [x] **Create `WizardForm.js`**:
  - Implement form with **multiple-choice questions**:
    - Ask for **name**.
    - Ask for **hand dominance** (left/right).
    - Ask if the user is **currently taking treatment for Parkinson's**.
    - Ask when the **symptoms began**.
  
- [x] **Use `useState` for Form Data**:
  - Manage form data for each step in the wizard.

- [x] **Create Next/Submit Actions**:
  - Implement buttons for **Next** and **Submit** actions.

- [x] **Add Progress Bar**:
  - Add a progress bar to indicate the user's current step in the form.

- [x] **Form Validation**:
  - Ensure that all required fields are filled before submission.

### Step 3: Set Up Webcam Capture

- [x] **Install TensorFlow.js and Handpose Model**:
  - Run `npm install @tensorflow/tfjs @tensorflow-models/handpose`.

- [x] **Create `WebcamCapture.js`**:
  - Capture webcam feed using `navigator.mediaDevices.getUserMedia`.

- [x] **Load Handpose Model**:
  - Load and initialize **Handpose** model to process webcam frames.

- [x] **Process Hand Data**:
  - Implement `model.estimateHands()` to track the hand and wrist positions.
  - Log or display the **hand position** and **wrist angles** for processing.

### Step 4: Set Up Back-End (Node.js, Arduino Communication)

- [ ] **Create Node.js Server**:
  - Set up a basic **express server** that handles incoming data from the front-end.

- [ ] **Arduino Communication**:
  - Use the `serialport` library to communicate with the Arduino.
  - Set up Arduino to send sensor data (e.g., EMG data) via **Serial Communication**.

- [ ] **Handle Data from Front-End**:
  - Process **hand tracking data** sent from the front-end (e.g., positions, joint angles).

### Step 5: Set Up Database (MongoDB)

- [ ] **Install Mongoose**:
  - Run `npm install mongoose` to integrate MongoDB with Node.js.

- [ ] **Create MongoDB Schema**:
  - Set up collections for:
    - **User Data** (name, hand dominance, symptoms, etc.)
    - **Hand Tracking Data** (positions, wrist angles, etc.)
    - **Sensor Data** (EMG data from Arduino).

- [ ] **Save Incoming Data**:
  - Implement data saving functionality to store user and hand tracking data in MongoDB.

### Step 6: Error Handling and Testing

- [ ] **Front-End Error Handling**:
  - Handle form input validation errors.
  - Handle webcam and Handpose model errors.

- [ ] **Back-End Error Handling**:
  - Handle Arduino communication errors (e.g., device disconnections).
  - Handle database errors and retries.
---

## Final Steps

- [ ] **Optimize Front-End Performance**:
  - Test and optimize **TensorFlow.js** for smooth performance on mobile devices and desktops.

- [ ] **Deploy App**:
  - Prepare the app for deployment on a hosting platform (e.g., Heroku, AWS).

- [ ] **Monitor and Fix Bugs**:
  - Monitor the deployed app for performance issues and bugs.
  - Apply necessary fixes based on user feedback or errors.

---

## Post-Launch

- [ ] **User Feedback**:
  - Collect feedback from users on the experience and any performance issues.
  
- [ ] **Enhance Features**:
  - Add additional features such as **multiple user support** or **real-time interaction with more devices**.

- [ ] **Maintain System**:
  - Regularly maintain and update the app based on user needs and new technologies.