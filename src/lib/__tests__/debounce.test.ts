/**
 * ============================================================================
 * TEST SUITE: Debounce Utility
 * ============================================================================
 * 
 * MODULE UNDER TEST: debounce
 * TEST TYPE: Unit
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-10
 * LAST MODIFIED: 2025-10-10
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the debounce utility function that delays
 * function execution until after a specified wait time has elapsed.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework with fake timer support
 * - debounce: Target module with debounce utility function
 * 
 * COVERAGE SCOPE:
 * ✓ Basic debounce behavior with timer delays
 * ✓ Multiple rapid calls and cancellation logic
 * ✓ Argument passing and context preservation
 * ✓ Different wait times
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js test environment with fake timers
 * - Prerequisites: None (pure function)
 * - Runtime: <50ms (using fake timers)
 * 
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../debounce';

describe('Debounce Utility', () => {
  // ========================================================================
  // SETUP AND TEARDOWN
  // ========================================================================
  beforeEach(() => {
    // Use fake timers for precise control over time
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.restoreAllMocks();
  });

  // ========================================================================
  // TEST: Basic Debounce Behavior
  // ========================================================================
  
  it('should_delay_function_execution_by_specified_wait_time', () => {
    // ARRANGE: Create mock function and debounced version
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    // ACT: Call debounced function
    debouncedFn();

    // ASSERT: Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // ACT: Advance time by 499ms (not enough)
    vi.advanceTimersByTime(499);

    // ASSERT: Function still not called
    expect(mockFn).not.toHaveBeenCalled();

    // ACT: Advance time by 1ms more (total 500ms)
    vi.advanceTimersByTime(1);

    // ASSERT: Function should now be called
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should_cancel_previous_timeout_when_called_multiple_times', () => {
    // ARRANGE: Create mock function and debounced version
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    // ACT: Call debounced function multiple times
    debouncedFn();
    vi.advanceTimersByTime(100);
    
    debouncedFn(); // This should reset the timer
    vi.advanceTimersByTime(100);
    
    debouncedFn(); // This should reset the timer again
    vi.advanceTimersByTime(100);

    // ASSERT: Function should not be called yet (only 300ms total, but timer kept resetting)
    expect(mockFn).not.toHaveBeenCalled();

    // ACT: Wait the full 300ms from last call
    vi.advanceTimersByTime(200);

    // ASSERT: Function should be called exactly once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should_only_execute_function_once_after_multiple_rapid_calls', () => {
    // ARRANGE: Create mock function and debounced version
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 200);

    // ACT: Make many rapid calls
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // ASSERT: Function should not be called yet
    expect(mockFn).not.toHaveBeenCalled();

    // ACT: Advance time past the wait period
    vi.advanceTimersByTime(200);

    // ASSERT: Function should be called exactly once despite 5 calls
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // ========================================================================
  // TEST: Argument Passing
  // ========================================================================

  it('should_pass_correct_arguments_to_debounced_function', () => {
    // ARRANGE: Create mock function and debounced version
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // ACT: Call with specific arguments
    debouncedFn('arg1', 'arg2', 123);

    // Advance time
    vi.advanceTimersByTime(100);

    // ASSERT: Function should be called with correct arguments
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should_use_arguments_from_most_recent_call', () => {
    // ARRANGE: Create mock function and debounced version
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 150);

    // ACT: Call with different arguments
    debouncedFn('first');
    vi.advanceTimersByTime(50);
    
    debouncedFn('second');
    vi.advanceTimersByTime(50);
    
    debouncedFn('third', 'final');
    
    // Advance time past wait period
    vi.advanceTimersByTime(150);

    // ASSERT: Function should be called once with the last arguments
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third', 'final');
  });

  // ========================================================================
  // TEST: Context Preservation
  // ========================================================================

  it('should_execute_debounced_function_after_timeout', () => {
    // ARRANGE: Create mock function that tracks execution
    const executionTracker: string[] = [];
    const mockFn = vi.fn(() => {
      executionTracker.push('executed');
    });
    
    const debouncedFn = debounce(mockFn, 100);

    // ACT: Call debounced function
    debouncedFn();
    
    // ASSERT: Function not called before timeout
    expect(executionTracker).toHaveLength(0);
    
    // ACT: Advance time past timeout
    vi.advanceTimersByTime(100);

    // ASSERT: Function should be called after timeout
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(executionTracker).toHaveLength(1);
    expect(executionTracker[0]).toBe('executed');
  });

  // ========================================================================
  // TEST: Different Wait Times
  // ========================================================================

  it('should_handle_different_wait_times_correctly', () => {
    // ARRANGE: Create mock function with short wait time
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 50);

    // ACT & ASSERT: Test with 50ms wait
    debouncedFn();
    vi.advanceTimersByTime(49);
    expect(mockFn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should_handle_zero_wait_time', () => {
    // ARRANGE: Create mock function with zero wait time
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 0);

    // ACT: Call debounced function
    debouncedFn();

    // ASSERT: Should not be called synchronously
    expect(mockFn).not.toHaveBeenCalled();

    // ACT: Advance timers (even by 0)
    vi.advanceTimersByTime(0);

    // ASSERT: Should be called after timer tick
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // ========================================================================
  // TEST: Successive Independent Calls
  // ========================================================================

  it('should_allow_successive_calls_after_timeout_completes', () => {
    // ARRANGE: Create mock function and debounced version
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // ACT: First call
    debouncedFn('call1');
    vi.advanceTimersByTime(100);

    // ASSERT: First call executed
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call1');

    // ACT: Second call after timeout completes
    debouncedFn('call2');
    vi.advanceTimersByTime(100);

    // ASSERT: Second call executed independently
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('call2');
  });

  // ========================================================================
  // TEST: Complex Argument Types
  // ========================================================================

  it('should_handle_complex_argument_types', () => {
    // ARRANGE: Create mock function and debounced version
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // ACT: Call with complex arguments
    const obj = { key: 'value' };
    const arr = [1, 2, 3];
    const fn = () => 'test';
    
    debouncedFn(obj, arr, fn, null, undefined, true);
    vi.advanceTimersByTime(100);

    // ASSERT: All argument types preserved
    expect(mockFn).toHaveBeenCalledWith(obj, arr, fn, null, undefined, true);
  });
});

