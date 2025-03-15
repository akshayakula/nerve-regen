import React, { useState } from 'react';
import { Button } from './ui/button';

const FORM_STEPS = [
  {
    id: 'name',
    title: 'What is your name?',
    type: 'text',
    placeholder: 'Enter your full name',
    validation: (value) => value.length >= 2 ? null : 'Name must be at least 2 characters',
  },
  {
    id: 'handDominance',
    title: 'Which hand is your dominant hand?',
    type: 'radio',
    options: ['Left', 'Right'],
    validation: (value) => value ? null : 'Please select your dominant hand',
  },
  {
    id: 'treatment',
    title: 'Are you currently taking treatment for Parkinson\'s?',
    type: 'radio',
    options: ['Yes', 'No'],
    validation: (value) => value ? null : 'Please select an option',
  },
  {
    id: 'symptomsDate',
    title: 'When did your symptoms begin?',
    type: 'date',
    validation: (value) => value ? null : 'Please select a date',
  },
];

function WizardForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    handDominance: '',
    treatment: '',
    symptomsDate: '',
  });
  const [errors, setErrors] = useState({});

  const validateStep = (stepIndex) => {
    const step = FORM_STEPS[stepIndex];
    const error = step.validation(formData[step.id]);
    setErrors(prev => ({ ...prev, [step.id]: error }));
    return !error;
  };

  const handleInputChange = (value) => {
    const currentField = FORM_STEPS[currentStep].id;
    setFormData(prev => ({ ...prev, [currentField]: value }));
    setErrors(prev => ({ ...prev, [currentField]: null }));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      console.log('Form submitted:', formData);
      // TODO: Send data to backend
    }
  };

  const renderFormField = () => {
    const step = FORM_STEPS[currentStep];

    switch (step.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[step.id]}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={step.placeholder}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {step.options.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  value={option}
                  checked={formData[step.id] === option}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            value={formData[step.id]}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Step {currentStep + 1} of {FORM_STEPS.length}
        </div>
      </div>

      {/* Form content */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{FORM_STEPS[currentStep].title}</h2>
        {renderFormField()}
        {errors[FORM_STEPS[currentStep].id] && (
          <p className="mt-2 text-sm text-destructive">{errors[FORM_STEPS[currentStep].id]}</p>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep === FORM_STEPS.length - 1 ? (
          <Button onClick={handleSubmit}>Submit</Button>
        ) : (
          <Button onClick={handleNext}>Next</Button>
        )}
      </div>
    </div>
  );
}

export default WizardForm; 