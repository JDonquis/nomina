import { useState } from 'react';
import { CircularProgress, Button, Alert } from '@mui/material';
import { useFeedback } from '../../context/FeedbackContext';
import FormField from './FormField';

export default function ReusableForm({
  fields,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  initialData = {},
  validationRules = {},
  className = '',
  showCancelButton = true,
  submitButtonProps = {},
  cancelButtonProps = {},
  resetOnCancel = false,
  formData: controlledFormData,
  onFormDataChange,
}) {
  // Use controlled form data if provided, otherwise use internal state
  const isControlled = controlledFormData !== undefined && onFormDataChange !== undefined;
  const [internalFormData, setInternalFormData] = useState(initialData);
  const currentFormData = isControlled ? controlledFormData : internalFormData;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [localError, setLocalError] = useState('');
  const { showSuccess, showError } = useFeedback();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    const newFormData = {
      ...currentFormData,
      [name]: newValue
    };

    if (isControlled) {
      onFormDataChange(newFormData);
    } else {
      setInternalFormData(newFormData);
    }

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    fields.forEach(field => {
      const value = currentFormData[field.name];
      const rules = validationRules[field.name];

      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (rules && value) {
        if (rules.minLength && value.length < rules.minLength) {
          newErrors[field.name] = `${field.label} must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          newErrors[field.name] = `${field.label} must be no more than ${rules.maxLength} characters`;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          newErrors[field.name] = rules.message || `${field.label} format is invalid`;
        }

        if (rules.custom && typeof rules.custom === 'function') {
          const customError = rules.custom(value, currentFormData);
          if (customError) {
            newErrors[field.name] = customError;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(currentFormData);
      showSuccess('Operación completada con éxito');

      // Reset form if no onCancel (meaning it's not a modal)
      if (!onCancel && !isControlled) {
        setInternalFormData(initialData);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      setLocalError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (resetOnCancel) {
      if (isControlled) {
        onFormDataChange(initialData);
      } else {
        setInternalFormData(initialData);
      }
      setErrors({});
      setLocalError('');
    }
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4  ${className}`}>
      {localError && (
        <Alert severity="error" className="mb-4">
          {localError}
        </Alert>
      )}
      
      {fields.map((field) => (
        <FormField
          key={field.name}
          {...field}
          value={currentFormData[field.name]}
          onChange={handleChange}
          error={errors[field.name]}
          disabled={loading}
        />
      ))}
      
      <div className="flex justify-end space-x-4 pt-4">
        {showCancelButton && (
          <Button
            type="button"
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
        )}
        
        <button
          type="submit"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          {...submitButtonProps}
          className={`px-5 rounded hover:opacity-80 font-bold ${submitText == "Actualizar" ? "bg-color4 text-color1" : "bg-color1 text-color4"}`}
        >
          {loading ? 'Procesando...' : submitText}
        </button>
      </div>
    </form>
  );
}
