export class AppError extends Error {
  constructor(message, type = 'GENERAL_ERROR') {
    super(message);
    this.type = type;
  }
}

export const errorTypes = {
  WEBCAM_ERROR: 'WEBCAM_ERROR',
  MODEL_ERROR: 'MODEL_ERROR',
  FORM_ERROR: 'FORM_ERROR',
  API_ERROR: 'API_ERROR',
};

export const handleError = (error, setError) => {
  console.error('Error:', error);
  
  if (error instanceof AppError) {
    setError({ type: error.type, message: error.message });
  } else {
    setError({ type: 'GENERAL_ERROR', message: 'An unexpected error occurred' });
  }
}; 