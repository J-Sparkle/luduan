import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export interface IconBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Toggled visual state (e.g. menu pinned). */
  active?: boolean;
  size?: number;
}

/**
 * Small icon button used in chrome headers (popup header, card top bar).
 * Pure ghost background unless active; uses accent on active.
 */
export const IconBtn = forwardRef<HTMLButtonElement, IconBtnProps>(function IconBtn(
  { active, size = 28, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-sm transition-colors duration-150',
        active
          ? 'bg-accent-soft text-accent'
          : 'text-ink-soft hover:bg-surface-alt',
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  );
});
