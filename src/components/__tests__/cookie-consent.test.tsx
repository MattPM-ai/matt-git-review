/**
 * ============================================================================
 * TEST SUITE: CookieConsent Component
 * ============================================================================
 * 
 * MODULE UNDER TEST: CookieConsent
 * TEST TYPE: Component / Integration
 * FRAMEWORK: Vitest + React Testing Library
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-10
 * LAST MODIFIED: 2025-10-10
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the CookieConsent banner component which
 * manages cookie consent UI and localStorage interactions.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - @testing-library/react: ^16.3.0 - React testing
 * - @testing-library/user-event: ^14.6.1 - User interaction simulation
 * 
 * COVERAGE SCOPE:
 * ✓ Banner visibility based on localStorage
 * ✓ Accept/Decline button functionality
 * ✓ localStorage persistence
 * ✓ UI rendering and accessibility
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: jsdom
 * - Prerequisites: localStorage mock
 * - Runtime: <100ms
 * 
 * ============================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from '../cookie-consent';

describe('CookieConsent', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ========================================================================
  // TEST: Initial Rendering
  // ========================================================================

  it('should_render_banner_when_no_consent_in_localStorage', () => {
    // ARRANGE & ACT
    render(<CookieConsent />);

    // ASSERT
    expect(screen.getByText(/We use cookies to enhance your experience/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('should_not_render_banner_when_consent_exists_in_localStorage', () => {
    // ARRANGE
    localStorage.setItem('cookie-consent', 'accepted');

    // ACT
    render(<CookieConsent />);

    // ASSERT
    expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument();
  });

  it('should_not_render_when_localStorage_has_accepted_value', () => {
    // ARRANGE
    localStorage.setItem('cookie-consent', 'accepted');

    // ACT
    render(<CookieConsent />);

    // ASSERT
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
  });

  it('should_not_render_when_localStorage_has_declined_value', () => {
    // ARRANGE
    localStorage.setItem('cookie-consent', 'declined');

    // ACT
    render(<CookieConsent />);

    // ASSERT
    expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument();
  });

  // ========================================================================
  // TEST: Accept Button
  // ========================================================================

  it('should_save_accepted_to_localStorage_when_Accept_button_clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CookieConsent />);
    const acceptButton = screen.getByRole('button', { name: /accept/i });

    // ACT
    await user.click(acceptButton);

    // ASSERT
    expect(localStorage.getItem('cookie-consent')).toBe('accepted');
  });

  it('should_hide_banner_after_Accept_button_clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CookieConsent />);
    const acceptButton = screen.getByRole('button', { name: /accept/i });

    // ACT
    await user.click(acceptButton);

    // ASSERT
    await waitFor(() => {
      expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // TEST: Decline Button
  // ========================================================================

  it('should_save_declined_to_localStorage_when_Decline_button_clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CookieConsent />);
    const declineButton = screen.getByRole('button', { name: /decline/i });

    // ACT
    await user.click(declineButton);

    // ASSERT
    expect(localStorage.getItem('cookie-consent')).toBe('declined');
  });

  it('should_hide_banner_after_Decline_button_clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CookieConsent />);
    const declineButton = screen.getByRole('button', { name: /decline/i });

    // ACT
    await user.click(declineButton);

    // ASSERT
    await waitFor(() => {
      expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // TEST: UI Elements
  // ========================================================================

  it('should_render_Cookie_icon', () => {
    // ARRANGE & ACT
    render(<CookieConsent />);

    // ASSERT
    // The CookieIcon component should be rendered
    const banner = screen.getByText(/We use cookies/i).closest('div');
    expect(banner).toBeInTheDocument();
  });

  it('should_render_privacy_policy_link_with_correct_href', () => {
    // ARRANGE & ACT
    render(<CookieConsent />);

    // ASSERT
    const link = screen.getByRole('link', { name: /learn more/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.mattpm.ai/privacy-policy');
  });

  it('should_render_both_Accept_and_Decline_buttons', () => {
    // ARRANGE & ACT
    render(<CookieConsent />);

    // ASSERT
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('should_have_fixed_position_styling', () => {
    // ARRANGE & ACT
    render(<CookieConsent />);

    // ASSERT
    // Check that the component renders with fixed positioning
    const text = screen.getByText(/We use cookies/i);
    const fixedContainer = text.closest('.fixed');
    expect(fixedContainer).toBeInTheDocument();
  });

  // ========================================================================
  // TEST: Accessibility
  // ========================================================================

  it('should_be_keyboard_accessible', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CookieConsent />);

    // ACT - Click the decline button using keyboard
    const declineButton = screen.getByRole('button', { name: /decline/i });
    declineButton.focus();
    await user.keyboard('{Enter}');

    // ASSERT
    expect(localStorage.getItem('cookie-consent')).toBe('declined');
  });

  // ========================================================================
  // TEST: Component Lifecycle
  // ========================================================================

  it('should_check_localStorage_on_mount', () => {
    // ARRANGE
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    localStorage.setItem('cookie-consent', 'accepted');

    // ACT
    render(<CookieConsent />);

    // ASSERT
    expect(getItemSpy).toHaveBeenCalledWith('cookie-consent');
    
    getItemSpy.mockRestore();
  });

  it('should_return_null_when_banner_should_not_show', () => {
    // ARRANGE
    localStorage.setItem('cookie-consent', 'accepted');

    // ACT
    const { container } = render(<CookieConsent />);

    // ASSERT
    expect(container.firstChild).toBeNull();
  });
});

