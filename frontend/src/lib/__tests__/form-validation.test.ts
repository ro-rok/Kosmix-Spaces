/**
 * Tests for enhanced form validation system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, enhancedValidationSchemas, handleFormSubmission } from '../form-validation';

// Mock schema for testing
const testSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  age: z.number().min(18, "Must be at least 18 years old"),
  terms: z.boolean().refine(val => val === true, "Must accept terms")
});

type TestFormData = z.infer<typeof testSchema>;

const initialData: TestFormData = {
  name: "",
  email: "",
  age: 0,
  terms: false
};

describe('useFormValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, initialData)
    );

    expect(result.current.data).toEqual(initialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('should update field values correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, initialData)
    );

    act(() => {
      result.current.updateField('name', 'John Doe');
    });

    expect(result.current.data.name).toBe('John Doe');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.touched.name).toBe(true);
  });

  it('should validate fields on blur when enabled', async () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, initialData, { validateOnBlur: true })
    );

    // First touch the field
    act(() => {
      result.current.updateField('name', 'J');
    });

    // Then blur it
    act(() => {
      result.current.handleFieldBlur('name');
    });

    // Wait for validation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.errors.name).toBe("Name must be at least 2 characters");
  });

  it('should validate entire form correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, initialData)
    );

    const validationResult = result.current.validateForm({
      name: "John Doe",
      email: "john@example.com", 
      age: 25,
      terms: true
    });

    expect(validationResult.success).toBe(true);
    expect(validationResult.data).toEqual({
      name: "John Doe",
      email: "john@example.com",
      age: 25,
      terms: true
    });
  });

  it('should return validation errors for invalid data', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, initialData)
    );

    const validationResult = result.current.validateForm({
      name: "J",
      email: "invalid-email",
      age: 16,
      terms: false
    });

    expect(validationResult.success).toBe(false);
    expect(validationResult.errors).toMatchObject({
      name: "Name must be at least 2 characters",
      email: "Invalid email format",
      age: "Must be at least 18 years old",
      terms: "Must accept terms"
    });
  });

  it('should clear errors when field is corrected', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, initialData)
    );

    // Set an error
    act(() => {
      result.current.setErrors({ name: "Name is required" });
    });

    expect(result.current.errors.name).toBe("Name is required");

    // Clear the error
    act(() => {
      result.current.clearError('name');
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it('should reset form to initial state', () => {
    const { result } = renderHook(() => 
      useFormValidation(testSchema, initialData)
    );

    // Make some changes
    act(() => {
      result.current.updateField('name', 'John');
      result.current.setErrors({ email: 'Invalid email' });
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.errors.email).toBe('Invalid email');

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toEqual(initialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });
});

describe('enhancedValidationSchemas', () => {
  it('should validate email correctly', () => {
    const schema = enhancedValidationSchemas.email;
    
    expect(() => schema.parse("test@example.com")).not.toThrow();
    expect(() => schema.parse("invalid-email")).toThrow();
    expect(() => schema.parse("")).toThrow();
  });

  it('should validate phone number correctly', () => {
    const schema = enhancedValidationSchemas.phone;
    
    expect(() => schema.parse("+91-9876543210")).not.toThrow();
    expect(() => schema.parse("9876543210")).not.toThrow();
    expect(() => schema.parse("1234567890")).toThrow(); // Doesn't start with 6-9
    expect(() => schema.parse("98765")).toThrow(); // Too short
  });

  it('should validate password strength', () => {
    const schema = enhancedValidationSchemas.password;
    
    expect(() => schema.parse("Password123!")).not.toThrow();
    expect(() => schema.parse("password")).toThrow(); // No uppercase, number, special char
    expect(() => schema.parse("PASSWORD")).toThrow(); // No lowercase, number, special char
    expect(() => schema.parse("Pass1!")).toThrow(); // Too short
  });

  it('should validate name correctly', () => {
    const schema = enhancedValidationSchemas.name;
    
    expect(() => schema.parse("John Doe")).not.toThrow();
    expect(() => schema.parse("J")).toThrow(); // Too short
    expect(() => schema.parse("John123")).toThrow(); // Contains numbers
    expect(() => schema.parse("")).toThrow(); // Empty
  });
});

describe('handleFormSubmission', () => {
  it('should handle successful submission', async () => {
    const mockSubmitFn = vi.fn().mockResolvedValue({ success: true });
    const mockOnSuccess = vi.fn();
    
    const { result } = renderHook(() => 
      useFormValidation(testSchema, {
        name: "John Doe",
        email: "john@example.com",
        age: 25,
        terms: true
      })
    );

    const submissionResult = await handleFormSubmission(
      result.current,
      mockSubmitFn,
      { onSuccess: mockOnSuccess }
    );

    expect(submissionResult.success).toBe(true);
    expect(mockSubmitFn).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
      age: 25,
      terms: true
    });
    expect(mockOnSuccess).toHaveBeenCalledWith({ success: true });
  });

  it('should handle validation errors', async () => {
    const mockSubmitFn = vi.fn();
    const mockOnError = vi.fn();
    
    const { result } = renderHook(() => 
      useFormValidation(testSchema, {
        name: "J", // Invalid
        email: "invalid",
        age: 16,
        terms: false
      })
    );

    const submissionResult = await handleFormSubmission(
      result.current,
      mockSubmitFn,
      { onError: mockOnError }
    );

    expect(submissionResult.success).toBe(false);
    expect(mockSubmitFn).not.toHaveBeenCalled();
    expect(submissionResult.error).toBeDefined();
  });

  it('should handle API errors', async () => {
    const mockError = {
      status: 422,
      details: [
        { loc: ['email'], msg: 'Email already exists' }
      ]
    };
    const mockSubmitFn = vi.fn().mockRejectedValue(mockError);
    const mockOnError = vi.fn();
    
    const { result } = renderHook(() => 
      useFormValidation(testSchema, {
        name: "John Doe",
        email: "john@example.com",
        age: 25,
        terms: true
      })
    );

    const submissionResult = await handleFormSubmission(
      result.current,
      mockSubmitFn,
      { onError: mockOnError }
    );

    expect(submissionResult.success).toBe(false);
    expect(submissionResult.error).toBe(mockError);
    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it('should reset form on successful submission when enabled', async () => {
    const mockSubmitFn = vi.fn().mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => 
      useFormValidation(testSchema, {
        name: "John Doe",
        email: "john@example.com",
        age: 25,
        terms: true
      })
    );

    // Make form dirty
    act(() => {
      result.current.updateField('name', 'Jane Doe');
    });

    expect(result.current.isDirty).toBe(true);

    await handleFormSubmission(
      result.current,
      mockSubmitFn,
      { resetOnSuccess: true }
    );

    expect(result.current.isDirty).toBe(false);
  });
});