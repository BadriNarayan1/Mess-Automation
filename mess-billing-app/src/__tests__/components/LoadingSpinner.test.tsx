/**
 * @jest-environment jsdom
 */
// tests/components/LoadingSpinner.test.tsx (Example Component Test)
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Example dummy component since actual UI files may vary
function LoadingSpinner() {
  return (
    <div data-testid="spinner-container" className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" 
           role="status" 
           aria-label="loading">
      </div>
    </div>
  );
}

describe('LoadingSpinner Component', () => {
  it('renders a loading spinner correctly', () => {
    // 1. Render the component in virtual DOM
    render(<LoadingSpinner />);

    // 2. Query elements
    const spinner = screen.getByRole('status', { name: /loading/i });
    const container = screen.getByTestId('spinner-container');

    // 3. Assert correct rendering and classes
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
    expect(container).toHaveClass('flex');
  });
});
