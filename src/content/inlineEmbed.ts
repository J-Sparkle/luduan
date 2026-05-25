import { MSG, type ChatPortMessage, type ChatPortRequest } from '@/shared/messaging/protocol';
import type { TranslateTask } from '@/shared/prompts';

export type EmbedPlacement = 'below' | 'beside';

export interface EmbedOptions {
  container: Element;     // host page element to attach next to
  task: TranslateTask;
  placement?: EmbedPlacement;
  /** Optional explicit provider+model override (same semantics as
   *  ChatPortRequest). If omitted, the background falls back to the
   *  first enabled provider's first model. */
  providerId?: string;
  modelName?: string;
}

const INLINE_CLASS = 'luduan-inline-translation';
const BRAND = '#7C5CFF';

/**
 * Renders the translation directly into the host page (NOT in our Shadow
 * DOM), as a sibling to the selection's block container. This integrates
 * visually with the page text the way Immersive Translate's bilingual mode
 * does, instead of floating as an overlay.
 *
 * The inserted node uses `all: initial` + inline styles to defend against
 * stray page CSS, and carries a brand-colored left bar so it's recognisable
 * but doesn't overwhelm.
 */
export function embedTranslationInline(opts: EmbedOptions): {
  element: HTMLElement;
  port: chrome.runtime.Port;
} {
  const placement = opts.placement ?? 'below';

  const wrapper = document.createElement('div');
  wrapper.className = INLINE_CLASS;
  wrapper.dataset.luduanInline = '1';
  wrapper.dataset.luduanPlacement = placement;
  applyWrapperStyles(wrapper, placement);

  // Text body (where streaming chunks go) + streaming cursor + close button.
  const body = document.createElement('div');
  Object.assign(body.style, {
    display: 'block',
    whiteSpace: 'pre-wrap',
    paddingRight: '28px',
    color: 'inherit',
  });
  wrapper.appendChild(body);

  const cursor = document.createElement('span');
  cursor.textContent = '▍';
  Object.assign(cursor.style, {
    display: 'inline-block',
    color: BRAND,
    opacity: '0.5',
    animation: 'luduan-blink 1.1s linear infinite',
    marginLeft: '2px',
  });
  body.appendChild(cursor);

  // One-time keyframes injection for the cursor pulse.
  ensureBlinkKeyframes();

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.title = '关闭翻译';
  closeBtn.setAttribute('aria-label', '关闭翻译');
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '4px',
    right: '6px',
    cursor: 'pointer',
    color: BRAND,
    background: 'transparent',
    border: 'none',
    padding: '2px 8px',
    fontSize: '16px',
    lineHeight: '1',
    fontFamily: 'inherit',
    borderRadius: '4px',
  });
  closeBtn.onmouseenter = () => (closeBtn.style.background = 'rgba(124,92,255,0.1)');
  closeBtn.onmouseleave = () => (closeBtn.style.background = 'transparent');
  wrapper.appendChild(closeBtn);

  // Insert into page DOM.
  if (placement === 'below') {
    opts.container.parentNode?.insertBefore(wrapper, opts.container.nextSibling);
  } else {
    // 'beside': try to put it on the right of the container in a flex row;
    // fall back to 'below' if the container has no parent we can wrap.
    insertBeside(opts.container, wrapper);
  }

  // Stream into it via a fresh background port.
  const port = chrome.runtime.connect({ name: MSG.PORT_CHAT });
  let accum = '';

  const cleanup = () => {
    try {
      port.disconnect();
    } catch {
      /* already gone */
    }
  };

  closeBtn.onclick = () => {
    cleanup();
    wrapper.remove();
  };

  port.onMessage.addListener((msg: ChatPortMessage) => {
    if (msg.type === 'text') {
      accum += msg.delta;
      // Re-render body: text first, then cursor at the end.
      while (body.firstChild) body.removeChild(body.firstChild);
      body.appendChild(document.createTextNode(accum));
      body.appendChild(cursor);
    } else if (msg.type === 'error') {
      cursor.remove();
      while (body.firstChild) body.removeChild(body.firstChild);
      body.appendChild(
        document.createTextNode(`翻译失败：${msg.message}`),
      );
      wrapper.style.borderLeftColor = '#dc2626';
      body.style.color = '#dc2626';
      cleanup();
    } else if (msg.type === 'done') {
      cursor.remove();
      cleanup();
    }
  });

  port.onDisconnect.addListener(() => {
    cursor.remove();
  });

  const req: ChatPortRequest = {
    type: 'translate',
    task: opts.task,
    providerId: opts.providerId,
    modelName: opts.modelName,
  };
  port.postMessage(req);

  return { element: wrapper, port };
}

function applyWrapperStyles(el: HTMLElement, placement: EmbedPlacement): void {
  // Reset inherited weirdness, then apply our own.
  el.style.cssText = '';
  Object.assign(el.style, {
    boxSizing: 'border-box',
    display: 'block',
    margin: placement === 'below' ? '8px 0' : '0',
    padding: '8px 12px',
    border: '1px solid rgba(124, 92, 255, 0.25)',
    borderLeft: `3px solid ${BRAND}`,
    borderRadius: '6px',
    background: 'rgba(124, 92, 255, 0.05)',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1A1D2B',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    position: 'relative',
    textAlign: 'left',
    width: '100%',
  } as Partial<CSSStyleDeclaration>);
}

function insertBeside(container: Element, wrapper: HTMLElement): void {
  // Wrap [container, wrapper] in a flex row so they sit side by side
  // without needing to mutate the container's own styles permanently.
  const parent = container.parentNode;
  if (!parent) return;
  // Look for an existing luduan flex wrapper from a prior translation.
  const existingRow = container.parentElement?.classList.contains(
    'luduan-flex-row',
  )
    ? container.parentElement
    : null;
  if (existingRow) {
    existingRow.appendChild(wrapper);
    return;
  }
  const row = document.createElement('div');
  row.className = 'luduan-flex-row';
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%',
  } as Partial<CSSStyleDeclaration>);
  parent.insertBefore(row, container);
  // Move container into the row, keep relative widths balanced.
  (container as HTMLElement).style.flex = '1 1 0';
  wrapper.style.flex = '1 1 0';
  wrapper.style.margin = '0';
  row.appendChild(container);
  row.appendChild(wrapper);
}

function ensureBlinkKeyframes(): void {
  if (document.getElementById('luduan-blink-style')) return;
  const style = document.createElement('style');
  style.id = 'luduan-blink-style';
  style.textContent =
    '@keyframes luduan-blink { 0%, 100% { opacity: 0.5 } 50% { opacity: 0 } }';
  document.head.appendChild(style);
}

/** Remove all inline translations on the current page. */
export function removeAllInlineTranslations(): number {
  const list = document.querySelectorAll(`.${INLINE_CLASS}`);
  list.forEach((el) => el.remove());
  // Unwrap any luduan-flex-row containers we created.
  document.querySelectorAll('.luduan-flex-row').forEach((row) => {
    const parent = row.parentNode;
    if (!parent) return;
    while (row.firstChild) {
      parent.insertBefore(row.firstChild, row);
    }
    row.remove();
  });
  return list.length;
}
