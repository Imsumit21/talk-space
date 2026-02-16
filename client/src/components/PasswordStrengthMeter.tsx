import zxcvbn from 'zxcvbn';

export interface PasswordStrengthMeterProps {
  password: string;
}

const colors = ['#ef4444', '#f59e0b', '#fbbf24', '#10b981', '#059669'];
const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  // Don't render anything if password is empty
  if (!password) {
    return null;
  }

  // Calculate password strength using zxcvbn (0-4 scale)
  const result = zxcvbn(password);
  const score = result.score;

  // Calculate bar width based on score (0 -> 20%, 1 -> 40%, 2 -> 60%, 3 -> 80%, 4 -> 100%)
  const width = ((score + 1) * 20);
  const color = colors[score];
  const label = labels[score];

  return (
    <div className="w-full">
      {/* Strength Bar */}
      <div className="h-1 w-full bg-surface-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Strength Label */}
      <p
        className="text-xs mt-1"
        style={{ color }}
      >
        {label}
      </p>
    </div>
  );
}
