import { cn } from './cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Visual size (track height stays the design-spec 18px). */
  disabled?: boolean;
  'aria-label'?: string;
}

/** 32×18 track, 14px round handle. Ink-filled when on. */
export function Switch({ checked, onChange, disabled, ...aria }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center w-8 h-[18px] rounded-pill transition-colors duration-200',
        checked ? 'bg-ink' : 'bg-ink-hair',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
      {...aria}
    >
      <span
        className={cn(
          'inline-block w-[14px] h-[14px] rounded-full bg-paper shadow-card transition-transform duration-200',
        )}
        style={{
          transform: checked ? 'translateX(16px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}
