// Button Component Tests - Critical UI Component Coverage
// MANDATORY per AI_DEVELOPMENT_GUIDE.md for comprehensive testing

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../src/components/ui/Button/Button';

describe('🔥 Button Component - Critical UI Element Tests', () => {
    it('should render button with default props', () => {
        render(<Button>Click me</Button>);

        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('button');
    });

    it('should render different button variants', () => {
        const { rerender } = render(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('secondary');

        rerender(<Button variant="danger">Danger</Button>);
        expect(screen.getByRole('button')).toHaveClass('danger');

        rerender(<Button variant="outline">Outline</Button>);
        expect(screen.getByRole('button')).toHaveClass('outline');
    });

    it('should render different button sizes', () => {
        const { rerender } = render(<Button size="small">Small</Button>);
        expect(screen.getByRole('button')).toHaveClass('small');

        rerender(<Button size="large">Large</Button>);
        expect(screen.getByRole('button')).toHaveClass('large');
    });

    it('should handle click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled');
    });

    it('should handle loading state', () => {
        render(<Button loading>Loading</Button>);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('loading');
    });

    it('should render with custom className', () => {
        render(<Button className="custom-class">Custom</Button>);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
        expect(button).toHaveClass('button'); // Should still have default classes
    });

    it('should forward other props to button element', () => {
        render(<Button data-testid="custom-button" type="submit">Submit</Button>);

        const button = screen.getByTestId('custom-button');
        expect(button).toHaveAttribute('type', 'submit');
    });

    it('should not trigger onClick when disabled', () => {
        const handleClick = jest.fn();
        render(<Button disabled onClick={handleClick}>Disabled</Button>);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not trigger onClick when loading', () => {
        const handleClick = jest.fn();
        render(<Button loading onClick={handleClick}>Loading</Button>);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should render children correctly', () => {
        render(
            <Button>
                <span>Icon</span>
                Button Text
            </Button>
        );

        expect(screen.getByText('Icon')).toBeInTheDocument();
        expect(screen.getByText('Button Text')).toBeInTheDocument();
    });

    it('should handle button variants correctly', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByRole('button')).toHaveClass('primary');

        rerender(<Button variant="success">Success</Button>);
        expect(screen.getByRole('button')).toHaveClass('success');

        rerender(<Button variant="warning">Warning</Button>);
        expect(screen.getByRole('button')).toHaveClass('warning');
    });
}); 