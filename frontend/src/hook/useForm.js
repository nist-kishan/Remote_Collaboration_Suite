import { useState, useCallback, useEffect } from 'react';

/**
 * UI hook for form state management
 * Provides a clean interface for managing form data, validation, and submission
 */
export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values
  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  // Update multiple values at once
  const setValuesData = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  // Mark field as touched
  const setTouchedField = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Validate single field
  const validateField = useCallback((name, value) => {
    const rule = validationRules[name];
    if (!rule) return null;

    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.required;
    }

    if (rule.minLength && value && value.length < rule.minLength) {
      return rule.minLength;
    }

    if (rule.maxLength && value && value.length > rule.maxLength) {
      return rule.maxLength;
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      return rule.pattern;
    }

    if (rule.custom && typeof rule.custom === 'function') {
      return rule.custom(value, values);
    }

    return null;
  }, [validationRules, values]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);

  // Handle field change
  const handleChange = useCallback((name, value) => {
    setValue(name, value);
    setTouchedField(name);
  }, [setValue, setTouchedField]);

  // Handle field blur
  const handleBlur = useCallback((name) => {
    setTouchedField(name);
    const error = validateField(name, values[name]);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [setTouchedField, validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    try {
      const isValid = validateForm();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      await onSubmit(values);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, values]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Set errors
  const setErrorsData = useCallback((newErrors) => {
    setErrors(newErrors);
  }, []);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;

  // Check if form has been touched
  const isTouched = Object.keys(touched).length > 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isTouched,
    setValue,
    setValues: setValuesData,
    setTouched: setTouchedField,
    validateField,
    validateForm,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    clearErrors,
    setErrors: setErrorsData
  };
};

/**
 * UI hook for managing form fields with specific types
 * Provides specialized handlers for different input types
 */
export const useFormField = (name, initialValue = '', validationRule = null) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    setError(null);
  }, []);

  const handleBlur = useCallback(() => {
    setTouched(true);
    
    if (validationRule) {
      const validationError = validateFieldValue(newValue, validationRule);
      if (validationError) {
        setError(validationError);
      }
    }
  }, [validationRule]);

  const validate = useCallback(() => {
    if (validationRule) {
      const validationError = validateFieldValue(value, validationRule);
      setError(validationError);
      return !validationError;
    }
    return true;
  }, [value, validationRule]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setTouched(false);
  }, [initialValue]);

  return {
    value,
    error,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValue,
    setError,
    setTouched
  };
};

// Helper function for field validation
const validateFieldValue = (value, rule) => {
  if (rule.required && (!value || value.toString().trim() === '')) {
    return rule.required;
  }

  if (rule.minLength && value && value.length < rule.minLength) {
    return rule.minLength;
  }

  if (rule.maxLength && value && value.length > rule.maxLength) {
    return rule.maxLength;
  }

  if (rule.pattern && value && !rule.pattern.test(value)) {
    return rule.pattern;
  }

  if (rule.custom && typeof rule.custom === 'function') {
    return rule.custom(value);
  }

  return null;
};
