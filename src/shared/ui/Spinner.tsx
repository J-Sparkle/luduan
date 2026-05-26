export interface SpinnerProps {
  size?: number;
  /** Color for the leading arc. Defaults to accent. */
  color?: string;
}

export function Spinner({ size = 14, color }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="loading"
      className="inline-block rounded-full animate-ld-spin border-[1.5px] border-ink-hair"
      style={{
        width: size,
        height: size,
        borderTopColor: color ?? 'oklch(0.42 0.09 252)',
      }}
    />
  );
}
