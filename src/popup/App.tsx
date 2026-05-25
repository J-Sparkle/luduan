import { Settings, History, BookMarked, Sparkles, ExternalLink } from 'lucide-react';

function openOptions() {
  chrome.runtime.openOptionsPage();
}

export function App() {
  return (
    <div className="flex h-full flex-col bg-surface-muted">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent text-white font-bold">
            甪
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight">甪端 Luduan</div>
            <div className="text-[11px] text-slate-500">通晓四夷之语</div>
          </div>
        </div>
        <button
          onClick={openOptions}
          className="ld-btn-ghost h-8 w-8 rounded-full p-0"
          aria-label="设置"
        >
          <Settings size={16} />
        </button>
      </header>

      <main className="flex-1 px-4 space-y-3 overflow-auto ld-scrollbar">
        <div className="ld-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-brand-500" />
            <div className="text-sm font-medium">开始使用</div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            在任意网页 <b>选中文本</b>，气泡按钮会出现在右上方，点击即可翻译。
          </p>
          <button onClick={openOptions} className="ld-btn-primary w-full mt-3">
            配置 AI 模型 →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <QuickAction icon={<History size={16} />} label="历史记录" />
          <QuickAction icon={<BookMarked size={16} />} label="生词本" />
        </div>
      </main>

      <footer className="px-4 py-3 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-slate-500">
        <span>v0.1.0 · 开源</span>
        <a
          href="https://github.com/J-Sparkle/luduan"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-brand-500"
        >
          GitHub <ExternalLink size={10} />
        </a>
      </footer>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="ld-card p-3 flex flex-col items-start gap-2 hover:shadow-bubble transition-shadow">
      <div className="text-brand-500">{icon}</div>
      <div className="text-xs font-medium">{label}</div>
    </button>
  );
}
