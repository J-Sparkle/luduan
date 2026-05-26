/**
 * Luduan brand mark — a vesica piscis (two overlapping circles, intersection
 * filled). Geometric, scalable, culturally neutral. Read as "two languages
 * meeting in understanding".
 *
 * The mark is built as a React component (not a static SVG asset) so the
 * intersection clip and stroke width can scale precisely with `size`.
 */
export interface MarkProps {
  size?: number;
  /** Stroke color (defaults to ink). */
  color?: string;
  /** Intersection fill color. Falls back to `color`. */
  accent?: string;
  /** Whether to draw the filled intersection lens. */
  fillIntersect?: boolean;
}

export function Mark({
  size = 28,
  color = '#161616',
  accent,
  fillIntersect = true,
}: MarkProps) {
  const r = size * 0.32;
  const cx1 = size * 0.4;
  const cx2 = size * 0.6;
  const cy = size * 0.5;
  const stroke = Math.max(1, size * 0.045);
  const accentColor = accent ?? color;
  const clipId = `ld-vp-${size}-${color.replace(/[^A-Za-z0-9]/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx1} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx1} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} />
      <circle cx={cx2} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} />
      {fillIntersect && (
        <circle
          cx={cx2}
          cy={cy}
          r={r}
          fill={accentColor}
          clipPath={`url(#${clipId})`}
          opacity="0.92"
        />
      )}
    </svg>
  );
}
