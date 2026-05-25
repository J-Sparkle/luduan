import type {
  ProviderAdapter,
  ProviderConfig,
  ChatRequest,
  BuiltRequest,
  StreamChunk,
} from '../types';
import { ErrorCode } from '../types';
import { sseEvents } from '../sse';

/**
 * Anthropic Messages API.
 * System prompt is a separate top-level field, not a message.
 * Browser direct calls require `anthropic-dangerous-direct-browser-access: true`.
 */
export const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',

  buildRequest(req: ChatRequest, cfg: ProviderConfig): BuiltRequest {
    const base = cfg.baseUrl.replace(/\/+$/, '');
    const systems = req.messages.filter((m) => m.role === 'system').map((m) => m.content);
    const messages = req.messages.filter((m) => m.role !== 'system');
    return {
      url: `${base}/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        ...(cfg.extraHeaders ?? {}),
      },
      body: JSON.stringify({
        model: req.model,
        ...(systems.length > 0 && { system: systems.join('\n\n') }),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: req.maxTokens ?? 4096,
        stream: true,
        ...(req.temperature !== undefined && { temperature: req.temperature }),
        ...(req.topP !== undefined && { top_p: req.topP }),
      }),
    };
  },

  async *parseStream(stream): AsyncIterable<StreamChunk> {
    let promptTokens = 0;
    for await (const evt of sseEvents(stream)) {
      const data = evt.data as any;
      switch (evt.event) {
        case 'message_start':
          promptTokens = data?.message?.usage?.input_tokens ?? 0;
          break;
        case 'content_block_delta': {
          const text = data?.delta?.text;
          if (typeof text === 'string' && text.length > 0) {
            yield { type: 'text', delta: text };
          }
          break;
        }
        case 'message_delta': {
          const completion = data?.usage?.output_tokens;
          if (typeof completion === 'number') {
            yield {
              type: 'usage',
              usage: { prompt: promptTokens, completion },
            };
          }
          break;
        }
        case 'message_stop':
          yield { type: 'done' };
          return;
        case 'error': {
          const msg = data?.error?.message ?? 'Anthropic stream error';
          yield { type: 'error', code: ErrorCode.UNKNOWN, message: msg };
          return;
        }
      }
    }
  },

  mapError(status, body) {
    const lower = body.toLowerCase();
    if (status === 401 || /authentication|invalid.*api.*key/.test(lower)) {
      return { code: ErrorCode.INVALID_API_KEY, message: 'API Key 无效' };
    }
    if (status === 429) {
      return { code: ErrorCode.RATE_LIMIT, message: '请求过于频繁' };
    }
    if (status === 404 || /not_found|model/.test(lower) && status === 400) {
      return { code: ErrorCode.MODEL_NOT_FOUND, message: '模型不存在' };
    }
    if (/context|too long|maximum/.test(lower)) {
      return { code: ErrorCode.CONTEXT_TOO_LONG, message: '上下文超长' };
    }
    return { code: ErrorCode.UNKNOWN, message: body.slice(0, 200) || `HTTP ${status}` };
  },
};
