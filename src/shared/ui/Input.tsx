import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Use the monospace font (for keys, URLs, technical strings). */
  mono?: boolean;
  /** Visual error state — pairs with Field's `error` prop. */
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { mono, invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full h-[36px] px-3 rounded-sm border bg-surface text-[13px] text-ink outline-none transition-all duration-150',
        'placeholder:text-ink-mute',
        invalid
          ? 'border-err focus:ring-[3px] focus:ring-err/20'
          : 'border-ink-rule focus:border-accent focus:ring-[3px] focus:ring-accent/15',
        mono && 'font-mono text-[12px]',
        className,
      )}
      {...rest}
    />
  );
});
