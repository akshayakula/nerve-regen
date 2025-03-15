# Nerve-Regen

A hand tracking application for nerve regeneration therapy and monitoring.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB (for backend database)

## Project Structure

```plaintext
nerve-regen/
├── backend/         # Backend server code
├── hand-tracking-app/ # Frontend application
└── node_modules/    # Project dependencies
```

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd nerve-regen
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This will install required packages including:
   - @tensorflow-models/handpose
   - @tensorflow/tfjs

3. Set up the backend:

   ```bash
   cd backend
   npm install
   ```

   This will install backend dependencies including:
   - Express.js for the server
   - Mongoose for MongoDB integration
   - CORS for cross-origin requests
   - SerialPort for hardware communication
   - Jest and Supertest for testing

4. Start the backend development server:

   ```bash
   cd backend
   npm run dev
   ```

   The server will start in development mode with hot-reload enabled.

5. Set up the frontend:

   ```bash
   cd hand-tracking-app
   npm install
   ```

   This will install frontend dependencies including:
   - React and React DOM
   - TensorFlow.js dependencies (from root)
   - Testing libraries
   - Tailwind CSS for styling
   - Various UI components and utilities

6. Start the frontend development server:

   ```bash
   cd hand-tracking-app
   npm start
   ```

   The React application will start and open in your default browser at `http://localhost:3000`.

## Development Workflow

1. Backend Development:
   - Server runs on `http://localhost:8000` by default
   - Uses nodemon for auto-reloading during development
   - Run tests with `npm test` in the backend directory

2. Frontend Development:
   - Uses Create React App with hot-reloading
   - Styled with Tailwind CSS
   - Run tests with `npm test` in the frontend directory

3. TensorFlow.js and Hand Tracking:
   - Ensure good lighting for optimal hand detection
   - Camera access is required for hand tracking features
   - Consider GPU acceleration for better performance

## MongoDB Setup

The backend requires MongoDB to be running. Here's how to get started:

1. Install MongoDB:
   - [Download MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - Follow the installation instructions for your operating system

2. Start MongoDB:
   ```bash
   # The MongoDB service should start automatically after installation
   # To verify MongoDB is running:
   mongosh
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
