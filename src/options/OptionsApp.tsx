import { useEffect, useState } from 'react';
import {
  Button,
  Field,
  Hair,
  IconBtn,
  Input,
  Pill,
  Switch,
  Wordmark,
  cn,
} from '@/shared/ui';
import {
  deleteProvider,
  loadProviders,
  newProviderId,
  upsertProvider,
  type ProviderParams,
  type StoredProvider,
} from '@/shared/store/providers';
import { PROVIDER_PRESETS } from '@/shared/providers/presets';
import { getAdapter } from '@/shared/providers/adapters';

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
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink-hair">
        <div className="mx-auto max-w-[1024px] flex items-center justify-between px-8 py-5">
          <Wordmark size={14} />
          <div className="latin italic text-[12px] text-ink-mute">
            设 置 · AI 模型
          </div>
        </div>
      </header>

      <ReadyBanner providers={providers} />

      <main className="mx-auto max-w-[1024px] grid grid-cols-[260px_1fr] gap-6 px-8 py-5">
        <Sidebar
          providers={providers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => setShowAdd(true)}
        />
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

// ─────────────────────────────────────────────────────────────────────────────
// Banner — shown only when at least one provider is fully usable.

function ReadyBanner({ providers }: { providers: StoredProvider[] }) {
  const [dismissed, setDismissed] = useState(false);
  const ready = providers.filter(
    (p) => p.enabled && p.apiKey && p.models.length > 0,
  );
  if (ready.length === 0 || dismissed) return null;
  const canClose = typeof window !== 'undefined' && !!window.close;

  return (
    <div className="border-b border-accent-rule bg-accent-soft">
      <div className="mx-auto max-w-[1024px] flex items-center gap-3 px-8 py-3">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: 'oklch(0.52 0.10 155)' }}
        />
        <div className="flex-1 text-[13px]">
          <span className="font-medium">已就绪</span>
          <span className="text-ink-mute ml-2 latin italic">
            ·{' '}
            {ready.map((p) => `${p.name} · ${p.models[0]}`).join('， ')} ·
            select any text on any page to translate
          </span>
        </div>
        {canClose && (
          <Button variant="ghost" size="sm" onClick={() => window.close()}>
            关闭设置页
          </Button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="收起"
          className="h-6 w-6 inline-flex items-center justify-center text-ink-mute hover:text-ink"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar

function Sidebar({
  providers,
  selectedId,
  onSelect,
  onAdd,
}: {
  providers: StoredProvider[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <aside>
      <div className="flex items-center justify-between mb-3">
        <div className="ld-cap">A I 模 型</div>
        <button
          type="button"
          onClick={onAdd}
          aria-label="添加 Provider"
          className="h-[22px] w-[22px] inline-flex items-center justify-center rounded-xs border border-ink-rule text-ink hover:bg-surface-alt"
        >
          +
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="ld-card p-4 text-[12px] text-ink-mute leading-[1.6]">
          还没有任何 Provider。
          <button
            type="button"
            onClick={onAdd}
            className="block mt-2 text-accent hover:opacity-80"
          >
            + 添加第一个
          </button>
        </div>
      ) : (
        <ul className="ld-card overflow-hidden">
          {providers.map((p, i) => {
            const usable = p.enabled && p.apiKey && p.models.length > 0;
            const isSelected = p.id === selectedId;
            return (
              <li
                key={p.id}
                className={cn(
                  i > 0 && 'border-t border-ink-hair',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={cn(
                    'w-full text-left px-3.5 py-3 flex items-center gap-2.5 relative',
                    isSelected ? 'bg-surface-alt' : 'hover:bg-surface-alt/60',
                  )}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-ink" />
                  )}
                  <span
                    className="inline-block h-[7px] w-[7px] rounded-full shrink-0"
                    style={{
                      background: usable
                        ? 'oklch(0.52 0.10 155)'
                        : 'rgb(22 22 22 / 0.32)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-[13px] truncate',
                        isSelected ? 'font-medium' : '',
                      )}
                    >
                      {p.name}
                    </div>
                    {p.models[0] && (
                      <div className="latin italic text-[10.5px] text-ink-mute truncate">
                        {p.protocol} · {p.models[0]}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] tracking-cap-tight text-ink-mute shrink-0">
                      默 认
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="ld-card p-16 text-center">
      <div className="ld-cap mb-4">尚 未 配 置</div>
      <div className="text-[18px] font-medium mb-2">添加一个 AI Provider 开始</div>
      <p className="latin italic text-[12px] text-ink-mute mb-5">
        Bring your own key — direct browser-to-provider, no relay.
      </p>
      <Button variant="primary" size="md" onClick={onAdd}>
        + 添加 Provider
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider form

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

  const usable = draft.enabled && draft.apiKey && draft.models.length > 0;

  const testConnection = async () => {
    if (!draft.apiKey.trim()) {
      setTesting('fail');
      setTestMsg('请先填 API Key');
      return;
    }
    if (!draft.baseUrl.trim()) {
      setTesting('fail');
      setTestMsg('请先填 Base URL');
      return;
    }
    if (!draft.models[0]) {
      setTesting('fail');
      setTestMsg('请先添加至少一个模型名');
      return;
    }
    setTesting('running');
    setTestMsg('');
    try {
      const adapter = getAdapter(draft.protocol);
      const built = adapter.buildRequest(
        {
          model: draft.models[0],
          messages: [
            { role: 'user', content: 'Reply with the single word: ok' },
          ],
          maxTokens: 16,
        },
        draft,
      );
      const resp = await fetch(built.url, {
        method: built.method,
        headers: built.headers,
        body: built.body,
      });
      if (resp.ok && resp.body) {
        let sample = '';
        for await (const chunk of adapter.parseStream(resp.body)) {
          if (chunk.type === 'text') sample += chunk.delta;
          if (chunk.type === 'error') throw new Error(chunk.message);
          if (chunk.type === 'done' || sample.length > 80) break;
        }
        setTesting('ok');
        setTestMsg(sample.trim() ? `模型回复："${sample.trim()}"` : '连接成功');
        if (!draft.enabled) update({ enabled: true });
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
    <div className="ld-card p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-1.5">
        <input
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          className="text-[22px] font-medium bg-transparent outline-none border-b border-transparent focus:border-accent flex-1 min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          {usable && (
            <Pill tone="ok" size={10.5}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: 'oklch(0.52 0.10 155)' }}
              />
              已 连 接
            </Pill>
          )}
          <label className="flex items-center gap-2 text-[12px] text-ink-soft">
            <span>启 用</span>
            <Switch
              checked={draft.enabled}
              onChange={(v) => update({ enabled: v })}
            />
          </label>
        </div>
      </div>
      <div className="latin italic text-[12px] text-ink-mute mb-8">
        {protocolLabel(draft.protocol)} protocol
      </div>

      {/* 连 接 */}
      <SectionHeader caption="连 接" />
      <div className="grid grid-cols-[180px_1fr] gap-4 mb-4">
        <Field label="协议">
          <select
            value={draft.protocol}
            onChange={(e) =>
              update({ protocol: e.target.value as StoredProvider['protocol'] })
            }
            className="h-[36px] w-full px-3 rounded-sm border border-ink-rule bg-surface text-[13px] text-ink outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15"
          >
            <option value="openai">OpenAI 兼容</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
          </select>
        </Field>
        <Field label="Base URL">
          <Input
            mono
            value={draft.baseUrl}
            onChange={(e) => update({ baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
          />
        </Field>
      </div>

      {draft.protocol === 'anthropic' && (
        <Field
          label="鉴权方式"
          hint="走公司内网网关时通常选 Bearer；直连 api.anthropic.com 选 x-api-key。"
          className="mb-4"
        >
          <select
            value={draft.authStyle ?? 'native'}
            onChange={(e) =>
              update({ authStyle: e.target.value as StoredProvider['authStyle'] })
            }
            className="h-[36px] w-full px-3 rounded-sm border border-ink-rule bg-surface text-[13px] text-ink outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15"
          >
            <option value="native">x-api-key（Anthropic 官方）</option>
            <option value="bearer">Authorization: Bearer（网关 / 代理）</option>
          </select>
        </Field>
      )}

      <Field
        label="API Key"
        hint="本地存储于浏览器，永不上传。"
        className="mb-8"
      >
        <div className="relative">
          <Input
            mono
            type={showKey ? 'text' : 'password'}
            value={draft.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="pr-20"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-mute hover:text-ink"
          >
            {showKey ? '隐藏' : '显示'}
          </button>
        </div>
      </Field>

      {/* 模 型 */}
      <SectionHeader caption="模 型" />
      <ModelsEditor
        models={draft.models}
        onChange={(models) => update({ models })}
      />

      <div className="h-8" />

      {/* 采 样 参 数 */}
      <SectionHeader caption="采 样 参 数" />
      <AdvancedParams
        params={draft.params}
        onChange={(params) => update({ params })}
      />

      {/* Footer */}
      <div className="mt-8 pt-5 border-t border-ink-hair flex items-center gap-3">
        <Button
          variant="primary"
          loading={testing === 'running'}
          onClick={testConnection}
        >
          🔌 测试连接
        </Button>
        {testing === 'ok' && (
          <span className="text-[12px] text-ok flex items-center gap-1.5">
            ✓ {testMsg}
          </span>
        )}
        {testing === 'fail' && (
          <span className="text-[12px] text-err">{testMsg}</span>
        )}
        <div className="flex-1" />
        <Button
          variant="danger"
          size="md"
          onClick={() => {
            if (confirm(`删除 "${draft.name}"？`)) onDelete();
          }}
        >
          删除此 Provider
        </Button>
      </div>
    </div>
  );
}

function protocolLabel(p: StoredProvider['protocol']): string {
  return p === 'openai'
    ? 'OpenAI-compatible'
    : p === 'anthropic'
    ? 'Anthropic'
    : p === 'gemini'
    ? 'Google Gemini'
    : p;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header — letter-spaced caption with a hair-rule beneath.

function SectionHeader({ caption }: { caption: string }) {
  return (
    <div className="mb-3">
      <div className="ld-cap mb-2">{caption}</div>
      <Hair />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Models editor

function ModelsEditor({
  models,
  onChange,
}: {
  models: string[];
  onChange: (m: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const commit = () => {
    const v = input.trim();
    if (!v) return;
    if (models.includes(v)) {
      setInput('');
      return;
    }
    onChange([...models, v]);
    setInput('');
  };
  return (
    <Field label="已启用模型" addon={`${models.length} 个`}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 min-h-[28px]">
          {models.map((m, i) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 rounded-xs bg-surface-alt border border-ink-hair px-2.5 py-1 latin italic text-[12px]"
            >
              {i === 0 && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
                  title="默认模型"
                />
              )}
              {m}
              <button
                type="button"
                onClick={() => onChange(models.filter((x) => x !== m))}
                className="text-ink-mute hover:text-err"
                aria-label="移除"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            mono
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            onBlur={commit}
            placeholder="输入模型名，回车或失焦添加"
          />
          <Button
            variant="secondary"
            size="md"
            onClick={commit}
            disabled={!input.trim()}
          >
            + 添加
          </Button>
        </div>
        {models.length === 0 && (
          <p className="text-[11px] text-warn">
            ⚠ 至少需要添加 1 个模型名才能测试连接并使用
          </p>
        )}
      </div>
    </Field>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced sampling params

function AdvancedParams({
  params,
  onChange,
}: {
  params: ProviderParams | undefined;
  onChange: (p: ProviderParams | undefined) => void;
}) {
  const current = params ?? {};
  const setNumber = (key: keyof ProviderParams, raw: string) => {
    const next: ProviderParams = { ...current };
    if (raw === '') {
      delete next[key];
    } else {
      const n = Number(raw);
      if (Number.isFinite(n)) next[key] = n;
    }
    onChange(Object.keys(next).length > 0 ? next : undefined);
  };

  return (
    <div className="space-y-3">
      <p className="latin italic text-[11px] text-ink-mute leading-[1.6]">
        Leave any field blank to omit it from requests — useful for models that
        reject specific parameters (e.g. Claude Opus 4.7 via internal gateways
        does not accept <span className="mono">temperature</span>).
      </p>
      <div className="grid grid-cols-3 gap-4">
        <Field label="温度" hint="0–2，留空 = 模型默认">
          <Input
            mono
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={current.temperature ?? ''}
            onChange={(e) => setNumber('temperature', e.target.value)}
            placeholder="—"
          />
        </Field>
        <Field label="Top P" hint="0–1，留空 = 模型默认">
          <Input
            mono
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={current.topP ?? ''}
            onChange={(e) => setNumber('topP', e.target.value)}
            placeholder="—"
          />
        </Field>
        <Field label="最大 tokens" hint="留空 = 模型默认">
          <Input
            mono
            type="number"
            step="64"
            min="1"
            value={current.maxTokens ?? ''}
            onChange={(e) => setNumber('maxTokens', e.target.value)}
            placeholder="—"
          />
        </Field>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Provider modal

function AddProviderModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (preset: (typeof PROVIDER_PRESETS)[number]) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = PROVIDER_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: 'rgba(22,22,22,0.32)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] max-h-[80vh] flex flex-col bg-paper border border-ink-rule rounded-lg shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-ink-hair flex items-start justify-between">
          <div>
            <div className="text-[16px] font-medium">添加 AI Provider</div>
            <div className="latin italic text-[12px] text-ink-mute mt-1">
              Start from a template, or configure manually.
            </div>
          </div>
          <IconBtn aria-label="关闭" onClick={onClose}>
            ×
          </IconBtn>
        </div>
        <div className="px-6 py-3 border-b border-ink-hair">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索 Provider"
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-4 overflow-auto ld-scrollbar">
          {filtered.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onAdd(p)}
              className="text-left rounded-sm border border-ink-hair bg-surface p-3.5 hover:border-accent hover:bg-accent-soft transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-surface-alt text-[14px] font-medium">
                  {p.name.slice(0, 1)}
                </span>
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium">{p.name}</div>
                  <div className="latin italic text-[11px] text-ink-mute">
                    {p.protocol}
                  </div>
                </div>
                {p.freeTier && (
                  <Pill tone="ok" size={9.5}>
                    免费
                  </Pill>
                )}
              </div>
              {p.signupUrl && (
                <div className="text-[10.5px] text-ink-mute mt-1.5 flex items-center justify-between">
                  <a
                    href={p.signupUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-ink"
                  >
                    申请 Key ↗
                  </a>
                  <span className="text-accent">选择 →</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
