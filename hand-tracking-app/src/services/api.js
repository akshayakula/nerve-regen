import { AppError, errorTypes } from '../utils/errorHandling';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const saveUserData = async (formData, handData) => {
  try {
    const response = await fetch(`${API_URL}/user-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formData, handData }),
    });

    if (!response.ok) {
      throw new AppError('Failed to save user data', errorTypes.API_ERROR);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Network error occurred', errorTypes.API_ERROR);
  }
}; 