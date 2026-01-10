/**
 * Tests for enhanced error handling system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  normalizeError, 
  ErrorType, 
  withRetry, 
  handleError,
  handleFormError,
  globalSubmissionGuard,
  useLoadingState,
  SubmissionGuard
} from '../error-handling';
import { ApiError } from '../api';

// Mock toast
vi.mock('../enhanced-toast', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn()
  }
}));

describe('normalizeError', () => {
  it('should normalize ApiError correctly', () => {
    const apiError = new ApiError(404, 'Not found', 'NOT_FOUND');
    const normalized = normalizeError(apiError);

    expect(normalized.type).toBe(ErrorType.NOT_FOUND);
    expect(normalized.code).toBe('NOT_FOUND');
    expect(normalized.message).toBe('Not found');
    expect(normalized.retryable).toBe(false);
    expect(normalized.userMessage).toBe('The requested item was not found.');
  });

  it('should normalize network errors correctly', () => {
    const networkError = new TypeError('Failed to fetch');
    const normalized = normalizeError(networkError);

    expect(normalized.type).toBe(ErrorType.NETWORK);
    expect(normalized.retryable).toBe(true);
    expect(normalized.userMessage).toBe('Unable to connect to the server. Please check your internet connection.');
    expect(normalized.actionMessage).toBe('Retry');
  });

  it('should normalize validation errors correctly', () => {
    const validationError = new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', {
      errors: [{ field: 'email', message: 'Invalid email' }]
    });
    const normalized = normalizeError(validationError);

    expect(normalized.type).toBe(ErrorType.VALIDATION);
    expect(normalized.retryable).toBe(false);
    expect(normalized.userMessage).toBe('Please check the highlighted fields and try again.');
  });

  it('should normalize server errors correctly', () => {
    const serverError = new ApiError(500, 'Internal server error', 'INTERNAL_ERROR');
    const normalized = normalizeError(serverError);

    expect(normalized.type).toBe(ErrorType.SERVER);
    expect(normalized.retryable).toBe(true);
    expect(normalized.userMessage).toBe('Something went wrong on our end. Please try again in a moment.');
    expect(normalized.actionMessage).toBe('Retry');
  });

  it('should normalize authentication errors correctly', () => {
    const authError = new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    const normalized = normalizeError(authError);

    expect(normalized.type).toBe(ErrorType.AUTHENTICATION);
    expect(normalized.retryable).toBe(false);
    expect(normalized.userMessage).toBe('Your session has expired. Please log in again.');
    expect(normalized.actionMessage).toBe('Log In');
  });

  it('should handle unknown errors', () => {
    const unknownError = new Error('Something went wrong');
    const normalized = normalizeError(unknownError);

    expect(normalized.type).toBe(ErrorType.UNKNOWN);
    expect(normalized.message).toBe('Something went wrong');
    expect(normalized.userMessage).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new ApiError(500, 'Server error'))
      .mockRejectedValueOnce(new ApiError(500, 'Server error'))
      .mockResolvedValue('success');
    
    const result = await withRetry(mockFn, { maxAttempts: 3, baseDelay: 10 });
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new ApiError(400, 'Bad request'));
    
    await expect(withRetry(mockFn)).rejects.toThrow('Bad request');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should fail after max attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new ApiError(500, 'Server error'));
    
    await expect(withRetry(mockFn, { maxAttempts: 2, baseDelay: 10 })).rejects.toThrow('Server error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('handleError', () => {
  const mockToast = vi.mocked(await import('../enhanced-toast')).toast;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show toast notification by default', () => {
    const error = new ApiError(500, 'Server error');
    
    handleError(error);
    
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: 'Something went wrong on our end. Please try again in a moment.'
      }),
      expect.any(Object)
    );
  });

  it('should not show toast when disabled', () => {
    const error = new ApiError(500, 'Server error');
    
    handleError(error, { showToast: false });
    
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('should call onAuthError for authentication errors', () => {
    const mockOnAuthError = vi.fn();
    const error = new ApiError(401, 'Unauthorized');
    
    handleError(error, { onAuthError: mockOnAuthError });
    
    expect(mockOnAuthError).toHaveBeenCalled();
  });

  it('should include retry action for retryable errors', () => {
    const mockOnRetry = vi.fn();
    const error = new ApiError(500, 'Server error');
    
    handleError(error, { onRetry: mockOnRetry });
    
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Retry',
          onClick: mockOnRetry
        })
      })
    );
  });
});

describe('handleFormError', () => {
  const mockToast = vi.mocked(await import('../enhanced-toast')).toast;
  let mockSetFieldErrors: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetFieldErrors = vi.fn();
  });

  it('should set field errors for validation errors', () => {
    const error = new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', {
      zodErrors: [
        { path: ['email'], message: 'Invalid email' },
        { path: ['name'], message: 'Name is required' }
      ]
    });
    
    handleFormError(error, mockSetFieldErrors);
    
    expect(mockSetFieldErrors).toHaveBeenCalledWith({
      email: 'Invalid email',
      name: 'Name is required'
    });
  });

  it('should set general form error for non-validation errors', () => {
    const error = new ApiError(500, 'Server error');
    
    handleFormError(error, mockSetFieldErrors);
    
    expect(mockSetFieldErrors).toHaveBeenCalledWith({
      _form: 'Something went wrong on our end. Please try again in a moment.'
    });
  });

  it('should handle API validation errors', () => {
    const error = new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', [
      { loc: ['email'], msg: 'Email already exists' },
      { loc: ['phone'], msg: 'Invalid phone number' }
    ]);
    
    handleFormError(error, mockSetFieldErrors);
    
    expect(mockSetFieldErrors).toHaveBeenCalledWith({
      email: 'Email already exists',
      phone: 'Invalid phone number'
    });
  });
});

describe('SubmissionGuard', () => {
  let guard: SubmissionGuard;

  beforeEach(() => {
    guard = new SubmissionGuard();
  });

  it('should allow first submission', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await guard.guard('test-key', mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should prevent duplicate submissions', async () => {
    const mockFn = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    // Start first submission
    const promise1 = guard.guard('test-key', mockFn);
    
    // Try duplicate submission
    await expect(guard.guard('test-key', mockFn)).rejects.toThrow('Request already in progress');
    
    // Wait for first to complete
    await promise1;
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should allow submission after previous completes', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    await guard.guard('test-key', mockFn);
    await guard.guard('test-key', mockFn);
    
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should track submission state correctly', () => {
    expect(guard.isSubmitting('test-key')).toBe(false);
    
    guard.guard('test-key', () => new Promise(() => {})); // Never resolves
    
    expect(guard.isSubmitting('test-key')).toBe(true);
  });

  it('should clear submission state', () => {
    guard.guard('test-key', () => new Promise(() => {})); // Never resolves
    
    expect(guard.isSubmitting('test-key')).toBe(true);
    
    guard.clear('test-key');
    
    expect(guard.isSubmitting('test-key')).toBe(false);
  });
});

describe('useLoadingState', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.isIdle).toBe(true);
  });

  it('should start loading correctly', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.isIdle).toBe(false);
  });

  it('should update progress correctly', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading();
      result.current.updateProgress(50);
    });

    expect(result.current.progress).toBe(50);
  });

  it('should handle success correctly', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading();
      result.current.setSuccess();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.progress).toBe(100);
  });

  it('should handle errors correctly', () => {
    const { result } = renderHook(() => useLoadingState());
    const error = new Error('Test error');

    act(() => {
      result.current.startLoading();
      result.current.stopLoading(error);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(normalizeError(error));
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.startLoading();
      result.current.updateProgress(75);
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.isIdle).toBe(true);
  });
});