/**
 * Advanced form validation utilities with real-time feedback
 */

import { z } from "zod";
import { useState, useCallback, useRef } from "react";

// Enhanced validation result type
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  fieldErrors?: Record<string, string[]>;
}

// Form state management interface
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Form validation options
export interface FormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  revalidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

// Enhanced field validation with real-time feedback
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: T,
  options: FormValidationOptions = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    revalidateMode = 'onChange'
  } = options;

  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
    isDirty: false,
  });

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const initialDataRef = useRef(initialData);

  // Validate entire form
  const validateForm = useCallback((data: T): ValidationResult<T> => {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData,
        errors: {},
        fieldErrors: {}
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        const fieldErrors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
          
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(err.message);
        });

        return {
          success: false,
          errors,
          fieldErrors
        };
      }
      
      return {
        success: false,
        errors: { _form: 'Validation failed' },
        fieldErrors: {}
      };
    }
  }, [schema]);

  // Validate single field
  const validateField = useCallback((fieldName: string, value: any): string | undefined => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.shape?.[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message;
      }
      return 'Validation failed';
    }
  }, [schema]);

  // Update field value with validation
  const updateField = useCallback((fieldName: string, value: any) => {
    const newData = { ...formState.data, [fieldName]: value };
    const isDirty = JSON.stringify(newData) !== JSON.stringify(initialDataRef.current);

    setFormState(prev => ({
      ...prev,
      data: newData,
      isDirty,
      touched: { ...prev.touched, [fieldName]: true }
    }));

    // Clear existing timeout for this field
    if (debounceTimeouts.current[fieldName]) {
      clearTimeout(debounceTimeouts.current[fieldName]);
    }

    // Debounced validation
    if (validateOnChange && formState.touched[fieldName]) {
      debounceTimeouts.current[fieldName] = setTimeout(() => {
        const fieldError = validateField(fieldName, value);
        setFormState(prev => ({
          ...prev,
          errors: fieldError 
            ? { ...prev.errors, [fieldName]: fieldError }
            : { ...prev.errors, [fieldName]: undefined }
        }));
      }, debounceMs);
    }
  }, [formState.data, formState.touched, validateOnChange, validateField, debounceMs]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      touched: { ...prev.touched, [fieldName]: true }
    }));

    if (validateOnBlur) {
      const fieldError = validateField(fieldName, formState.data[fieldName]);
      setFormState(prev => ({
        ...prev,
        errors: fieldError 
          ? { ...prev.errors, [fieldName]: fieldError }
          : { ...prev.errors, [fieldName]: undefined }
      }));
    }
  }, [formState.data, validateOnBlur, validateField]);

  // Set form errors (for server-side validation)
  const setErrors = useCallback((errors: Record<string, string>) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors }
    }));
  }, []);

  // Clear specific error
  const clearError = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [fieldName]: undefined }
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      errors: {}
    }));
  }, []);

  // Set submitting state
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState(prev => ({
      ...prev,
      isSubmitting
    }));
  }, []);

  // Reset form to initial state
  const reset = useCallback((newInitialData?: T) => {
    const resetData = newInitialData || initialDataRef.current;
    if (newInitialData) {
      initialDataRef.current = newInitialData;
    }
    
    setFormState({
      data: resetData,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
      isDirty: false,
    });

    // Clear all debounce timeouts
    Object.values(debounceTimeouts.current).forEach(clearTimeout);
    debounceTimeouts.current = {};
  }, []);

  // Validate and get form data
  const getValidatedData = useCallback((): ValidationResult<T> => {
    const result = validateForm(formState.data);
    
    if (!result.success && result.errors) {
      setErrors(result.errors);
    }
    
    setFormState(prev => ({
      ...prev,
      isValid: result.success
    }));

    return result;
  }, [formState.data, validateForm, setErrors]);

  return {
    // Form state
    data: formState.data,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    
    // Actions
    updateField,
    handleFieldBlur,
    setErrors,
    clearError,
    clearErrors,
    setSubmitting,
    reset,
    validateForm,
    validateField,
    getValidatedData,
  };
}

// Helper to get field error message
export function getFieldError(errors: Record<string, string>, fieldName: string): string | undefined {
  return errors[fieldName];
}

// Helper to check if field has error
export function hasFieldError(errors: Record<string, string>, fieldName: string): boolean {
  return Boolean(errors[fieldName]);
}

// Enhanced validation schemas with better error messages
export const enhancedValidationSchemas = {
  // Email with custom error messages
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email address is too long"),

  // Phone number with Indian format
  phone: z.string()
    .min(1, "Phone number is required")
    .regex(/^\+91-[6-9]\d{9}$/, "Phone must be in format +91-XXXXXXXXXX")
    .or(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),

  // Password with strength requirements
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

  // Name validation
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  // Required string with custom message
  requiredString: (fieldName: string) => z.string()
    .min(1, `${fieldName} is required`)
    .trim(),

  // Optional string with max length
  optionalString: (maxLength: number = 255) => z.string()
    .max(maxLength, `Text must be less than ${maxLength} characters`)
    .optional(),

  // URL validation
  url: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  // Number with range
  numberInRange: (min: number, max: number, fieldName: string = "Value") => 
    z.number()
      .min(min, `${fieldName} must be at least ${min}`)
      .max(max, `${fieldName} must be at most ${max}`),

  // Array with minimum items
  arrayWithMin: <T>(itemSchema: z.ZodSchema<T>, minItems: number, fieldName: string = "Items") =>
    z.array(itemSchema)
      .min(minItems, `Please select at least ${minItems} ${fieldName.toLowerCase()}`),
};

// Form submission helper with error handling
export async function handleFormSubmission<T, R>(
  formValidation: ReturnType<typeof useFormValidation<T>>,
  submitFn: (data: T) => Promise<R>,
  options: {
    onSuccess?: (result: R) => void;
    onError?: (error: any) => void;
    resetOnSuccess?: boolean;
  } = {}
): Promise<{ success: boolean; data?: R; error?: any }> {
  const { onSuccess, onError, resetOnSuccess = false } = options;
  
  try {
    formValidation.setSubmitting(true);
    formValidation.clearErrors();

    // Validate form data
    const validation = formValidation.getValidatedData();
    if (!validation.success) {
      return { success: false, error: validation.errors };
    }

    // Submit form
    const result = await submitFn(validation.data!);
    
    if (resetOnSuccess) {
      formValidation.reset();
    }
    
    onSuccess?.(result);
    return { success: true, data: result };
    
  } catch (error: any) {
    // Handle API errors
    if (error.status === 422 && error.details) {
      // Map validation errors to form fields
      const fieldErrors: Record<string, string> = {};
      if (Array.isArray(error.details)) {
        error.details.forEach((err: any) => {
          const fieldPath = err.loc?.join('.') || '_form';
          fieldErrors[fieldPath] = err.msg || 'Validation failed';
        });
      }
      formValidation.setErrors(fieldErrors);
    } else {
      // General error
      formValidation.setErrors({ _form: error.message || 'An error occurred' });
    }
    
    onError?.(error);
    return { success: false, error };
    
  } finally {
    formValidation.setSubmitting(false);
  }
}