# Hand Tracking Web App - Development Steps

## Project Overview
You are building a **React web application** that:
1. **Collects user data** (name, medical questions) via a **wizard-style form**.
2. **Captures webcam input** and feeds it into the **Handpose model** from **TensorFlow.js** to track the user's hand and wrist movements.
3. **Processes the hand movement data** alongside input from an **Arduino device**.
4. **Stores all collected data** (medical details, hand tracking data) in a **NoSQL database** for later processing and use.

---

## Step 1: Optimizing UI Design and Layout ✅

### 1.1. General Layout ✅
- **Single-Page Layout**: Implemented with centered content
- **Seamless Navigation**: Added smooth transitions

### 1.2. Navigation Between Steps ✅
- **Button Navigation**: Implemented with styled buttons
- **Smooth Animations**: Added fadeIn and slideIn animations
- **Progress Indicator**: (Will be visible in WizardForm)

### 1.3. Color Scheme & Branding ✅
- **Highlight Color**: Using #4F4099 for buttons and accents
- **Base Colors**: Dark background with white text
- **Light/Dark Mode**: Single dark theme implemented

### 1.4. Font Style and Typography ✅
- **Font Style**: Added Inter and Poppins fonts
- **Headings**: Using Poppins for headings with proper sizing
- **Consistent Font Sizes**: Implemented consistent scale

---

## Step 2: Styling the Form and Handpose Data ✅

### 2.1. Form Styling ✅
- **Form Field Layout**: Implemented stacked vertical format
- **Button Styling**: Using #4F4099 with rounded corners
- **Input Field Styling**: Added borders, shadows, and active states

### 2.2. Handpose Data Display ✅
- **Landmark Dots**: Added dots for joints in #4F4099
- **Connecting Lines**: Implemented skeleton lines
- **All Possible Labels**: Added joint labels
- **Coordinate Display**: Added real-time coordinates

### 2.3. Wrist and Hand Position ✅
- **Real-Time Wrist Angle**: Implemented angle calculation and display
- **Graphical Representation**: Added text display (gauge to be implemented)

### 2.4. Dynamic Hand Tracking Data ✅
- **Labeling**: Added real-time joint labels
- **Joint Angle Display**: Implemented angle display
- **Hand Skeleton Rotation**: Basic implementation complete

---

## Step 3: Detailed Hand Tracking Output

### 3.1. Visualizing Hand Tracking
- **All Joints Labeled**: Display labels for every joint involved in the hand tracking (e.g., wrist, elbow, shoulder, knuckles, fingers).
- **Connection Lines**: Show **lines** connecting the joints in **#4F4099**.
- **Real-Time Data**: Display **real-time joint coordinates (X, Y, Z)** and the **wrist angle** relative to the hand's movement.

### 3.2. Wrist and Hand Angle Calculations
- **Calculate Wrist Angle Relative to Hand**: Use the relative positions of **shoulder**, **elbow**, **wrist**, and **hand** to compute the wrist angle. Display it as **text** beside the wrist joint (e.g., "Wrist Flexion: 45°").
- **Graphical Wrist Angle Representation**: Implement a **dial** or **circular gauge** to visually show wrist flexion/extension.

---

## Step 4: Enhancements for User Experience

### 4.1. Animations for Transitions
- **Smooth Transition Animations**: Use **fade-in** or **slide-in** animations to move between steps.
- **Interactive Feedback**: Real-time updates of the **landmark positions** and **joint angles** as the user interacts with the webcam feed.

### 4.2. Desktop Responsiveness
- **No Mobile Priority**: For now, focus on **desktop responsiveness** with a **single-page** layout.
- **Ensure Dynamic Scaling**: Ensure the webcam feed and form fields scale effectively within the page.

---

## Step 5: Accessibility and Inclusivity

### 5.1. Accessible Form Design
- Ensure that the **form fields** are **keyboard navigable** and that **screen readers** can properly interpret all elements.
- Add **labels and instructions** for accessibility purposes.

---

## Next Steps:
1. **Angle Calculation**: Implement wrist angle relative to the **hand's orientation** and show it dynamically as text and on a dial.
2. **Handpose Visualization**: Display the **landmarks**, **labels**, and **lines** connecting the joints with real-time data updates.
3. **Styling Adjustments**: Finalize the design for the form, buttons, input fields, and the handpose display.
4. **Test the UI**: Ensure all elements are working smoothly, with proper transitions and responsive interactions.

---

### **Questions to Finalize:**
1. Would you like the **landmark labels** to **follow** the joints as they move, or should they stay **fixed** for easy reading?
2. How detailed should the **joint labels** be? Do you want to label **every joint**, or just the **key points** like wrist, elbow, hand?
3. For the **wrist angle dial**, should we show **tick marks** to represent **degree values**, or keep it simpler with just the changing angle?

Let me know if you'd like to make any adjustments or if you're ready to move on to the next stage of development!