import { Mark } from '@/shared/ui/Mark';
import type { SelectionAnchor } from './useSelection';

interface BubbleProps {
  anchor: SelectionAnchor;
  onClick: () => void;
}

const BUBBLE_SIZE = 36;
const OFFSET = 8;

/**
 * 36px circle bubble, white paper background, ink-rule border, hairline drop
 * shadow. Hosts the vesica-piscis mark. Hover state darkens the border ring.
 * Pop-in (250ms) on appear; CSS handles the scale and opacity transitions.
 */
export function Bubble({ anchor, onClick }: BubbleProps) {
  const top = Math.max(8, anchor.rect.top - BUBBLE_SIZE - OFFSET);
  const left = Math.min(
    window.innerWidth - BUBBLE_SIZE - 8,
    Math.max(8, anchor.rect.right - BUBBLE_SIZE),
  );

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: 'fixed',
        top,
        left,
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
      }}
      className="
        inline-flex items-center justify-center rounded-full bg-surface
        border border-ink-rule shadow-bubble
        animate-pop-in
        transition-all duration-200
        hover:border-ink hover:shadow-bubble-hover hover:scale-[1.06]
        active:scale-[0.94]
      "
      aria-label="翻译选中文本"
      title="翻译 (Alt+T)"
    >
      <Mark size={20} color="#161616" accent="oklch(0.42 0.09 252)" />
    </button>
  );
}
