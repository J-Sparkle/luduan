import { embedTranslationInline } from './inlineEmbed';
import type { TranslateTask } from '@/shared/prompts';

/** Block-level selectors we consider "translatable" paragraphs. */
const PARAGRAPH_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, dd';
const MIN_CHARS = 12;
const MAX_CHARS = 4000;
/** Sites whose nav/aside/footer we want to exclude. */
const SKIP_ANCESTOR_SELECTOR = 'nav, header, footer, aside, [aria-hidden="true"]';
/** Tags we know hold non-prose (toolbars, code). */
const SKIP_PARENT_TAGS = new Set(['SCRIPT', 'STYLE', 'PRE', 'CODE', 'BUTTON']);

export interface PageTranslateOptions {
  targetLang: string;
  style?: TranslateTask['style'];
  providerId?: string;
  modelName?: string;
  /** Notified on progress. */
  onProgress?: (state: PageTranslateState) => void;
  /** Max in-flight requests at any time. */
  concurrency?: number;
}

export interface PageTranslateState {
  total: number;
  done: number;
  failed: number;
  running: boolean;
}

export interface PageTranslateHandle {
  cancel: () => void;
}

/**
 * Translate every prose paragraph on the page in-place, inserting the
 * translation directly below each block via the inline-embed renderer.
 *
 * Strategy:
 *   - Collect blocks via PARAGRAPH_SELECTOR, filter trash (too short,
 *     inside nav/footer/code, etc.)
 *   - Prefer blocks that are currently in the viewport (sort by distance
 *     to viewport center) so the user sees results immediately
 *   - Run with bounded concurrency (default 3) — too many parallel
 *     requests will trip rate limits on most providers
 *   - Each block translates exactly once: we tag the block with
 *     data-luduan-translated="1" so re-running the page mode skips it
 */
export function translateWholePage(
  opts: PageTranslateOptions,
): PageTranslateHandle {
  const blocks = collectBlocks();
  const state: PageTranslateState = {
    total: blocks.length,
    done: 0,
    failed: 0,
    running: true,
  };
  opts.onProgress?.(state);

  const concurrency = Math.max(1, Math.min(5, opts.concurrency ?? 3));
  let nextIndex = 0;
  let cancelled = false;
  const activePorts = new Set<chrome.runtime.Port>();

  const next = () => {
    if (cancelled) return;
    if (nextIndex >= blocks.length) {
      if (activePorts.size === 0) {
        state.running = false;
        opts.onProgress?.({ ...state });
      }
      return;
    }
    const block = blocks[nextIndex++];
    const text = block.textContent?.trim() ?? '';
    block.setAttribute('data-luduan-translated', '1');

    const { port } = embedTranslationInline({
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
    activePorts.add(port);

    const finalize = (ok: boolean) => {
      activePorts.delete(port);
      if (cancelled) return;
      if (ok) state.done += 1;
      else state.failed += 1;
      opts.onProgress?.({ ...state });
      next();
    };

    port.onMessage.addListener((msg) => {
      if (msg?.type === 'done') finalize(true);
      else if (msg?.type === 'error') finalize(false);
    });
    port.onDisconnect.addListener(() => {
      // If we never saw a done/error before disconnect, still advance.
      if (activePorts.has(port)) finalize(false);
    });
  };

  // Kick off `concurrency` workers.
  for (let i = 0; i < concurrency; i += 1) next();

  return {
    cancel: () => {
      cancelled = true;
      state.running = false;
      activePorts.forEach((p) => {
        try {
          p.disconnect();
        } catch {
          /* already closed */
        }
      });
      activePorts.clear();
      opts.onProgress?.({ ...state });
    },
  };
}

/** Visible, in-viewport-first ordering of translatable blocks. */
function collectBlocks(): Element[] {
  const all = Array.from(document.querySelectorAll(PARAGRAPH_SELECTOR));
  const viewportH = window.innerHeight;
  const filtered: Array<{ el: Element; score: number }> = [];

  for (const el of all) {
    if (!isTranslatable(el)) continue;
    const rect = el.getBoundingClientRect();
    // Score: distance from viewport center (smaller = sooner).
    const center = rect.top + rect.height / 2;
    const score = Math.abs(center - viewportH / 2);
    filtered.push({ el, score });
  }
  filtered.sort((a, b) => a.score - b.score);
  return filtered.map((x) => x.el);
}

function isTranslatable(el: Element): boolean {
  // Already translated this run.
  if (el.hasAttribute('data-luduan-translated')) return false;
  // Our own UI surfaces.
  if (el.closest('#luduan-root')) return false;
  if (el.closest('.luduan-inline-translation')) return false;
  // Wrong ancestor (navigation chrome, etc.)
  if (el.closest(SKIP_ANCESTOR_SELECTOR)) return false;
  if (SKIP_PARENT_TAGS.has(el.tagName)) return false;
  // Empty / very short / very long.
  const text = el.textContent?.trim() ?? '';
  if (text.length < MIN_CHARS) return false;
  if (text.length > MAX_CHARS) return false;
  // Mostly numeric / punctuation? Skip.
  if (text.replace(/[\s\d\p{P}]/gu, '').length < MIN_CHARS) return false;
  // Hidden?
  const rect = (el as HTMLElement).getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = window.getComputedStyle(el as HTMLElement);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return true;
}
