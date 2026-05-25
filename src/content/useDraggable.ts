import { useEffect, useState, type RefObject } from 'react';

export interface Position {
  top: number;
  left: number;
}

/**
 * Makes an element draggable from a specific handle (e.g. the card header).
 *
 *  - Returns the current position; consumer is expected to apply it via
 *    inline style (so React owns layout, not the DOM).
 *  - Initial position comes from `initial`. After the first drag, the
 *    dragged position takes over and ignores subsequent `initial` updates
 *    (so resizing the viewport doesn't yank a manually positioned card).
 *  - Pointer events (not mouse) so it works with trackpad gestures and pens.
 *  - Pointer capture means dragging continues even if the cursor leaves
 *    the handle / browser window.
 *  - Skips drag start when the pointer is over an interactive child
 *    (buttons, inputs) so users can still click controls in the header.
 */
export function useDraggable(
  containerRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
  initial: Position,
): { pos: Position; isDragging: boolean } {
  const [pos, setPos] = useState<Position>(initial);
  const [pinned, setPinned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Follow `initial` only until the user takes manual control.
  useEffect(() => {
    if (!pinned) setPos(initial);
  }, [initial.top, initial.left, pinned]);

  useEffect(() => {
    const handle = handleRef.current;
    const container = containerRef.current;
    if (!handle || !container) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startTop = 0;
    let startLeft = 0;
    let activePointerId = -1;

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow normal interactions with controls in the header.
      if (target?.closest('button, input, select, textarea, a, [role="button"]')) {
        return;
      }
      const rect = container.getBoundingClientRect();
      dragging = true;
      activePointerId = e.pointerId;
      startTop = rect.top;
      startLeft = rect.left;
      startX = e.clientX;
      startY = e.clientY;
      setPinned(true);
      setIsDragging(true);
      try {
        handle.setPointerCapture(e.pointerId);
      } catch {
        /* setPointerCapture can throw on some platforms; ignore */
      }
      e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rect = container.getBoundingClientRect();
      const maxLeft = Math.max(0, window.innerWidth - rect.width);
      const maxTop = Math.max(0, window.innerHeight - rect.height);
      setPos({
        top: clamp(startTop + dy, 0, maxTop),
        left: clamp(startLeft + dx, 0, maxLeft),
      });
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      dragging = false;
      setIsDragging(false);
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch {
        /* releasePointerCapture can throw if the pointer was never captured */
      }
    };

    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
    return () => {
      handle.removeEventListener('pointerdown', onDown);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };
  }, [containerRef, handleRef]);

  return { pos, isDragging };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
