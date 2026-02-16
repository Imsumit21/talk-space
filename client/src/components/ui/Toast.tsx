import React, { useEffect, useState } from 'react';
import { create } from 'zustand';

// Types
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

// Inline Zustand store
const useToastStore = create<{
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));

// useToast hook
export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    toast: (message: string, variant: ToastVariant = 'info', duration = 4000) =>
      addToast({ message, variant, duration }),
    success: (message: string) =>
      addToast({ message, variant: 'success', duration: 4000 }),
    error: (message: string) =>
      addToast({ message, variant: 'error', duration: 5000 }),
    warning: (message: string) =>
      addToast({ message, variant: 'warning', duration: 4000 }),
    info: (message: string) =>
      addToast({ message, variant: 'info', duration: 4000 }),
  };
}

// Variant styles
const variantStyles = {
  info: {
    border: 'border-l-4 border-l-accent-500',
    iconColor: 'text-accent-500',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  success: {
    border: 'border-l-4 border-l-voice-500',
    iconColor: 'text-voice-500',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  warning: {
    border: 'border-l-4 border-l-social-500',
    iconColor: 'text-social-500',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  error: {
    border: 'border-l-4 border-l-red-500',
    iconColor: 'text-red-500',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    ),
  },
};

// Toast component
interface ToastProps {
  item: ToastItem;
}

function Toast({ item }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, item.duration);

    return () => clearTimeout(timer);
  }, [item.duration, item.id]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      removeToast(item.id);
    }, 150);
  };

  const variant = variantStyles[item.variant];
  const baseStyles = 'glass rounded-lg px-4 py-3 flex items-start gap-3 min-w-[300px] max-w-[420px] shadow-lg';
  const exitAnimation = exiting ? 'motion-safe:animate-fadeOut' : '';

  return (
    <div className={`${baseStyles} ${variant.border} ${exitAnimation}`}>
      <div className={`flex-shrink-0 ${variant.iconColor}`}>{variant.icon}</div>
      <div className="flex-1 text-sm text-white">{item.message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

// ToastProvider component
export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="motion-safe:animate-slideUp">
          <Toast item={toast} />
        </div>
      ))}
    </div>
  );
}
