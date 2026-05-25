import type {
  ProviderAdapter,
  ProviderConfig,
  ChatRequest,
  BuiltRequest,
  StreamChunk,
} from '../types';
import { ErrorCode } from '../types';
import { sseLines } from '../sse';

/**
 * Google Gemini Generative Language API.
 * Uses `streamGenerateContent?alt=sse` to get standard SSE framing.
 * Roles are remapped: assistant → 'model'; system prompt goes into `systemInstruction`.
 */
export const geminiAdapter: ProviderAdapter = {
  id: 'gemini',

  buildRequest(req: ChatRequest, cfg: ProviderConfig): BuiltRequest {
    const base = cfg.baseUrl.replace(/\/+$/, '');
    const systems = req.messages.filter((m) => m.role === 'system').map((m) => m.content);
    const contents = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const url = `${base}/models/${encodeURIComponent(req.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(cfg.apiKey)}`;
    return {
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.extraHeaders ?? {}),
      },
      body: JSON.stringify({
        contents,
        ...(systems.length > 0 && {
          systemInstruction: { parts: [{ text: systems.join('\n\n') }] },
        }),
        generationConfig: {
          ...(req.temperature !== undefined && { temperature: req.temperature }),
          ...(req.topP !== undefined && { topP: req.topP }),
          ...(req.maxTokens !== undefined && { maxOutputTokens: req.maxTokens }),
        },
      }),
    };
  },

  async *parseStream(stream): AsyncIterable<StreamChunk> {
    let finishReason: string | undefined;
    let usagePrompt = 0;
    let usageCompletion = 0;
    for await (const payload of sseLines(stream)) {
      let json: any;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const candidate = json.candidates?.[0];
      const parts: Array<{ text?: string }> = candidate?.content?.parts ?? [];
      for (const p of parts) {
        if (typeof p.text === 'string' && p.text.length > 0) {
          yield { type: 'text', delta: p.text };
        }
      }
      if (candidate?.finishReason) finishReason = candidate.finishReason;
      if (json.usageMetadata) {
        usagePrompt = json.usageMetadata.promptTokenCount ?? usagePrompt;
        usageCompletion = json.usageMetadata.candidatesTokenCount ?? usageCompletion;
      }
    }
    if (usagePrompt > 0 || usageCompletion > 0) {
      yield { type: 'usage', usage: { prompt: usagePrompt, completion: usageCompletion } };
    }
    yield { type: 'done', finishReason };
  },

  mapError(status, body) {
    const lower = body.toLowerCase();
    if (status === 400 && /api key not valid/.test(lower)) {
      return { code: ErrorCode.INVALID_API_KEY, message: 'API Key 无效' };
    }
    if (status === 403) {
      return { code: ErrorCode.INVALID_API_KEY, message: 'API Key 无权访问该模型' };
    }
    if (status === 429) {
      return { code: ErrorCode.RATE_LIMIT, message: '请求过于频繁或超出配额' };
    }
    if (status === 404) {
      return { code: ErrorCode.MODEL_NOT_FOUND, message: '模型不存在' };
    }
    if (/exceeds the maximum|context|too long/.test(lower)) {
      return { code: ErrorCode.CONTEXT_TOO_LONG, message: '上下文超长' };
    }
    return { code: ErrorCode.UNKNOWN, message: body.slice(0, 200) || `HTTP ${status}` };
  },

  async listModels(cfg) {
    const base = cfg.baseUrl.replace(/\/+$/, '');
    const resp = await fetch(`${base}/models?key=${encodeURIComponent(cfg.apiKey)}`);
    if (!resp.ok) return [];
    const json = await resp.json().catch(() => ({ models: [] }));
    return (json.models ?? [])
      .map((m: { name: string }) => m.name?.replace(/^models\//, ''))
      .filter(Boolean);
  },
};
