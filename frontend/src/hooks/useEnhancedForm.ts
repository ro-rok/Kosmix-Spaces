/**
 * Enhanced form hook with comprehensive validation, error handling, and submission management
 */

import { useCallback, useRef } from "react";
import { z } from "zod";
import { useFormValidation, handleFormSubmission } from "@/lib/form-validation";
import { handleFormError, globalSubmissionGuard } from "@/lib/error-handling";
import { toast } from "@/lib/enhanced-toast";
import { useAuthCompat } from "./useAuthCompat";

// Enhanced form options
export interface EnhancedFormOptions<T> {
  // Validation options
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  
  // Submission options
  preventDuplicateSubmission?: boolean;
  resetOnSuccess?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  
  // Success/error messages
  successMessage?: string;
  loadingMessage?: string;
  
  // Callbacks
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  onValidationError?: (errors: Record<string, string>) => void;
  
  // Authentication handling
  redirectOnAuthError?: boolean;
}

// Enhanced form return type
export interface EnhancedFormReturn<T> {
  // Form state
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  
  // Field management
  updateField: (fieldName: string, value: any) => void;
  handleFieldBlur: (fieldName: string) => void;
  getFieldProps: (fieldName: string) => {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    error?: string;
    name: string;
  };
  
  // Error management
  setErrors: (errors: Record<string, string>) => void;
  clearError: (fieldName: string) => void;
  clearErrors: () => void;
  hasError: (fieldName: string) => boolean;
  getError: (fieldName: string) => string | undefined;
  
  // Form actions
  handleSubmit: (submitFn: (data: T) => Promise<any>) => (e?: React.FormEvent) => Promise<void>;
  reset: (newData?: T) => void;
  validate: () => boolean;
  
  // Submission state
  setSubmitting: (isSubmitting: boolean) => void;
}

export function useEnhancedForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: T,
  options: EnhancedFormOptions<T> = {}
): EnhancedFormReturn<T> {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    preventDuplicateSubmission = true,
    resetOnSuccess = false,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = "Operation completed successfully",
    loadingMessage = "Processing...",
    onSuccess,
    onError,
    onValidationError,
    redirectOnAuthError = true
  } = options;

  const { redirectToLogin } = useAuthCompat();
  const submissionKeyRef = useRef<string>();

  // Use the form validation hook
  const formValidation = useFormValidation(schema, initialData, {
    validateOnChange,
    validateOnBlur,
    debounceMs
  });

  // Generate submission key for duplicate prevention
  const getSubmissionKey = useCallback(() => {
    return `form-${JSON.stringify(formValidation.data)}-${Date.now()}`;
  }, [formValidation.data]);

  // Enhanced field props generator
  const getFieldProps = useCallback((fieldName: string) => {
    return {
      name: fieldName,
      value: formValidation.data[fieldName],
      onChange: (value: any) => formValidation.updateField(fieldName, value),
      onBlur: () => formValidation.handleFieldBlur(fieldName),
      error: formValidation.errors[fieldName]
    };
  }, [formValidation]);

  // Error management helpers
  const hasError = useCallback((fieldName: string) => {
    return Boolean(formValidation.errors[fieldName]);
  }, [formValidation.errors]);

  const getError = useCallback((fieldName: string) => {
    return formValidation.errors[fieldName];
  }, [formValidation.errors]);

  // Enhanced form submission handler
  const handleSubmit = useCallback((submitFn: (data: T) => Promise<any>) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      try {
        // Generate submission key for duplicate prevention
        const submissionKey = getSubmissionKey();
        submissionKeyRef.current = submissionKey;

        // Prevent duplicate submissions
        if (preventDuplicateSubmission) {
          await globalSubmissionGuard.guard(submissionKey, async () => {
            await performSubmission(submitFn);
          });
        } else {
          await performSubmission(submitFn);
        }
      } catch (error: any) {
        // Handle duplicate submission error
        if (error.message === 'Request already in progress') {
          if (showErrorToast) {
            toast.warning("Please wait, your request is being processed...");
          }
          return;
        }
        
        // Re-throw other errors to be handled by performSubmission
        throw error;
      }
    };
  }, [
    getSubmissionKey,
    preventDuplicateSubmission,
    showErrorToast
  ]);

  // Perform the actual submission
  const performSubmission = useCallback(async (submitFn: (data: T) => Promise<any>) => {
    const result = await handleFormSubmission(
      formValidation,
      submitFn,
      {
        onSuccess: (result) => {
          if (showSuccessToast) {
            toast.success(successMessage);
          }
          onSuccess?.(result);
        },
        onError: (error) => {
          // Handle form-specific errors
          handleFormError(error, formValidation.setErrors, {
            showToast: showErrorToast,
            onAuthError: redirectOnAuthError ? redirectToLogin : undefined
          });
          
          onValidationError?.(formValidation.errors);
          onError?.(error);
        },
        resetOnSuccess
      }
    );

    return result;
  }, [
    formValidation,
    showSuccessToast,
    successMessage,
    onSuccess,
    showErrorToast,
    redirectOnAuthError,
    redirectToLogin,
    onValidationError,
    onError,
    resetOnSuccess
  ]);

  // Validate form manually
  const validate = useCallback(() => {
    const result = formValidation.getValidatedData();
    return result.success;
  }, [formValidation]);

  // Enhanced reset with cleanup
  const reset = useCallback((newData?: T) => {
    formValidation.reset(newData);
    
    // Clear submission guard
    if (submissionKeyRef.current) {
      globalSubmissionGuard.clear(submissionKeyRef.current);
      submissionKeyRef.current = undefined;
    }
  }, [formValidation]);

  return {
    // Form state
    data: formValidation.data,
    errors: formValidation.errors,
    touched: formValidation.touched,
    isSubmitting: formValidation.isSubmitting,
    isValid: formValidation.isValid,
    isDirty: formValidation.isDirty,
    
    // Field management
    updateField: formValidation.updateField,
    handleFieldBlur: formValidation.handleFieldBlur,
    getFieldProps,
    
    // Error management
    setErrors: formValidation.setErrors,
    clearError: formValidation.clearError,
    clearErrors: formValidation.clearErrors,
    hasError,
    getError,
    
    // Form actions
    handleSubmit,
    reset,
    validate,
    
    // Submission state
    setSubmitting: formValidation.setSubmitting
  };
}

// Specialized hooks for common form patterns

// Hook for enquiry forms
export function useEnquiryForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: T,
  options: Partial<EnhancedFormOptions<T>> = {}
) {
  return useEnhancedForm(schema, initialData, {
    successMessage: "Your enquiry has been submitted successfully!",
    loadingMessage: "Submitting enquiry...",
    resetOnSuccess: true,
    ...options
  });
}

// Hook for listing forms
export function useListingForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: T,
  options: Partial<EnhancedFormOptions<T>> = {}
) {
  return useEnhancedForm(schema, initialData, {
    successMessage: "Listing saved successfully!",
    loadingMessage: "Saving listing...",
    resetOnSuccess: false,
    validateOnChange: true,
    debounceMs: 500, // Longer debounce for complex forms
    ...options
  });
}

// Hook for authentication forms
export function useAuthForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: T,
  options: Partial<EnhancedFormOptions<T>> = {}
) {
  return useEnhancedForm(schema, initialData, {
    successMessage: "Authentication successful!",
    loadingMessage: "Authenticating...",
    resetOnSuccess: true,
    redirectOnAuthError: false, // Don't redirect on auth forms
    ...options
  });
}

// Hook for profile/settings forms
export function useProfileForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: T,
  options: Partial<EnhancedFormOptions<T>> = {}
) {
  return useEnhancedForm(schema, initialData, {
    successMessage: "Profile updated successfully!",
    loadingMessage: "Updating profile...",
    resetOnSuccess: false,
    validateOnBlur: true,
    debounceMs: 800, // Longer debounce for profile forms
    ...options
  });
}