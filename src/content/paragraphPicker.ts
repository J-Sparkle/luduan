import { embedTranslationInline } from './inlineEmbed';
import type { TranslateTask } from '@/shared/prompts';

const PARAGRAPH_SELECTOR =
  'p, h1, h2, h3, h4, h5, h6, li, blockquote, dd, article, section';
const HOVER_OUTLINE_STYLE = '2px dashed oklch(0.42 0.09 252)';

export interface PickerOptions {
  targetLang: string;
  style?: TranslateTask['style'];
  providerId?: string;
  modelName?: string;
  /** Called when user picks a block or cancels. */
  onDone?: (picked: boolean) => void;
}

/**
 * Enters "pick-a-paragraph" mode: changes the cursor, highlights the nearest
 * paragraph the mouse hovers over, and on click embeds a translation just
 * for that paragraph. Esc cancels.
 *
 * Returns a function to programmatically cancel the session.
 */
export function startParagraphPicker(opts: PickerOptions): () => void {
  let lastHovered: HTMLElement | null = null;
  let active = true;
  // Stash the original outline so we can restore on cancel.
  const originals = new WeakMap<
    HTMLElement,
    { outline: string; outlineOffset: string; cursor: string }
  >();

  document.body.style.cursor = 'crosshair';

  const findBlock = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    if (target.closest('#luduan-root')) return null;
    if (target.closest('.luduan-inline-translation')) return null;
    if (target.closest(PARAGRAPH_SELECTOR)) {
      return target.closest(PARAGRAPH_SELECTOR) as HTMLElement;
    }
    return null;
  };

  const clearHover = () => {
    if (lastHovered) {
      const orig = originals.get(lastHovered);
      if (orig) {
        lastHovered.style.outline = orig.outline;
        lastHovered.style.outlineOffset = orig.outlineOffset;
      }
      lastHovered = null;
    }
  };

  const onMove = (e: MouseEvent) => {
    if (!active) return;
    const block = findBlock(e.target);
    if (block === lastHovered) return;
    clearHover();
    if (block) {
      originals.set(block, {
        outline: block.style.outline,
        outlineOffset: block.style.outlineOffset,
        cursor: block.style.cursor,
      });
      block.style.outline = HOVER_OUTLINE_STYLE;
      block.style.outlineOffset = '2px';
      lastHovered = block;
    }
  };

  const onClick = (e: MouseEvent) => {
    if (!active) return;
    const block = findBlock(e.target);
    if (!block) return;
    e.preventDefault();
    e.stopPropagation();
    const text = block.textContent?.trim() ?? '';
    if (text.length < 4) {
      // Probably clicked an empty li or similar — ignore but keep picker active.
      return;
    }
    embedTranslationInline({
      container: block,
      task: {
        kind: 'translate',
        text,
        targetLang: opts.targetLang,
        style: opts.style ?? 'natural',
      },
      placement: 'below',
      providerId: opts.providerId,
      modelName: opts.modelName,
    });
    cleanup(true);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cleanup(false);
  };

  const cleanup = (picked: boolean) => {
    if (!active) return;
    active = false;
    document.body.style.cursor = '';
    clearHover();
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    opts.onDone?.(picked);
  };

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);

  return () => cleanup(false);
}
