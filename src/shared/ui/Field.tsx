import { cn } from './cn';

export interface FieldProps {
  /** Caption label above the input. */
  label?: React.ReactNode;
  /** Right-aligned addon next to the label (e.g. "3 个"). */
  addon?: React.ReactNode;
  /** Help text below the input (muted). */
  hint?: React.ReactNode;
  /** Error message below the input (red). Takes precedence over hint. */
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, addon, hint, error, children, className }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[12px] text-ink-soft">
          <span>{label}</span>
          {addon && <span className="text-[11px] text-ink-mute">{addon}</span>}
        </div>
      )}
      {children}
      {error ? (
        <div className="mt-1.5 text-[11px] text-err">{error}</div>
      ) : hint ? (
        <div className="mt-1.5 text-[11px] text-ink-mute">{hint}</div>
      ) : null}
    </label>
  );
}
