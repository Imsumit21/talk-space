import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GradientBackground } from './GradientBackground';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from './ui/Toast';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '../schemas/auth';
import { login, register } from '../services/auth';
import { useGameStore } from '../store/useGameStore';

type Tab = 'login' | 'register';

export function AuthForms() {
  const [tab, setTab] = useState<Tab>('login');
  const [shaking, setShaking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { error: showError } = useToast();

  // Login form
  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { isSubmitting: isLoginSubmitting },
    reset: resetLogin,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  // Register form
  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    formState: { isSubmitting: isRegisterSubmitting },
    watch,
    reset: resetRegister,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  // Watch password field for strength meter
  const password = watch('password');

  // Handle tab switch
  const handleTabSwitch = (newTab: Tab) => {
    setTab(newTab);
    // Reset the other form
    if (newTab === 'login') {
      resetRegister();
    } else {
      resetLogin();
    }
  };

  // Listen for animation end to reset shaking state
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleAnimationEnd = () => {
      setShaking(false);
    };

    card.addEventListener('animationend', handleAnimationEnd);
    return () => card.removeEventListener('animationend', handleAnimationEnd);
  }, []);

  // Login submit handler
  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({ email: data.email, password: data.password });
      useGameStore.getState().setAuthUser(result.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      showError(errorMessage);
      setShaking(true);
    }
  };

  // Register submit handler
  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register({
        email: data.email,
        username: data.username,
        password: data.password,
      });
      useGameStore.getState().setAuthUser(result.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      showError(errorMessage);
      setShaking(true);
    }
  };

  return (
    <>
      <GradientBackground />
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card
          ref={cardRef}
          variant="glass"
          padding="lg"
          className={`max-w-md w-full ${shaking ? 'animate-shake' : ''}`}
        >
          {/* Talk Space Branding */}
          <div className="flex flex-col items-center mb-6">
            {/* SVG Icon with Glow */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-3"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.6))',
              }}
            >
              {/* Two overlapping circles representing proximity/connection */}
              <circle cx="18" cy="24" r="12" stroke="currentColor" strokeWidth="2" className="text-primary-400" />
              <circle cx="30" cy="24" r="12" stroke="currentColor" strokeWidth="2" className="text-accent-400" />
              {/* Sound waves */}
              <path
                d="M 12 24 Q 10 24 10 22 M 10 26 Q 10 24 12 24 M 36 24 Q 38 24 38 22 M 38 26 Q 38 24 36 24"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-primary-300"
              />
            </svg>

            {/* Heading */}
            <h1 className="font-heading text-2xl font-bold text-white text-center">
              Talk Space
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-gray-400 text-center">
              Connect with people nearby
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-surface-800 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-200 rounded-md ${
                tab === 'login'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-200 rounded-md ${
                tab === 'register'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
              <Controller
                name="email"
                control={loginControl}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    type="email"
                    label="Email"
                    error={fieldState.error?.message}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m2 7 10 7 10-7" />
                      </svg>
                    }
                  />
                )}
              />

              <Controller
                name="password"
                control={loginControl}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    type="password"
                    label="Password"
                    error={fieldState.error?.message}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    }
                  />
                )}
              />

              <Button
                type="submit"
                loading={isLoginSubmitting}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 hover:scale-[1.02] hover:shadow-glow-md shadow-primary-500/25"
              >
                Sign In
              </Button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
              <Controller
                name="email"
                control={registerControl}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    type="email"
                    label="Email"
                    error={fieldState.error?.message}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m2 7 10 7 10-7" />
                      </svg>
                    }
                  />
                )}
              />

              <Controller
                name="username"
                control={registerControl}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    type="text"
                    label="Username"
                    error={fieldState.error?.message}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                  />
                )}
              />

              <Controller
                name="password"
                control={registerControl}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Input
                      {...field}
                      type="password"
                      label="Password"
                      error={fieldState.error?.message}
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      }
                    />
                    <PasswordStrengthMeter password={password || ''} />
                  </div>
                )}
              />

              <Controller
                name="confirmPassword"
                control={registerControl}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    type="password"
                    label="Confirm Password"
                    error={fieldState.error?.message}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    }
                  />
                )}
              />

              <Button
                type="submit"
                loading={isRegisterSubmitting}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 hover:scale-[1.02] hover:shadow-glow-md shadow-primary-500/25"
              >
                Create Account
              </Button>
            </form>
          )}

          {/* Social Auth Placeholder */}
          <div className="mt-6">
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-surface-600"></div>
              <span className="px-3 text-xs text-gray-500">or continue with</span>
              <div className="flex-1 border-t border-surface-600"></div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <Button
                variant="secondary"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>

            {/* Coming Soon Label */}
            <p className="text-xs text-gray-500 text-center mt-3">Coming soon</p>
          </div>
        </Card>
      </div>
    </>
  );
}
