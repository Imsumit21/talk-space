import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'outline';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles = {
  glass: 'glass rounded-xl',
  solid: 'bg-surface-800 rounded-xl border border-surface-700',
  outline: 'bg-transparent rounded-xl border border-surface-600',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export function Card({
  variant = 'glass',
  hover = false,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  const baseStyles = 'overflow-hidden';
  const variantClass = variantStyles[variant];
  const paddingClass = paddingStyles[padding];
  const hoverClass = hover
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10'
    : '';
  const glassHoverClass = hover && variant === 'glass' ? 'glass-hover' : '';

  const combinedClasses = [
    baseStyles,
    variantClass,
    paddingClass,
    hoverClass,
    glassHoverClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}
