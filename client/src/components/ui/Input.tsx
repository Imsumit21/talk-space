import React, { useId } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const baseSizeStyles = {
  sm: 'text-sm pt-4 pb-1 px-3',
  md: 'text-sm pt-5 pb-1.5 px-3',
  lg: 'text-base pt-6 pb-2 px-4',
};

const baseInputStyles = 'w-full bg-surface-800 text-white rounded-lg border outline-none transition-all duration-200';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success = false, icon, size = 'md', className = '', id: providedId, ...props }, ref) => {
    const autoId = useId();
    const id = providedId || autoId;
    const errorId = `${id}-error`;

    // Determine border and ring styles based on validation state
    const getBorderStyles = () => {
      if (error) {
        return 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30';
      }
      if (success) {
        return 'border-voice-500 focus:border-voice-500 focus:ring-2 focus:ring-voice-500/30';
      }
      return 'border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30';
    };

    // Determine label position offset based on icon presence
    const labelLeftPosition = icon ? 'left-9' : 'left-3';

    // Determine input padding left based on icon presence
    const inputPaddingLeft = icon ? 'pl-9' : '';

    const combinedInputClassName = `
      ${baseInputStyles}
      ${baseSizeStyles[size]}
      ${getBorderStyles()}
      ${inputPaddingLeft}
      ${className}
      peer
    `.trim().replace(/\s+/g, ' ');

    const labelSizeStyles = {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm',
    };

    return (
      <div className="relative w-full">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={id}
          className={combinedInputClassName}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />

        {/* Floating Label */}
        <label
          htmlFor={id}
          className={`
            absolute ${labelLeftPosition} top-1/2 -translate-y-1/2
            text-gray-400 text-sm
            transition-all duration-200
            pointer-events-none
            peer-focus:top-1.5 peer-focus:-translate-y-0 peer-focus:${labelSizeStyles[size]} peer-focus:text-primary-400
            peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:${labelSizeStyles[size]}
          `.trim().replace(/\s+/g, ' ')}
        >
          {label}
        </label>

        {/* Error Message */}
        {error && (
          <p id={errorId} className="text-red-400 text-xs mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
