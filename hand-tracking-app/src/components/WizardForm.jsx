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

function WizardForm({ onSubmit }) {
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
      onSubmit(formData);
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
            className="w-full p-4 bg-[#1a1a1a] border border-[#4F4099] rounded-lg text-white 
                     focus:outline-none focus:ring-2 focus:ring-[#4F4099] focus:border-transparent
                     transition-all duration-200"
          />
        );
      case 'radio':
        return (
          <div className="space-y-3">
            {step.options.map((option) => (
              <label key={option} className="flex items-center space-x-3 p-4 bg-[#1a1a1a] 
                                         border border-[#4F4099] rounded-lg cursor-pointer
                                         hover:bg-[#2a2a2a] transition-all duration-200">
                <input
                  type="radio"
                  value={option}
                  checked={formData[step.id] === option}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="text-[#4F4099] focus:ring-[#4F4099] h-5 w-5"
                />
                <span className="text-white">{option}</span>
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
            className="w-full p-4 bg-[#1a1a1a] border border-[#4F4099] rounded-lg text-white 
                     focus:outline-none focus:ring-2 focus:ring-[#4F4099] focus:border-transparent
                     transition-all duration-200"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-xl p-8 shadow-xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-[#3d3277] rounded-full">
          <div
            className="h-2 bg-[#4F4099] rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-400 font-inter">
          Step {currentStep + 1} of {FORM_STEPS.length}
        </div>
      </div>

      {/* Form content */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-poppins mb-6 text-white">
          {FORM_STEPS[currentStep].title}
        </h2>
        <div className="space-y-4">
          {renderFormField()}
          {errors[FORM_STEPS[currentStep].id] && (
            <p className="text-red-400 text-sm mt-2">
              {errors[FORM_STEPS[currentStep].id]}
            </p>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex-1 border-[#4F4099] text-[#4F4099] hover:bg-[#4F4099] hover:text-white disabled:opacity-50"
        >
          Back
        </Button>
        {currentStep === FORM_STEPS.length - 1 ? (
          <Button 
            onClick={handleSubmit}
            className="flex-1 bg-[#4F4099] hover:bg-[#3d3277]"
          >
            Submit
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            className="flex-1 bg-[#4F4099] hover:bg-[#3d3277]"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

export default WizardForm; 