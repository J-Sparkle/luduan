import { Mark } from './Mark';

export interface WordmarkProps {
  size?: number;
  color?: string;
  accent?: string;
  showLatin?: boolean;
}

/**
 * Mark + 甪端 + italic "Luduan" (Latin secondary). `size` controls the
 * Chinese glyph baseline; the mark + Latin are derived from it.
 */
export function Wordmark({
  size = 14,
  color = '#161616',
  accent,
  showLatin = true,
}: WordmarkProps) {
  return (
    <div
      style={{ color }}
      className="inline-flex items-center"
    >
      <Mark size={size * 1.8} color={color} accent={accent} />
      <div
        className="flex items-baseline"
        style={{ marginLeft: size * 0.55, gap: size * 0.5 }}
      >
        <span
          style={{
            fontSize: size * 1.15,
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
        >
          甪端
        </span>
        {showLatin && (
          <span
            className="latin italic text-ink-mute"
            style={{
              fontSize: size * 0.78,
              letterSpacing: '0.02em',
            }}
          >
            Luduan
          </span>
        )}
      </div>
    </div>
  );
}
