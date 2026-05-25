import { describe, it, expect } from 'vitest';
import { geminiAdapter } from '../adapters/gemini';
import { ErrorCode } from '../types';
import { streamFromString, collect } from './_helpers';

const cfg = {
  id: 'p',
  name: 'Gemini',
  protocol: 'gemini' as const,
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKey: 'AIza-test',
};

describe('geminiAdapter.buildRequest', () => {
  it('builds streamGenerateContent URL with alt=sse and key', () => {
    const req = geminiAdapter.buildRequest(
      {
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'hi' },
          { role: 'assistant', content: 'hello' },
          { role: 'user', content: 'again' },
        ],
        temperature: 0.5,
        maxTokens: 512,
      },
      cfg,
    );
    expect(req.url).toContain(
      '/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=AIza-test',
    );
    const body = JSON.parse(req.body);
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'sys' }] });
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: 'hi' }] },
      { role: 'model', parts: [{ text: 'hello' }] },
      { role: 'user', parts: [{ text: 'again' }] },
    ]);
    expect(body.generationConfig.temperature).toBe(0.5);
    expect(body.generationConfig.maxOutputTokens).toBe(512);
  });

  it('encodes model names containing slashes', () => {
    const req = geminiAdapter.buildRequest(
      { model: 'models/gemini-2.0/foo', messages: [{ role: 'user', content: 'q' }] },
      cfg,
    );
    expect(req.url).toContain(encodeURIComponent('models/gemini-2.0/foo'));
  });
});

describe('geminiAdapter.parseStream', () => {
  it('extracts text from candidates[0].content.parts[].text and final usage', async () => {
    const sse =
      'data: {"candidates":[{"content":{"parts":[{"text":"Hel"}]}}]}\n\n' +
      'data: {"candidates":[{"content":{"parts":[{"text":"lo"}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":5,"candidatesTokenCount":2}}\n\n';
    const chunks = await collect(geminiAdapter.parseStream(streamFromString(sse)));
    const texts = chunks.filter((c) => c.type === 'text').map((c: any) => c.delta);
    expect(texts).toEqual(['Hel', 'lo']);
    expect(chunks.find((c) => c.type === 'usage')).toEqual({
      type: 'usage',
      usage: { prompt: 5, completion: 2 },
    });
    expect(chunks.at(-1)).toMatchObject({ type: 'done', finishReason: 'STOP' });
  });
});

describe('geminiAdapter.mapError', () => {
  it('detects invalid key', () => {
    expect(geminiAdapter.mapError(400, 'API key not valid').code).toBe(
      ErrorCode.INVALID_API_KEY,
    );
  });
  it('detects 403 as key permission', () => {
    expect(geminiAdapter.mapError(403, 'permission').code).toBe(ErrorCode.INVALID_API_KEY);
  });
});
