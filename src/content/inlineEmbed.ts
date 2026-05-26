import { MSG, type ChatPortMessage, type ChatPortRequest } from '@/shared/messaging/protocol';
import type { TranslateTask } from '@/shared/prompts';

export type EmbedPlacement = 'below' | 'beside';

export interface EmbedOptions {
  container: Element;
  task: TranslateTask;
  placement?: EmbedPlacement;
  providerId?: string;
  modelName?: string;
}

const INLINE_CLASS = 'luduan-inline-translation';
const INK = '#161616';
const INK_HAIR = 'rgba(22,22,22,0.10)';
const INK_MUTE = 'rgba(22,22,22,0.52)';
const ACCENT = 'oklch(0.42 0.09 252)';

/**
 * Bookish inline embed — instead of a colored left-border box around the
 * translation, we use **classical book typography**: hair-rules above and
 * below the translation, with a small marginalia tag ("中 译") in the gutter.
 *
 * Streams text into the embed via a long-lived background port. The wrapper
 * is rendered into the host page DOM (not Shadow DOM) so it integrates
 * visually with the surrounding paragraph's typography, but its inner
 * styles are all explicit so page CSS can't drift the layout.
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

  // Marginalia tag: vertical "中 译" caption with hair-rule below.
  const gutter = document.createElement('div');
  Object.assign(gutter.style, {
    position: 'absolute',
    left: '0',
    top: '12px',
    width: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    color: INK_MUTE,
    fontSize: '9px',
    letterSpacing: '0.12em',
    lineHeight: '1.4',
    fontFamily: 'inherit',
    pointerEvents: 'none',
  });
  gutter.innerHTML = `<span>中</span><span>译</span>`;
  const gutterRule = document.createElement('div');
  Object.assign(gutterRule.style, {
    width: '1px',
    height: '20px',
    background: INK_HAIR,
    marginTop: '4px',
  });
  gutter.appendChild(gutterRule);
  wrapper.appendChild(gutter);

  // Text body
  const body = document.createElement('div');
  Object.assign(body.style, {
    display: 'block',
    whiteSpace: 'pre-wrap',
    color: INK,
    fontSize: '14.5px',
    lineHeight: '1.85',
    padding: '0 32px 0 0',
  });
  wrapper.appendChild(body);

  // Streaming cursor (anchored at end of body)
  const cursor = document.createElement('span');
  Object.assign(cursor.style, {
    display: 'inline-block',
    width: '2px',
    height: '1.05em',
    background: ACCENT,
    marginLeft: '2px',
    verticalAlign: '-2px',
    animation: 'luduan-blink 1s infinite',
  });
  body.appendChild(cursor);
  ensureKeyframes();

  // Close button (top-right of wrapper, hairline ghost)
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.title = '关闭翻译';
  closeBtn.setAttribute('aria-label', '关闭翻译');
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '6px',
    right: '0',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    color: INK_MUTE,
    background: 'transparent',
    border: 'none',
    padding: '0',
    fontSize: '14px',
    lineHeight: '1',
    fontFamily: 'inherit',
    borderRadius: '2px',
  });
  closeBtn.onmouseenter = () => (closeBtn.style.color = INK);
  closeBtn.onmouseleave = () => (closeBtn.style.color = INK_MUTE);
  wrapper.appendChild(closeBtn);

  // Insert into page DOM.
  if (placement === 'below') {
    opts.container.parentNode?.insertBefore(wrapper, opts.container.nextSibling);
  } else {
    insertBeside(opts.container, wrapper);
  }

  // Stream into it.
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
      while (body.firstChild) body.removeChild(body.firstChild);
      body.appendChild(document.createTextNode(accum));
      body.appendChild(cursor);
    } else if (msg.type === 'error') {
      cursor.remove();
      while (body.firstChild) body.removeChild(body.firstChild);
      body.appendChild(document.createTextNode(`翻译失败：${msg.message}`));
      body.style.color = 'oklch(0.55 0.16 28)';
      cleanup();
    } else if (msg.type === 'done') {
      cursor.remove();
      cleanup();
    }
  });
  port.onDisconnect.addListener(() => cursor.remove());

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
  el.style.cssText = '';
  Object.assign(el.style, {
    boxSizing: 'border-box',
    display: 'block',
    margin: placement === 'below' ? '12px 0' : '0',
    padding: '10px 0 12px',
    borderTop: `1px solid ${INK_HAIR}`,
    borderBottom: `1px solid ${INK_HAIR}`,
    paddingLeft: '36px',
    position: 'relative',
    fontFamily:
      '"Noto Serif SC", "Songti SC", "STSong", "Source Han Serif SC", Georgia, serif',
    color: INK,
    textAlign: 'left',
    width: '100%',
  } as Partial<CSSStyleDeclaration>);
}

function insertBeside(container: Element, wrapper: HTMLElement): void {
  const parent = container.parentNode;
  if (!parent) return;
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'flex-start',
    gap: '0',
    width: '100%',
    borderTop: `1px solid ${INK_HAIR}`,
    borderBottom: `1px solid ${INK_HAIR}`,
  } as Partial<CSSStyleDeclaration>);
  parent.insertBefore(row, container);
  (container as HTMLElement).style.padding = '10px 18px 12px 0';
  (container as HTMLElement).style.borderRight = `1px solid ${INK_HAIR}`;
  wrapper.style.margin = '0';
  wrapper.style.borderTop = 'none';
  wrapper.style.borderBottom = 'none';
  wrapper.style.padding = '10px 0 12px 18px';
  wrapper.style.paddingLeft = '54px';
  row.appendChild(container);
  row.appendChild(wrapper);
}

function ensureKeyframes(): void {
  if (document.getElementById('luduan-blink-style')) return;
  const style = document.createElement('style');
  style.id = 'luduan-blink-style';
  style.textContent =
    '@keyframes luduan-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }';
  document.head.appendChild(style);
}

export function removeAllInlineTranslations(): number {
  const list = document.querySelectorAll(`.${INLINE_CLASS}`);
  list.forEach((el) => el.remove());
  document.querySelectorAll('.luduan-flex-row').forEach((row) => {
    const parent = row.parentNode;
    if (!parent) return;
    while (row.firstChild) parent.insertBefore(row.firstChild, row);
    row.remove();
  });
  return list.length;
}
