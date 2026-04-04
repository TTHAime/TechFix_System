import zxcvbn from 'zxcvbn';
import { Check, X } from 'lucide-react';

const SCORE_CONFIG = [
  { label: 'Too weak', barColor: 'bg-red-500', textColor: 'text-red-500' },
  { label: 'Weak', barColor: 'bg-orange-400', textColor: 'text-orange-400' },
  { label: 'Fair', barColor: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { label: 'Strong', barColor: 'bg-lime-500', textColor: 'text-lime-600' },
  { label: 'Very strong', barColor: 'bg-green-500', textColor: 'text-green-600' },
] as const;

const CHECKS = [
  { label: 'At least 15 characters', test: (v: string) => v.length >= 15 },
  { label: 'Uppercase letter (A–Z)', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter (a–z)', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Number (0–9)', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Special character (!@#$…)', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function barSegmentClass(index: number, score: number, activeColor: string): string {
  const fillColor = index <= score ? activeColor : 'bg-muted';
  return `h-1.5 flex-1 rounded-full transition-colors duration-300 ${fillColor}`;
}

interface CheckItemProps {
  readonly label: string;
  readonly passed: boolean;
}

function CheckItem({ label, passed }: CheckItemProps) {
  const Icon = passed ? Check : X;
  const iconClass = passed ? 'text-green-500' : 'text-muted-foreground';
  const textClass = passed ? 'text-foreground' : 'text-muted-foreground';

  return (
    <li className="flex items-center gap-1.5 text-xs">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} />
      <span className={textClass}>{label}</span>
    </li>
  );
}

interface PasswordStrengthMeterProps {
  readonly value: string;
}

export function PasswordStrengthMeter({ value }: PasswordStrengthMeterProps) {
  if (!value) return null;

  const score = zxcvbn(value).score;
  const config = SCORE_CONFIG[score];

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={barSegmentClass(i, score, config.barColor)} />
          ))}
        </div>
        <p className={`text-xs font-semibold ${config.textColor}`}>{config.label}</p>
      </div>
      <ul className="space-y-1">
        {CHECKS.map(({ label, test }) => (
          <CheckItem key={label} label={label} passed={test(value)} />
        ))}
      </ul>
    </div>
  );
}
