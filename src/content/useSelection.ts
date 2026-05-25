import { useEffect, useState } from 'react';

export interface SelectionAnchor {
  text: string;
  /** Viewport-relative bounding rect of the selection. */
  rect: { top: number; left: number; right: number; bottom: number; width: number; height: number };
}

const MIN_LEN = 2;
const MAX_LEN = 2000;

/**
 * Listens to text selections on the page and exposes the latest non-empty selection
 * along with its viewport rect. Clears when the selection becomes empty, the user
 * clicks elsewhere, or selection happens inside our own Shadow DOM host.
 */
export function useSelection(): {
  anchor: SelectionAnchor | null;
  clear: () => void;
} {
  const [anchor, setAnchor] = useState<SelectionAnchor | null>(null);

  useEffect(() => {
    let scheduled = 0;
    const onMouseUp = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('#luduan-root')) return;
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        if (!sel || text.length < MIN_LEN || text.length > MAX_LEN || sel.rangeCount === 0) {
          setAnchor(null);
          return;
        }
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          setAnchor(null);
          return;
        }
        setAnchor({
          text,
          rect: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
        });
      });
    };

    const onScrollOrResize = () => setAnchor(null);

    document.addEventListener('mouseup', onMouseUp);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      cancelAnimationFrame(scheduled);
    };
  }, []);

  return { anchor, clear: () => setAnchor(null) };
}
