import { describe, it, expect } from 'vitest';
import { openaiAdapter } from '../adapters/openai';
import { ErrorCode } from '../types';
import { streamFromString, collect } from './_helpers';

const cfg = {
  id: 'p',
  name: 'OpenAI',
  protocol: 'openai' as const,
  baseUrl: 'https://api.openai.com/v1/',
  apiKey: 'sk-test',
};

describe('openaiAdapter.buildRequest', () => {
  it('builds chat completions URL and bearer auth', () => {
    const req = openaiAdapter.buildRequest(
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'hi' },
        ],
        temperature: 0.7,
        maxTokens: 256,
      },
      cfg,
    );
    expect(req.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(req.headers.Authorization).toBe('Bearer sk-test');
    const body = JSON.parse(req.body);
    expect(body.model).toBe('gpt-4o');
    expect(body.stream).toBe(true);
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(256);
    expect(body.messages).toHaveLength(2);
  });

  it('omits unset params', () => {
    const req = openaiAdapter.buildRequest(
      { model: 'x', messages: [{ role: 'user', content: 'q' }] },
      cfg,
    );
    const body = JSON.parse(req.body);
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('max_tokens');
  });

  it('merges extraHeaders', () => {
    const req = openaiAdapter.buildRequest(
      { model: 'x', messages: [{ role: 'user', content: 'q' }] },
      { ...cfg, extraHeaders: { 'X-Foo': 'bar' } },
    );
    expect(req.headers['X-Foo']).toBe('bar');
  });
});

describe('openaiAdapter.parseStream', () => {
  it('yields text deltas, usage, and done', async () => {
    const sse =
      'data: {"choices":[{"delta":{"content":"He"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"llo"}}]}\n\n' +
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":3,"completion_tokens":2}}\n\n' +
      'data: [DONE]\n\n';
    const chunks = await collect(openaiAdapter.parseStream(streamFromString(sse)));
    const texts = chunks.filter((c) => c.type === 'text').map((c: any) => c.delta);
    expect(texts).toEqual(['He', 'llo']);
    expect(chunks.find((c) => c.type === 'usage')).toEqual({
      type: 'usage',
      usage: { prompt: 3, completion: 2 },
    });
    expect(chunks.at(-1)).toMatchObject({ type: 'done', finishReason: 'stop' });
  });

  it('ignores malformed JSON lines', async () => {
    const sse =
      'data: {bad json\n\n' +
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n' +
      'data: [DONE]\n\n';
    const chunks = await collect(openaiAdapter.parseStream(streamFromString(sse)));
    expect(chunks.filter((c) => c.type === 'text')).toHaveLength(1);
  });
});

describe('openaiAdapter.mapError', () => {
  it('detects auth errors', () => {
    expect(openaiAdapter.mapError(401, 'Invalid API key').code).toBe(
      ErrorCode.INVALID_API_KEY,
    );
  });
  it('detects rate limits and quota', () => {
    expect(openaiAdapter.mapError(429, 'Rate limit').code).toBe(ErrorCode.RATE_LIMIT);
    expect(openaiAdapter.mapError(429, 'insufficient_quota').code).toBe(
      ErrorCode.QUOTA_EXCEEDED,
    );
  });
  it('detects context length errors', () => {
    expect(
      openaiAdapter.mapError(400, "This model's maximum context length is 8192").code,
    ).toBe(ErrorCode.CONTEXT_TOO_LONG);
  });
  it('treats real model_not_found as MODEL_NOT_FOUND', () => {
    expect(openaiAdapter.mapError(404, 'model does not exist').code).toBe(
      ErrorCode.MODEL_NOT_FOUND,
    );
  });
  it('on bare 404, surfaces "接口路径不存在" hint instead of misleading model error', () => {
    const err = openaiAdapter.mapError(404, '<html>404 Not Found</html>');
    expect(err.code).toBe(ErrorCode.MODEL_NOT_FOUND);
    expect(err.message).toContain('接口路径不存在');
    expect(err.message).toContain('Base URL');
  });
});
