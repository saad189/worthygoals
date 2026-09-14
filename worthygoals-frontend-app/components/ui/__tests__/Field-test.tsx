/**
 * Guards H2 (app side). Field rendered errorText as a plain sibling Text: no
 * live region, no invalid state, and no tie to the input — so the error was
 * announced to nobody and marked on nothing (WCAG 3.3.1 and 4.1.3 both
 * failed). Its ternary also swapped `description` out for `errorText`,
 * removing the helper text at exactly the moment it was needed.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

import Field from '../Field';

describe('Field accessibility', () => {
  it('marks the input invalid and names the error on it', () => {
    render(<Field label="Email" errorText="Enter a valid email" />);

    const input = screen.getByLabelText('Email. Error: Enter a valid email');
    expect(input.props['aria-invalid']).toBe(true);
  });

  it('is not marked invalid without an error', () => {
    render(<Field label="Email" />);

    const input = screen.getByLabelText('Email');
    expect(input.props['aria-invalid']).toBe(false);
  });

  it('announces the error without stealing focus', () => {
    render(<Field label="Email" errorText="Enter a valid email" />);

    const message = screen.getByText('Enter a valid email');
    expect(message.props.accessibilityLiveRegion).toBe('polite');
  });

  it('keeps the helper text visible alongside the error', () => {
    render(
      <Field
        label="Password"
        description="At least 8 characters"
        errorText="Too short"
      />,
    );

    // Both, not one replacing the other.
    expect(screen.getByText('At least 8 characters')).toBeTruthy();
    expect(screen.getByText('Too short')).toBeTruthy();
  });
});
