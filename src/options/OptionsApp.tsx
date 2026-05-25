import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check, ExternalLink, Sparkles } from 'lucide-react';
import {
  loadProviders,
  upsertProvider,
  deleteProvider,
  newProviderId,
  type StoredProvider,
} from '@/shared/store/providers';
import { PROVIDER_PRESETS } from '@/shared/providers/presets';
import { getAdapter } from '@/shared/providers/adapters';
import { cn } from '@/shared/ui/cn';

export function OptionsApp() {
  const [providers, setProviders] = useState<StoredProvider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadProviders().then((p) => {
      setProviders(p);
      if (p[0]) setSelectedId(p[0].id);
    });
  }, []);

  const selected = providers.find((p) => p.id === selectedId);

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-black/[0.05] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent text-white font-bold">
            甪
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">甪端 Luduan</h1>
            <p className="text-xs text-slate-500">通晓四夷之语 · 设置</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-[260px_1fr] gap-6">
        {/* Provider list */}
        <aside className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AI 模型
            </h2>
            <button
              onClick={() => setShowAdd(true)}
              className="ld-btn-ghost h-7 w-7 p-0 rounded-full"
              aria-label="添加"
            >
              <Plus size={14} />
            </button>
          </div>

          {providers.length === 0 && (
            <div className="ld-card p-4 text-sm text-slate-500">
              还没有配置任何 Provider。
              <button
                onClick={() => setShowAdd(true)}
                className="ld-btn-primary w-full mt-3"
              >
                添加第一个 →
              </button>
            </div>
          )}

          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={cn(
                'w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 transition-colors',
                selectedId === p.id ? 'bg-brand-100' : 'hover:bg-white',
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  p.enabled ? 'bg-emerald-500' : 'bg-slate-300',
                )}
              />
              <span className="text-sm flex-1 truncate">{p.name}</span>
              <span className="text-[10px] text-slate-400">{p.protocol}</span>
            </button>
          ))}
        </aside>

        {/* Detail */}
        <section>
          {selected ? (
            <ProviderForm
              key={selected.id}
              provider={selected}
              onChange={async (next) => {
                const list = await upsertProvider(next);
                setProviders(list);
              }}
              onDelete={async () => {
                const list = await deleteProvider(selected.id);
                setProviders(list);
                setSelectedId(list[0]?.id ?? null);
              }}
            />
          ) : (
            <EmptyState onAdd={() => setShowAdd(true)} />
          )}
        </section>
      </main>

      {showAdd && (
        <AddProviderModal
          onClose={() => setShowAdd(false)}
          onAdd={async (preset) => {
            const newProv: StoredProvider = {
              id: newProviderId(),
              name: preset.name,
              protocol: preset.protocol,
              baseUrl: preset.baseUrl,
              apiKey: '',
              models: preset.suggestedModels.slice(0, 1),
              enabled: false,
            };
            const list = await upsertProvider(newProv);
            setProviders(list);
            setSelectedId(newProv.id);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="ld-card p-12 text-center">
      <Sparkles size={32} className="mx-auto text-brand-400 mb-3" />
      <h3 className="font-semibold mb-1">尚未配置 AI 模型</h3>
      <p className="text-sm text-slate-500 mb-4">
        添加任意支持的 Provider 即可开始使用。
      </p>
      <button onClick={onAdd} className="ld-btn-primary">
        <Plus size={14} /> 添加 Provider
      </button>
    </div>
  );
}

function ProviderForm({
  provider,
  onChange,
  onDelete,
}: {
  provider: StoredProvider;
  onChange: (p: StoredProvider) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(provider);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState<'idle' | 'ok' | 'fail' | 'running'>('idle');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => setDraft(provider), [provider.id]);

  const update = (patch: Partial<StoredProvider>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onChange(next);
  };

  const testConnection = async () => {
    setTesting('running');
    setTestMsg('');
    try {
      const adapter = getAdapter(draft.protocol);
      const built = adapter.buildRequest(
        {
          model: draft.models[0] ?? 'test',
          messages: [{ role: 'user', content: 'Hi' }],
          maxTokens: 8,
        },
        draft,
      );
      const resp = await fetch(built.url, {
        method: built.method,
        headers: built.headers,
        body: built.body,
      });
      if (resp.ok) {
        setTesting('ok');
        setTestMsg('连接成功');
      } else {
        const text = await resp.text();
        const err = adapter.mapError(resp.status, text);
        setTesting('fail');
        setTestMsg(`${err.code}: ${err.message}`);
      }
    } catch (e) {
      setTesting('fail');
      setTestMsg((e as Error).message);
    }
  };

  return (
    <div className="ld-card p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 mr-4">
          <input
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            className="text-lg font-semibold bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-brand-400 w-full"
          />
          <p className="text-xs text-slate-500">协议：{draft.protocol}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="h-4 w-4 accent-brand-500"
          />
          <span className="text-sm">启用</span>
        </label>
      </div>

      <Field label="Base URL">
        <input
          value={draft.baseUrl}
          onChange={(e) => update({ baseUrl: e.target.value })}
          className="ld-input font-mono text-xs"
        />
      </Field>

      <Field label="API Key">
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={draft.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="ld-input font-mono text-xs pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showKey ? '隐藏' : '显示'}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>

      <Field label="已启用模型">
        <ModelsEditor
          models={draft.models}
          onChange={(models) => update({ models })}
        />
      </Field>

      <div className="flex items-center gap-2 pt-2 border-t border-black/[0.05]">
        <button onClick={testConnection} className="ld-btn-primary">
          {testing === 'running' ? '测试中...' : '🔌 测试连接'}
        </button>
        {testing === 'ok' && (
          <span className="text-sm text-emerald-600 flex items-center gap-1">
            <Check size={14} /> {testMsg}
          </span>
        )}
        {testing === 'fail' && (
          <span className="text-sm text-red-500">{testMsg}</span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => {
            if (confirm(`删除 "${draft.name}"？`)) onDelete();
          }}
          className="ld-btn-ghost text-red-500 hover:bg-red-50"
        >
          <Trash2 size={14} /> 删除
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-slate-600 mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function ModelsEditor({
  models,
  onChange,
}: {
  models: string[];
  onChange: (m: string[]) => void;
}) {
  const [input, setInput] = useState('');
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {models.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-1 text-xs font-mono"
          >
            {m}
            <button
              onClick={() => onChange(models.filter((x) => x !== m))}
              className="text-brand-700 hover:text-red-500"
              aria-label="移除"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              onChange([...models, input.trim()]);
              setInput('');
            }
          }}
          placeholder="输入模型名，回车添加"
          className="ld-input font-mono text-xs"
        />
      </div>
    </div>
  );
}

function AddProviderModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (preset: (typeof PROVIDER_PRESETS)[number]) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="ld-card max-w-2xl w-full max-h-[80vh] overflow-auto ld-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-black/[0.05] sticky top-0 bg-white">
          <h2 className="font-semibold">选择 AI Provider</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            从内置模板开始，添加后还能修改 URL / 模型
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4">
          {PROVIDER_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => onAdd(p)}
              className="text-left rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 p-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{p.name}</div>
                <span className="text-[10px] text-slate-400">{p.protocol}</span>
              </div>
              {p.freeTier && (
                <div className="text-[11px] text-emerald-600 mt-1">{p.freeTier}</div>
              )}
              {p.signupUrl && (
                <a
                  href={p.signupUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-brand-500 hover:underline mt-1 inline-flex items-center gap-0.5"
                >
                  申请 Key <ExternalLink size={9} />
                </a>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
