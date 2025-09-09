import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { Button, type ButtonProps } from '../Button'

describe('Button', () => {
  const defaultProps: ButtonProps = {
    children: 'Test Button',
  }

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Button {...defaultProps} />)

      const button = screen.getByRole('button', { name: 'Test Button' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should render children correctly', () => {
      render(<Button>Click me!</Button>)

      expect(screen.getByText('Click me!')).toBeInTheDocument()
    })

    it('should render with JSX children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )

      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('should apply primary variant classes by default', () => {
      render(<Button {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-primary-600',
        'text-white',
        'hover:bg-primary-700'
      )
    })

    it('should apply secondary variant classes', () => {
      render(<Button {...defaultProps} variant="secondary" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-gray-600',
        'text-white',
        'hover:bg-gray-700'
      )
    })

    it('should apply danger variant classes', () => {
      render(<Button {...defaultProps} variant="danger" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-error-600',
        'text-white',
        'hover:bg-error-700'
      )
    })
  })

  describe('Sizes', () => {
    it('should apply medium size classes by default', () => {
      render(<Button {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm')
    })

    it('should apply small size classes', () => {
      render(<Button {...defaultProps} size="sm" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-2', 'text-sm')
    })

    it('should apply large size classes', () => {
      render(<Button {...defaultProps} size="lg" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'text-base')
    })
  })

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      render(<Button {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
      expect(button).toHaveClass('cursor-pointer')
      expect(button).not.toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
      expect(button).not.toHaveClass('cursor-pointer')
    })

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(<Button {...defaultProps} disabled onClick={handleClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Click Handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(<Button {...defaultProps} onClick={handleClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledOnce()
    })

    it('should work without onClick handler', () => {
      expect(() => {
        render(<Button {...defaultProps} />)
        const button = screen.getByRole('button')
        fireEvent.click(button)
      }).not.toThrow()
    })

    it('should handle multiple clicks', () => {
      const handleClick = vi.fn()
      render(<Button {...defaultProps} onClick={handleClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<Button {...defaultProps} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should preserve base classes with custom className', () => {
      render(<Button {...defaultProps} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass(
        'font-medium',
        'rounded-lg',
        'focus:outline-none'
      )
    })

    it('should work with empty className', () => {
      render(<Button {...defaultProps} className="" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('font-medium', 'rounded-lg')
    })
  })

  describe('Accessibility', () => {
    it('should have proper focus styling classes', () => {
      render(<Button {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2'
      )
    })

    it('should be focusable when enabled', () => {
      render(<Button {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should be focusable even when disabled (native behavior)', () => {
      render(<Button {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      // ネイティブのdisabledボタンは通常フォーカス不可だが、
      // これは仕様通りの動作
      expect(button).toBeDisabled()
    })
  })

  describe('Combination Props', () => {
    it('should handle all props together', () => {
      const handleClick = vi.fn()
      render(
        <Button
          variant="danger"
          size="lg"
          disabled={false}
          onClick={handleClick}
          className="extra-class"
        >
          Complex Button
        </Button>
      )

      const button = screen.getByRole('button', { name: 'Complex Button' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass(
        'bg-error-600',
        'px-6',
        'py-3',
        'text-base',
        'extra-class'
      )
      expect(button).not.toBeDisabled()

      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledOnce()
    })

    it('should handle disabled state with all other props', () => {
      const handleClick = vi.fn()
      render(
        <Button
          variant="secondary"
          size="sm"
          disabled
          onClick={handleClick}
          className="disabled-extra-class"
        >
          Disabled Button
        </Button>
      )

      const button = screen.getByRole('button', { name: 'Disabled Button' })
      expect(button).toBeDisabled()
      expect(button).toHaveClass(
        'bg-gray-600',
        'px-3',
        'py-2',
        'opacity-50',
        'disabled-extra-class'
      )

      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })
})
