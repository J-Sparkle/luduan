import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'    // ink bg, paper text — main CTA
  | 'secondary'  // surface bg, ink border, ink text
  | 'ghost'      // transparent
  | 'accent'     // indigo bg, paper text
  | 'danger'     // surface bg, err text + tinted border
  | 'quiet';     // surface-alt bg, ink-hair border, ink text

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  /** Replaces button content with a spinner; button stays disabled while loading. */
  loading?: boolean;
  full?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper border-ink hover:bg-ink/90',
  secondary: 'bg-surface text-ink border-ink-rule hover:bg-surface-alt',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-alt',
  accent: 'bg-accent text-paper border-accent hover:opacity-90',
  danger:
    'bg-surface text-err border-err/30 hover:bg-err/5',
  quiet:
    'bg-surface-alt text-ink border-ink-hair hover:bg-ink-hair/10',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-[26px] px-[10px] text-[12px] gap-1.5',
  md: 'h-[34px] px-[14px] text-[13px] gap-2',
  lg: 'h-[42px] px-[18px] text-[14px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    full,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-sm border font-normal whitespace-nowrap tracking-[0.02em] transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 12 : 14} /> : icon}
      {children}
    </button>
  );
});
