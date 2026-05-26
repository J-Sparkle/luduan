import { cn } from './cn';

export type PillTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'err' | 'ink';

const TONE_CLASS: Record<PillTone, string> = {
  neutral: 'bg-surface-alt text-ink-soft border-ink-hair',
  accent: 'bg-accent-soft text-accent border-accent-rule',
  ok: 'bg-[oklch(0.92_0.04_155)] text-ok border-[oklch(0.52_0.10_155/0.25)]',
  warn: 'bg-[oklch(0.94_0.04_70)] text-warn border-[oklch(0.62_0.13_70/0.25)]',
  err: 'bg-[oklch(0.94_0.04_28)] text-err border-[oklch(0.55_0.16_28/0.25)]',
  ink: 'bg-ink text-paper border-ink',
};

export interface PillProps {
  children: React.ReactNode;
  tone?: PillTone;
  size?: number;
  className?: string;
}

export function Pill({ children, tone = 'neutral', size = 11, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border whitespace-nowrap leading-none',
        TONE_CLASS[tone],
        className,
      )}
      style={{
        fontSize: size,
        padding: `${size * 0.35}px ${size * 0.7}px`,
      }}
    >
      {children}
    </span>
  );
}
