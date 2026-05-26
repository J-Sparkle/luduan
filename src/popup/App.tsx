import { useEffect, useState } from 'react';
import { Wordmark, Button, Pill, IconBtn, openOptions } from '@/shared/ui';
import { loadProviders, type StoredProvider } from '@/shared/store/providers';

/**
 * Popup top-level. Adapts to one of four shell states:
 *   - Initial (no provider configured)   ← onboarding nudge
 *   - Ready   (at least one usable)      ← hub view
 *   - Loading (storage not read yet)     ← skeleton
 *
 * History/wordbook tiles are placeholders until those features land
 * (roadmap items §-§ of README_EN.md).
 */
export function App() {
  const [providers, setProviders] = useState<StoredProvider[] | null>(null);
  useEffect(() => {
    loadProviders().then(setProviders);
  }, []);

  if (providers === null) return <PopupSkeleton />;
  const ready = providers.find(
    (p) => p.enabled && p.apiKey && p.models.length > 0,
  );

  return (
    <Shell>
      {ready ? <ReadyBody provider={ready} /> : <InitialBody />}
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shell

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col bg-paper border border-ink-hair shadow-card">
      <header className="flex h-12 items-center justify-between px-4 border-b border-ink-hair">
        <Wordmark size={13} />
        <div className="flex items-center gap-1">
          <IconBtn aria-label="搜索">
            <SearchIcon />
          </IconBtn>
          <IconBtn aria-label="设置" onClick={openOptions}>
            <CogIcon />
          </IconBtn>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
      <footer className="flex h-8 items-center justify-between px-4 text-[10.5px] text-ink-mute border-t border-ink-hair">
        <span className="latin italic">v0.1.0 · open source</span>
        <a
          href="https://github.com/J-Sparkle/luduan"
          target="_blank"
          rel="noreferrer"
          className="latin italic hover:text-ink"
        >
          GitHub ↗
        </a>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State A · Initial — no provider configured

function InitialBody() {
  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <div className="ld-card p-[20px_18px_22px] relative">
        <div className="ld-cap mb-2.5">开 始 使 用</div>
        <div className="text-[17px] leading-[1.5] font-medium mb-1.5">
          通晓四夷之语，
          <br />
          照见万物之意。
        </div>
        <div className="text-[12px] text-ink-mute leading-[1.6] mb-4">
          请先配置一个 AI 模型，然后在任何网页选中文字即可翻译。
        </div>
        <Button variant="primary" size="md" full onClick={openOptions}>
          <span>配置 AI 模型</span>
          <span className="ml-auto">→</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DisabledTile icon={<BookIcon />} label="历 史 记 录" />
        <DisabledTile icon={<StarIcon />} label="生 词 本" />
      </div>

      <div className="mt-auto flex items-center gap-2 text-[11px] text-ink-mute">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: 'oklch(0.62 0.13 70)' }}
        />
        需要先添加一个 Provider
      </div>
    </div>
  );
}

function DisabledTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="ld-card p-3 flex flex-col items-start gap-2 opacity-45 pointer-events-none"
      aria-disabled
    >
      <span className="text-ink-soft">{icon}</span>
      <div className="text-[11px] text-ink-soft tracking-cap-tight">{label}</div>
      <div className="text-[10px] text-ink-mute latin italic">empty</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State B · Ready

function ReadyBody({ provider }: { provider: StoredProvider }) {
  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <div className="ld-card p-[16px_18px_18px] flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="ld-cap-tight">当 前 模 型</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[14.5px] font-medium">{provider.name}</span>
            <span className="latin italic text-[11.5px] text-ink-mute">
              {provider.protocol} · {provider.models[0]}
            </span>
          </div>
        </div>
        <Pill tone="ok" size={10.5}>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: 'oklch(0.52 0.10 155)' }}
          />
          就绪
        </Pill>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-px bg-ink-hair" />
        <span className="text-[11px] text-ink-mute">·</span>
        <div className="flex-1 h-px bg-ink-hair" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="ld-cap">使 用 方 式</div>
        <UsageStep
          num="一"
          text="选中网页上的任意文字"
          aside="any page, any language"
        />
        <UsageStep num="二" text="点击浮出的气泡按钮，或按" code="⌥ + T" />
        <UsageStep num="三" text="翻译卡片浮现，按住顶栏可拖动" />
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <EmptyQuickTile label="历 史 记 录" detail="暂无" />
        <EmptyQuickTile label="生 词 本" detail="暂无" />
      </div>
    </div>
  );
}

function UsageStep({
  num,
  text,
  code,
  aside,
}: {
  num: string;
  text: string;
  code?: string;
  aside?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 text-[13px] leading-relaxed">
      <span className="text-accent w-4 shrink-0 font-medium">{num}</span>
      <span className="text-ink-soft flex-1">
        {text}
        {code && (
          <code className="ml-1.5 mono text-[12px] px-1.5 py-0.5 rounded-xs bg-surface-alt border border-ink-hair">
            {code}
          </code>
        )}
      </span>
      {aside && (
        <span className="latin italic text-[10.5px] text-ink-mute shrink-0">
          {aside}
        </span>
      )}
    </div>
  );
}

function EmptyQuickTile({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="ld-card p-3 flex flex-col gap-1">
      <div className="ld-cap-tight">{label}</div>
      <div className="text-[18px] font-medium">—</div>
      <div className="text-[10px] text-ink-mute latin italic">{detail}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton

function PopupSkeleton() {
  return (
    <Shell>
      <div className="flex h-full flex-col gap-5 p-5">
        <SkelBox h={120} />
        <div className="grid grid-cols-2 gap-3">
          <SkelBox h={68} />
          <SkelBox h={68} />
        </div>
      </div>
    </Shell>
  );
}

function SkelBox({ h }: { h: number }) {
  return (
    <div
      className="rounded-xs bg-ink-hair animate-ld-pulse"
      style={{ height: h }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG glyphs (kept inline — small and not worth a sprite file)

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4a7 7 0 015.3 11.6l4.1 4.1-1.4 1.4-4.1-4.1A7 7 0 1111 4zm0 2a5 5 0 100 10 5 5 0 000-10z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2.1 1.2L5 6 3 9.4l2 1.4a7 7 0 000 2.4l-2 1.4L5 18l2.3-.9a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002.1-1.2l2.3.9 2-3.4-2-1.4c.1-.4.1-.8.1-1.2z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4V4z" />
      <path d="M20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7V4z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.4 6L12 16.4 6.5 19.4l1.4-6L3.3 9.2l6.1-.6L12 3z" />
    </svg>
  );
}
