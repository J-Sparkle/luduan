import { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Settings,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { SelectionAnchor } from './useSelection';
import { useTranslateStream } from './useTranslateStream';
import type { TranslateTask } from '@/shared/prompts';
import { cn } from '@/shared/ui/cn';

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

export function Card({ anchor, onClose }: CardProps) {
  const [targetLang, setTargetLang] = useState('中文');
  const [showOriginal, setShowOriginal] = useState(false);
  const [style, setStyle] = useState<TranslateTask['style']>('natural');

  const task = useMemo<TranslateTask>(
    () => ({ kind: 'translate', text: anchor.text, targetLang, style }),
    [anchor.text, targetLang, style],
  );
  const stream = useTranslateStream(task);

  // Position: prefer below selection; flip above if not enough room.
  const spaceBelow = window.innerHeight - anchor.rect.bottom;
  const above = spaceBelow < 320 && anchor.rect.top > 320;
  const top = above ? anchor.rect.top - CARD_GAP - 12 : anchor.rect.bottom + CARD_GAP;
  const left = Math.min(
    window.innerWidth - CARD_WIDTH - 8,
    Math.max(8, anchor.rect.left),
  );

  const isLoading = stream.status === 'starting' || stream.status === 'streaming';

  return (
    <div
      style={{
        position: 'fixed',
        top: above ? undefined : top,
        bottom: above ? window.innerHeight - top : undefined,
        left,
        width: CARD_WIDTH,
      }}
      className="animate-pop-in ld-card overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-accent text-[11px] font-bold text-white">
            甪
          </div>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="text-sm font-medium bg-transparent outline-none cursor-pointer hover:text-brand-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                译至 {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="ld-btn-ghost h-7 w-7 p-0 rounded-full"
            aria-label="设置"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={onClose}
            className="ld-btn-ghost h-7 w-7 p-0 rounded-full"
            aria-label="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Original (collapsed by default) */}
      <button
        onClick={() => setShowOriginal((v) => !v)}
        className="w-full px-4 py-1.5 text-[11px] text-slate-500 hover:bg-surface-subtle flex items-center justify-between"
      >
        <span>原文 ({anchor.text.length} 字符)</span>
        {showOriginal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {showOriginal && (
        <div className="px-4 pb-2 text-[13px] text-slate-600 max-h-24 overflow-auto ld-scrollbar bg-surface-muted/40">
          {anchor.text}
        </div>
      )}

      {/* Translation body */}
      <div className="px-4 py-3 min-h-[80px] max-h-[300px] overflow-auto ld-scrollbar">
        {stream.status === 'starting' && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin" />
            正在请求模型...
          </div>
        )}
        {stream.status === 'error' && (
          <div className="flex items-start gap-2 text-sm text-red-500">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">翻译失败</div>
              <div className="text-xs text-red-400 mt-0.5">{stream.error}</div>
            </div>
          </div>
        )}
        {(stream.status === 'streaming' || stream.status === 'done') && (
          <div className="text-[14px] leading-relaxed text-slate-800 whitespace-pre-wrap">
            {stream.text}
            {isLoading && (
              <span className="inline-block w-1.5 h-4 bg-brand-500 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-black/[0.05] bg-surface-muted/60">
        <div className="flex items-center gap-1">
          <ActionButton
            icon={<Volume2 size={13} />}
            label="朗读"
            onClick={() => speak(stream.text, targetLang)}
            disabled={!stream.text}
          />
          <ActionButton
            icon={<Copy size={13} />}
            label="复制"
            onClick={() => navigator.clipboard.writeText(stream.text)}
            disabled={!stream.text}
          />
          <StyleSelect value={style} onChange={setStyle} />
        </div>
        {stream.model && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Sparkles size={10} />
            {stream.model}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
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
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'ld-btn-ghost h-7 px-2 text-[11px]',
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
      className="ld-btn-ghost h-7 px-2 text-[11px] bg-transparent outline-none cursor-pointer"
    >
      {STYLES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

function speak(text: string, lang: string) {
  if (!text || typeof window.speechSynthesis === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  // Best-effort BCP-47 mapping from our display labels.
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
