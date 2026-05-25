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
 * OpenAI Chat Completions protocol.
 * Compatible with: OpenAI, DeepSeek, Moonshot, 智谱 GLM, Groq, SiliconFlow,
 * OpenRouter, Ollama (`/v1` mode), LM Studio, vLLM, Together, etc.
 */
export const openaiAdapter: ProviderAdapter = {
  id: 'openai',

  buildRequest(req: ChatRequest, cfg: ProviderConfig): BuiltRequest {
    const base = cfg.baseUrl.replace(/\/+$/, '');
    return {
      url: `${base}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
        ...(cfg.extraHeaders ?? {}),
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        stream: true,
        stream_options: { include_usage: true },
        ...(req.temperature !== undefined && { temperature: req.temperature }),
        ...(req.topP !== undefined && { top_p: req.topP }),
        ...(req.maxTokens !== undefined && { max_tokens: req.maxTokens }),
      }),
    };
  },

  async *parseStream(stream): AsyncIterable<StreamChunk> {
    for await (const payload of sseLines(stream)) {
      if (payload === '[DONE]') {
        yield { type: 'done' };
        return;
      }
      let json: any;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const choice = json.choices?.[0];
      const delta = choice?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        yield { type: 'text', delta };
      }
      if (json.usage) {
        yield {
          type: 'usage',
          usage: {
            prompt: json.usage.prompt_tokens ?? 0,
            completion: json.usage.completion_tokens ?? 0,
          },
        };
      }
      if (choice?.finish_reason) {
        yield { type: 'done', finishReason: choice.finish_reason };
        return;
      }
    }
  },

  mapError(status, body) {
    const lower = body.toLowerCase();
    if (status === 401 || /invalid.*api.*key|unauthorized/.test(lower)) {
      return { code: ErrorCode.INVALID_API_KEY, message: 'API Key 无效或已过期' };
    }
    if (status === 429) {
      return /quota|insufficient/.test(lower)
        ? { code: ErrorCode.QUOTA_EXCEEDED, message: '配额已用尽' }
        : { code: ErrorCode.RATE_LIMIT, message: '请求过于频繁，请稍后再试' };
    }
    if (status === 404 || /model.*not.*found|does not exist/.test(lower)) {
      return { code: ErrorCode.MODEL_NOT_FOUND, message: '模型不存在或无权访问' };
    }
    if (/context length|maximum context|too long/.test(lower)) {
      return { code: ErrorCode.CONTEXT_TOO_LONG, message: '上下文长度超出模型限制' };
    }
    return { code: ErrorCode.UNKNOWN, message: body.slice(0, 200) || `HTTP ${status}` };
  },

  async listModels(cfg) {
    const base = cfg.baseUrl.replace(/\/+$/, '');
    const resp = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    if (!resp.ok) return [];
    const json = await resp.json().catch(() => ({ data: [] }));
    return (json.data ?? []).map((m: { id: string }) => m.id);
  },
};
