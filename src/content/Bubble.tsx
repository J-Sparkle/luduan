import { Languages } from 'lucide-react';
import type { SelectionAnchor } from './useSelection';

interface BubbleProps {
  anchor: SelectionAnchor;
  onClick: () => void;
}

const BUBBLE_SIZE = 32;
const OFFSET = 8;

export function Bubble({ anchor, onClick }: BubbleProps) {
  // Position bubble to the upper-right of the selection, clamped to viewport.
  const top = Math.max(8, anchor.rect.top - BUBBLE_SIZE - OFFSET);
  const left = Math.min(
    window.innerWidth - BUBBLE_SIZE - 8,
    Math.max(8, anchor.rect.right - BUBBLE_SIZE),
  );

  return (
    <button
      onMouseDown={(e) => {
        // Prevent the click from clearing the page selection.
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{ position: 'fixed', top, left, width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
      className="animate-pop-in flex items-center justify-center rounded-full
                 bg-gradient-to-br from-brand-500 to-accent text-white shadow-bubble
                 hover:scale-105 active:scale-95 transition-transform"
      aria-label="翻译选中文本"
      title="翻译 (Alt+T)"
    >
      <Languages size={16} strokeWidth={2.25} />
    </button>
  );
}
