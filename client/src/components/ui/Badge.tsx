import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'accent' | 'voice' | 'social' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
  accent: 'bg-accent-500/20 text-accent-300 border border-accent-500/30',
  voice: 'bg-voice-500/20 text-voice-300 border border-voice-500/30',
  social: 'bg-social-500/20 text-social-300 border border-social-500/30',
  danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
  neutral: 'bg-surface-700 text-gray-300 border border-surface-600',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs rounded',
  md: 'px-2.5 py-0.5 text-xs rounded-md',
};

const pulseDotColors = {
  primary: 'bg-primary-400',
  accent: 'bg-accent-400',
  voice: 'bg-voice-400',
  social: 'bg-social-400',
  danger: 'bg-red-400',
  neutral: 'bg-gray-400',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
  children,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  const animationClass = 'motion-safe:animate-scaleIn';

  const combinedClasses = [baseStyles, variantClass, sizeClass, animationClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={combinedClasses}>
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseDotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
