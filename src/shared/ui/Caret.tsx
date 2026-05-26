export interface CaretProps {
  color?: string;
}

/** Streaming/cursor caret — 2px wide, animated blink, accent color by default. */
export function Caret({ color }: CaretProps) {
  return (
    <span
      aria-hidden
      className="inline-block w-[2px] animate-ld-blink"
      style={{
        height: '1.05em',
        background: color ?? 'oklch(0.42 0.09 252)',
        marginLeft: 2,
        verticalAlign: -2,
      }}
    />
  );
}
