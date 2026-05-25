import { getAdapter } from '@/shared/providers/adapters';
import type { ChatRequest, ProviderConfig, StreamChunk } from '@/shared/providers/types';
import { ErrorCode } from '@/shared/providers/types';
import { loadProviders } from '@/shared/store/providers';
import { buildPrompt, type TranslateTask } from '@/shared/prompts';

export const MSG = {
  PORT_CHAT: 'luduan/chat',
} as const;

export interface ChatPortRequest {
  type: 'translate';
  task: TranslateTask;
  /**
   * Optional explicit (provider, model) override. If omitted, the background
   * picks the first enabled provider's first model — the legacy "default"
   * behavior. Set both fields to honor the user's per-translation choice.
   */
  providerId?: string;
  modelName?: string;
}

export type ChatPortMessage =
  | { type: 'start'; providerName: string; modelName: string }
  | StreamChunk;

/**
 * Handles a `luduan/chat` port: receives one ChatPortRequest, runs the AI call,
 * and streams chunks back over the same port.
 */
export function handleChatPort(port: chrome.runtime.Port): void {
  const abort = new AbortController();

  port.onDisconnect.addListener(() => abort.abort());
  port.onMessage.addListener(async (raw: ChatPortRequest) => {
    if (raw?.type !== 'translate') return;
    try {
      await runChat(raw, port, abort.signal);
    } catch (err) {
      sendError(port, err);
    } finally {
      try {
        port.disconnect();
      } catch {
        /* already closed */
      }
    }
  });
}

async function runChat(
  req: ChatPortRequest,
  port: chrome.runtime.Port,
  signal: AbortSignal,
): Promise<void> {
  const providers = await loadProviders();

  // Resolution priority:
  //   1. Explicit providerId from the request (user picked from the card
  //      selector) — and we verify the model still belongs to it.
  //   2. First enabled provider's first model (legacy default).
  let provider = req.providerId
    ? providers.find((p) => p.id === req.providerId)
    : undefined;
  provider ??= providers.find((p) => p.enabled) ?? providers[0];

  if (!provider) {
    sendError(port, {
      code: ErrorCode.UNKNOWN,
      message: '尚未配置任何 AI 模型，请先到设置页添加。',
    });
    return;
  }

  const modelName =
    (req.modelName && provider.models.includes(req.modelName)
      ? req.modelName
      : provider.models[0]);
  if (!modelName) {
    sendError(port, {
      code: ErrorCode.MODEL_NOT_FOUND,
      message: `Provider "${provider.name}" 没有启用任何模型`,
    });
    return;
  }

  const cfg: ProviderConfig = {
    id: provider.id,
    name: provider.name,
    protocol: provider.protocol,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    authStyle: provider.authStyle,
    extraHeaders: provider.extraHeaders,
  };
  const adapter = getAdapter(provider.protocol);
  const messages = buildPrompt(req.task);
  // We intentionally don't default any sampling parameter. Some gateway
  // -fronted models (e.g. Claude Opus 4.7 via internal proxies) reject
  // specific parameters outright. Users can fill them in per-provider via
  // the options page; leaving a field empty omits it from the request body.
  // Anthropic protocol requires max_tokens — the adapter falls back to 4096
  // when undefined, so requests still succeed.
  const chat: ChatRequest = {
    model: modelName,
    messages,
    ...(provider.params?.maxTokens !== undefined && {
      maxTokens: provider.params.maxTokens,
    }),
    ...(provider.params?.temperature !== undefined && {
      temperature: provider.params.temperature,
    }),
    ...(provider.params?.topP !== undefined && { topP: provider.params.topP }),
    signal,
  };

  port.postMessage({ type: 'start', providerName: provider.name, modelName });

  const built = adapter.buildRequest(chat, cfg);
  let resp: Response;
  try {
    resp = await fetch(built.url, {
      method: built.method,
      headers: built.headers,
      body: built.body,
      signal,
    });
  } catch (e) {
    const aborted = (e as Error).name === 'AbortError';
    sendError(port, {
      code: aborted ? ErrorCode.ABORTED : ErrorCode.NETWORK,
      message: aborted ? '已取消' : `网络错误: ${(e as Error).message}`,
    });
    return;
  }

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => '');
    const mapped = adapter.mapError(resp.status, text);
    sendError(port, mapped);
    return;
  }

  for await (const chunk of adapter.parseStream(resp.body)) {
    port.postMessage(chunk);
    if (chunk.type === 'done' || chunk.type === 'error') return;
  }
  port.postMessage({ type: 'done' });
}

function sendError(
  port: chrome.runtime.Port,
  err: { code: ErrorCode; message: string } | unknown,
): void {
  const payload =
    err && typeof err === 'object' && 'code' in (err as object)
      ? (err as { code: ErrorCode; message: string })
      : { code: ErrorCode.UNKNOWN, message: String(err) };
  try {
    port.postMessage({ type: 'error', code: payload.code, message: payload.message });
  } catch {
    /* port closed */
  }
}
