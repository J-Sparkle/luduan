import { useEffect, useMemo, useState } from 'react';
import { Mark } from '@/shared/ui/Mark';
import { Spinner } from '@/shared/ui/Spinner';
import { useProviders } from './useProviders';
import { loadLastModel } from '@/shared/store/last-model';
import {
  translateWholePage,
  type PageTranslateHandle,
  type PageTranslateState,
} from './fullPageTranslate';
import { startParagraphPicker } from './paragraphPicker';
import { removeAllInlineTranslations } from './inlineEmbed';
import { openOptions } from '@/shared/ui/openOptions';
import { cn } from '@/shared/ui/cn';

const STORAGE_KEY = 'luduan/fab-hidden';

/**
 * Persistent floating action ball on the right edge of any page.
 * Click → expands to a small vertical menu offering:
 *   - 翻译全文        run translateWholePage; in-progress state shows
 *                     a progress counter on the FAB itself
 *   - 翻译指定段落    enter paragraph-picker mode (crosshair + outline)
 *   - 清除翻译        wipe every inline embed on the page
 *   - 设置            opens options page
 *   - 隐藏            dismiss for this tab only (cleared on reload)
 *
 * The FAB lives in the Shadow DOM (mounted by mount.tsx) so its styles
 * are isolated from the host page.
 */
export function Fab() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [picking, setPicking] = useState(false);
  const [progress, setProgress] = useState<PageTranslateState | null>(null);
  const [pageHandle, setPageHandle] = useState<PageTranslateHandle | null>(null);

  // Honor a session-scoped "hide" so we don't keep nagging.
  useEffect(() => {
    setHidden(sessionStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const providers = useProviders();
  const usableProviders = useMemo(
    () => providers.filter((p) => p.enabled && p.apiKey && p.models.length > 0),
    [providers],
  );

  if (hidden) return null;

  const resolveModel = async () => {
    const last = await loadLastModel();
    if (last) {
      const p = usableProviders.find((p) => p.id === last.providerId);
      if (p && p.models.includes(last.modelName)) return last;
    }
    const first = usableProviders[0];
    if (!first) return null;
    return { providerId: first.id, modelName: first.models[0] };
  };

  const handleTranslateAll = async () => {
    setOpen(false);
    const sel = await resolveModel();
    if (!sel) {
      alert('请先在设置页配置一个 AI 模型');
      openOptions();
      return;
    }
    const handle = translateWholePage({
      targetLang: '中文',
      providerId: sel.providerId,
      modelName: sel.modelName,
      onProgress: (s) => {
        setProgress({ ...s });
        if (!s.running) {
          // Auto-clear progress 4s after completion.
          setTimeout(() => setProgress(null), 4000);
          setPageHandle(null);
        }
      },
    });
    setPageHandle(handle);
  };

  const handlePickParagraph = async () => {
    setOpen(false);
    const sel = await resolveModel();
    if (!sel) {
      alert('请先在设置页配置一个 AI 模型');
      openOptions();
      return;
    }
    setPicking(true);
    startParagraphPicker({
      targetLang: '中文',
      providerId: sel.providerId,
      modelName: sel.modelName,
      onDone: () => setPicking(false),
    });
  };

  const handleClearAll = () => {
    setOpen(false);
    removeAllInlineTranslations();
  };

  const handleCancelPage = () => {
    pageHandle?.cancel();
    setPageHandle(null);
    setProgress(null);
  };

  const handleHide = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setHidden(true);
  };

  // — Render —
  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-[2147483646] flex flex-col items-end gap-2">
      {/* Progress strip (when page-translate is running) */}
      {progress && (
        <div className="bg-surface border border-ink-rule rounded-sm shadow-pop px-3 py-2 flex items-center gap-2 text-[11px]">
          {progress.running ? (
            <>
              <Spinner size={12} />
              <span className="latin italic">translating</span>
              <span className="mono">
                {progress.done}/{progress.total}
              </span>
              {progress.failed > 0 && (
                <span className="text-err mono">· {progress.failed} failed</span>
              )}
              <button
                type="button"
                onClick={handleCancelPage}
                className="ml-1 text-ink-mute hover:text-err"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <span className="text-ok">✓</span>
              <span className="latin italic">done</span>
              <span className="mono">
                {progress.done}/{progress.total}
              </span>
            </>
          )}
        </div>
      )}

      {/* Picking-mode toast */}
      {picking && (
        <div className="bg-ink text-paper rounded-sm shadow-pop px-3 py-2 text-[11px]">
          请点击要翻译的段落 · Esc 取消
        </div>
      )}

      {/* Menu (when open) */}
      {open && (
        <div className="bg-surface border border-ink-rule rounded-sm shadow-pop overflow-hidden min-w-[160px]">
          <FabMenuItem onClick={handleTranslateAll} label="翻译全文" detail="entire page" />
          <FabMenuItem onClick={handlePickParagraph} label="翻译段落" detail="pick one" />
          <FabMenuItem onClick={handleClearAll} label="清除翻译" detail="undo embeds" />
          <FabDivider />
          <FabMenuItem onClick={openOptions} label="设置" detail="options" />
          <FabMenuItem onClick={handleHide} label="隐藏悬浮球" detail="this tab" muted />
        </div>
      )}

      {/* The ball itself */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? '关闭菜单' : '打开菜单'}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface border transition-all duration-200',
          open
            ? 'border-ink shadow-bubble-hover'
            : 'border-ink-rule shadow-bubble hover:border-ink hover:shadow-bubble-hover',
        )}
      >
        <Mark size={20} color="#161616" accent="oklch(0.42 0.09 252)" />
      </button>
    </div>
  );
}

function FabMenuItem({
  label,
  detail,
  onClick,
  muted,
}: {
  label: string;
  detail: string;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors',
        muted ? 'text-ink-mute' : 'text-ink',
        'hover:bg-surface-alt',
      )}
    >
      <span className="text-[13px]">{label}</span>
      <span className="latin italic text-[10.5px] text-ink-mute">{detail}</span>
    </button>
  );
}

function FabDivider() {
  return <div className="h-px bg-ink-hair" />;
}
