import { useState, useMemo, useRef, useEffect } from 'react';
import type { SelectionAnchor } from './useSelection';
import { useTranslateStream, type ModelSelection } from './useTranslateStream';
import { useDraggable } from './useDraggable';
import { useProviders } from './useProviders';
import { loadLastModel, saveLastModel } from '@/shared/store/last-model';
import type { StoredProvider } from '@/shared/store/providers';
import type { TranslateTask } from '@/shared/prompts';
import { Mark, Caret, Spinner, cn, openOptions } from '@/shared/ui';

interface CardProps {
  anchor: SelectionAnchor;
  onClose: () => void;
}

const LANGUAGES = [
  { code: '中文', label: '中文' },
  { code: 'English', label: 'English' },
  { code: '日本語', label: '日本語' },
  { code: '한국어', label: '한국어' },
  { code: 'Français', label: 'Français' },
  { code: 'Deutsch', label: 'Deutsch' },
  { code: 'Español', label: 'Español' },
];

const CARD_WIDTH = 380;
const CARD_GAP = 12;
const FOLD_SIZE = 16;

/**
 * Bookish translation card. Novelty: paper-fold corner at top-right
 * (a small 16×16 triangular overlay that suggests a turned page).
 *
 * Outer: surface bg, ink-rule border, sm radius, pop shadow.
 * Top bar: drag handle with 2×3 dot grid + mark + EN→中文 indicator + 4 mini buttons.
 * Body: starting | streaming (with caret) | done | error.
 * Action bar: 朗读 / 复制 / 风格 + model badge right-aligned.
 */
export function Card({ anchor, onClose }: CardProps) {
  const [targetLang, setTargetLang] = useState('中文');
  const [showOriginal, setShowOriginal] = useState(false);
  const [style, setStyle] = useState<TranslateTask['style']>('natural');

  const task = useMemo<TranslateTask>(
    () => ({ kind: 'translate', text: anchor.text, targetLang, style }),
    [anchor.text, targetLang, style],
  );

  const providers = useProviders();
  const usableProviders = useMemo(
    () => providers.filter((p) => p.enabled && p.apiKey && p.models.length > 0),
    [providers],
  );

  const [selection, setSelection] = useState<ModelSelection | null>(null);
  useEffect(() => {
    if (selection || usableProviders.length === 0) return;
    let cancelled = false;
    loadLastModel().then((last) => {
      if (cancelled) return;
      if (last) {
        const p = usableProviders.find((p) => p.id === last.providerId);
        if (p && p.models.includes(last.modelName)) {
          setSelection(last);
          return;
        }
      }
      const first = usableProviders[0];
      setSelection({ providerId: first.id, modelName: first.models[0] });
    });
    return () => {
      cancelled = true;
    };
  }, [usableProviders, selection]);
  useEffect(() => {
    if (selection) void saveLastModel(selection);
  }, [selection]);

  const stream = useTranslateStream(task, selection);

  const initialPos = useMemo(() => {
    const spaceBelow = window.innerHeight - anchor.rect.bottom;
    const above = spaceBelow < 320 && anchor.rect.top > 320;
    const top = above
      ? Math.max(8, anchor.rect.top - 320 - CARD_GAP)
      : anchor.rect.bottom + CARD_GAP;
    const left = Math.min(
      window.innerWidth - CARD_WIDTH - 8,
      Math.max(8, anchor.rect.left),
    );
    return { top, left };
  }, [anchor.rect.top, anchor.rect.bottom, anchor.rect.left]);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const { pos, isDragging } = useDraggable(cardRef, headerRef, initialPos);

  const isLoading = stream.status === 'starting' || stream.status === 'streaming';

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: CARD_WIDTH,
        boxShadow: isDragging
          ? '0 14px 36px rgba(22,22,22,0.16), 0 0 0 1px rgba(22,22,22,0.20)'
          : undefined,
        opacity: isDragging ? 0.85 : 1,
      }}
      className="
        bg-surface border border-ink-rule rounded-sm shadow-pop
        animate-pop-in overflow-visible
      "
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="翻译结果"
    >
      {/* Paper-fold corner */}
      <span
        aria-hidden
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: FOLD_SIZE,
          height: FOLD_SIZE,
          background:
            'linear-gradient(225deg, transparent 50%, #F4F1EA 50%)',
          borderLeft: '1px solid rgb(22 22 22 / 0.10)',
          borderBottom: '1px solid rgb(22 22 22 / 0.10)',
          borderBottomLeftRadius: 4,
        }}
      />

      {/* Top bar — drag handle */}
      <div
        ref={headerRef}
        className={cn(
          'h-9 flex items-center justify-between gap-2 pl-3 pr-2 border-b border-ink-hair select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <DragDots />
          <Mark size={14} color="#161616" accent="oklch(0.42 0.09 252)" />
          <span className="latin text-[11px] text-ink-mute">EN</span>
          <span className="text-ink-faint text-[11px]">→</span>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-transparent outline-none text-[11px] text-ink-soft cursor-pointer hover:text-ink"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-0.5 mr-3">
          <MiniBtn title="设置" onClick={openOptions}>
            <CogGlyph />
          </MiniBtn>
          <MiniBtn title="关闭" onClick={onClose}>
            ×
          </MiniBtn>
        </div>
      </div>

      {/* Collapsible source */}
      <button
        type="button"
        onClick={() => setShowOriginal((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] text-ink-mute hover:bg-surface-alt/70 border-b border-ink-hair"
      >
        <span className="flex items-center gap-1.5">
          <Chevron open={showOriginal} />
          <span className="latin italic">
            {anchor.text.length > 60
              ? anchor.text.slice(0, 60) + '…'
              : anchor.text}
          </span>
        </span>
        <span className="mono text-[10px]">{anchor.text.length} 字</span>
      </button>
      {showOriginal && (
        <div className="px-4 py-2 text-[13px] text-ink-soft max-h-28 overflow-auto ld-scrollbar bg-surface-alt/40 border-b border-ink-hair latin italic leading-relaxed">
          {anchor.text}
        </div>
      )}

      {/* Body */}
      <div className="px-[18px] py-4 min-h-[120px] max-h-[300px] overflow-auto ld-scrollbar">
        {stream.status === 'starting' && (
          <div className="flex items-center gap-2 text-[13px] text-ink-mute">
            <Spinner size={14} />
            <span>正在请求模型⋯</span>
          </div>
        )}
        {stream.status === 'error' && <ErrorBlock message={stream.error} />}
        {(stream.status === 'streaming' || stream.status === 'done') && (
          <div className="text-[14.5px] leading-[1.85] text-ink whitespace-pre-wrap">
            {stream.text}
            {isLoading && <Caret />}
          </div>
        )}
      </div>

      {/* Action bar */}
      {stream.status === 'done' && (
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-ink-hair">
          <div className="flex items-center gap-0.5">
            <QuietChip
              icon={<SpeakerGlyph />}
              label="朗读"
              onClick={() => speak(stream.text, targetLang)}
              disabled={!stream.text}
            />
            <QuietChip
              icon={<CopyGlyph />}
              label="复制"
              onClick={() => navigator.clipboard.writeText(stream.text)}
              disabled={!stream.text}
            />
            <StyleSelect value={style} onChange={setStyle} />
          </div>
          <ModelSelector
            providers={usableProviders}
            value={selection}
            onChange={setSelection}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components

function DragDots() {
  return (
    <div
      className="grid grid-cols-2 gap-[2px] opacity-40"
      style={{ gridTemplateRows: 'repeat(3, 2px)' }}
      aria-hidden
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="block bg-ink rounded-full"
          style={{ width: 2, height: 2 }}
        />
      ))}
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-[22px] w-[22px] items-center justify-center text-[11px] text-ink-soft rounded-xs hover:bg-surface-alt hover:text-ink transition-colors"
    >
      {children}
    </button>
  );
}

function QuietChip({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-7 px-2 inline-flex items-center gap-1.5 text-[11px] text-ink-soft rounded-xs hover:bg-surface-alt hover:text-ink',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

const STYLES: Array<{ value: TranslateTask['style']; label: string }> = [
  { value: 'natural', label: '意译' },
  { value: 'literal', label: '直译' },
  { value: 'academic', label: '学术' },
  { value: 'casual', label: '口语' },
];

function StyleSelect({
  value,
  onChange,
}: {
  value: TranslateTask['style'];
  onChange: (v: TranslateTask['style']) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TranslateTask['style'])}
      className="h-7 px-2 text-[11px] text-ink-soft bg-transparent outline-none rounded-xs cursor-pointer hover:bg-surface-alt hover:text-ink"
      title="切换翻译风格"
    >
      {STYLES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

function ModelSelector({
  providers,
  value,
  onChange,
}: {
  providers: StoredProvider[];
  value: ModelSelection | null;
  onChange: (s: ModelSelection) => void;
}) {
  if (providers.length === 0) {
    return (
      <button
        type="button"
        onClick={openOptions}
        className="text-[10.5px] text-warn hover:text-ink latin italic"
      >
        unconfigured →
      </button>
    );
  }
  const totalModels = providers.reduce((s, p) => s + p.models.length, 0);
  const composite = value ? `${value.providerId}|${value.modelName}` : '';
  return (
    <select
      value={composite}
      onChange={(e) => {
        const [providerId, modelName] = e.target.value.split('|');
        if (providerId && modelName) onChange({ providerId, modelName });
      }}
      disabled={totalModels <= 1}
      title={totalModels <= 1 ? '只有一个可用模型' : '切换模型即重新翻译'}
      className="latin italic text-[10.5px] text-ink-mute bg-transparent outline-none cursor-pointer hover:text-ink max-w-[180px] truncate"
    >
      {providers.map((p) => (
        <optgroup key={p.id} label={p.name}>
          {p.models.map((m) => (
            <option key={`${p.id}|${m}`} value={`${p.id}|${m}`}>
              {m}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function ErrorBlock({ message }: { message?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-err shrink-0"
        style={{ background: 'oklch(0.95 0.03 28)' }}
        aria-hidden
      >
        !
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-err font-medium">请求失败</div>
        <div className="text-[12px] text-ink-soft mt-1 leading-[1.6]">
          {message ?? '未知错误'}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={openOptions}
            className="text-[11px] text-accent hover:opacity-80"
          >
            前往设置 →
          </button>
        </div>
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform .15s',
      }}
    >
      <path d="M2 4 L5 7 L8 4" />
    </svg>
  );
}

function CogGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2.1 1.2L5 6 3 9.4l2 1.4a7 7 0 000 2.4l-2 1.4L5 18l2.3-.9a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002.1-1.2l2.3.9 2-3.4-2-1.4c.1-.4.1-.8.1-1.2z" />
    </svg>
  );
}

function SpeakerGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 6v4h2l3 2V4L5 6H3z" />
      <path d="M11 6c.7.5 1 1.2 1 2s-.3 1.5-1 2" />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5" y="5" width="8" height="8" rx="1" />
      <path d="M3 11V4a1 1 0 011-1h7" />
    </svg>
  );
}

function speak(text: string, lang: string) {
  if (!text || typeof window.speechSynthesis === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  const map: Record<string, string> = {
    中文: 'zh-CN',
    English: 'en-US',
    日本語: 'ja-JP',
    한국어: 'ko-KR',
    Français: 'fr-FR',
    Deutsch: 'de-DE',
    Español: 'es-ES',
  };
  u.lang = map[lang] ?? 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
