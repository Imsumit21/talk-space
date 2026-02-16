import React, { useState, MouseEvent } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-glow-sm shadow-primary-500/25',
  secondary: 'bg-surface-700 hover:bg-surface-600 text-white border border-glass-border',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-glow-sm shadow-red-500/25',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, children, className = '', onClick, disabled, ...props }, ref) => {
    const [ripple, setRipple] = useState<{ x: number; y: number; show: boolean }>({
      x: 0,
      y: 0,
      show: false,
    });

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      // Calculate ripple position relative to button
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setRipple({ x, y, show: true });

      // Hide ripple after animation
      setTimeout(() => {
        setRipple((prev) => ({ ...prev, show: false }));
      }, 600);

      // Call original onClick handler
      if (onClick) {
        onClick(e);
      }
    };

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${loading ? 'opacity-80' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        onClick={handleClick}
        disabled={loading || disabled}
        aria-busy={loading}
        aria-disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
        {ripple.show && (
          <span
            className="absolute w-4 h-4 bg-white/30 rounded-full pointer-events-none motion-safe:animate-ripple"
            style={{
              left: ripple.x - 8,
              top: ripple.y - 8,
            }}
          />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
