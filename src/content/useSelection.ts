import { useEffect, useState } from 'react';

export interface SelectionAnchor {
  text: string;
  /** Viewport-relative bounding rect of the selection. */
  rect: { top: number; left: number; right: number; bottom: number; width: number; height: number };
  /** Block-level ancestor of the selection — used by inline-embed mode to
   *  decide where to insert the translation into the host page. Captured at
   *  selection time so it stays valid even after the page selection is
   *  cleared (e.g. when the user clicks our bubble). */
  containerEl?: Element;
}

/** Tags treated as "paragraph-like" anchors for inline embedding. */
const BLOCK_TAGS = new Set([
  'P', 'LI', 'BLOCKQUOTE', 'PRE', 'DD', 'DT',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'TD', 'TH', 'FIGCAPTION', 'ARTICLE', 'SECTION',
]);

export function findBlockAncestor(node: Node): Element | null {
  let el: Element | null =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  while (el && el !== document.body) {
    if (BLOCK_TAGS.has(el.tagName)) return el;
    el = el.parentElement;
  }
  // Fall back to the first child of body so we never insert into <head>.
  return el;
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
          containerEl: findBlockAncestor(range.commonAncestorContainer) ?? undefined,
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
