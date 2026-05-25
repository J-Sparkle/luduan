import { describe, it, expect } from 'vitest';
import { anthropicAdapter } from '../adapters/anthropic';
import { ErrorCode } from '../types';
import { streamFromString, collect } from './_helpers';

const cfg = {
  id: 'p',
  name: 'Anthropic',
  protocol: 'anthropic' as const,
  baseUrl: 'https://api.anthropic.com/v1',
  apiKey: 'sk-ant-test',
};

describe('anthropicAdapter.buildRequest auth styles', () => {
  it('defaults to x-api-key header (native)', () => {
    const req = anthropicAdapter.buildRequest(
      { model: 'm', messages: [{ role: 'user', content: 'q' }] },
      cfg,
    );
    expect(req.headers['x-api-key']).toBe('sk-ant-test');
    expect(req.headers.Authorization).toBeUndefined();
  });

  it('uses Authorization: Bearer when authStyle=bearer (gateway mode)', () => {
    const req = anthropicAdapter.buildRequest(
      { model: 'm', messages: [{ role: 'user', content: 'q' }] },
      { ...cfg, authStyle: 'bearer' },
    );
    expect(req.headers.Authorization).toBe('Bearer sk-ant-test');
    expect(req.headers['x-api-key']).toBeUndefined();
    // Other Anthropic headers still present
    expect(req.headers['anthropic-version']).toBe('2023-06-01');
  });
});

describe('anthropicAdapter.buildRequest', () => {
  it('separates system from messages, uses x-api-key header', () => {
    const req = anthropicAdapter.buildRequest(
      {
        model: 'claude-sonnet-4-6',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hi' },
        ],
        maxTokens: 1024,
      },
      cfg,
    );
    expect(req.url).toBe('https://api.anthropic.com/v1/messages');
    expect(req.headers['x-api-key']).toBe('sk-ant-test');
    expect(req.headers['anthropic-version']).toBe('2023-06-01');
    expect(req.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    const body = JSON.parse(req.body);
    expect(body.system).toBe('You are helpful');
    expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
    expect(body.max_tokens).toBe(1024);
    expect(body.stream).toBe(true);
  });

  it('concatenates multiple system messages with blank line', () => {
    const req = anthropicAdapter.buildRequest(
      {
        model: 'x',
        messages: [
          { role: 'system', content: 'A' },
          { role: 'system', content: 'B' },
          { role: 'user', content: 'q' },
        ],
      },
      cfg,
    );
    const body = JSON.parse(req.body);
    expect(body.system).toBe('A\n\nB');
  });

  it('defaults max_tokens to 4096 when unset', () => {
    const req = anthropicAdapter.buildRequest(
      { model: 'x', messages: [{ role: 'user', content: 'q' }] },
      cfg,
    );
    expect(JSON.parse(req.body).max_tokens).toBe(4096);
  });
});

describe('anthropicAdapter.parseStream', () => {
  it('parses message_start → content_block_delta → message_delta → message_stop', async () => {
    const sse =
      'event: message_start\ndata: {"message":{"usage":{"input_tokens":7}}}\n\n' +
      'event: content_block_delta\ndata: {"delta":{"type":"text_delta","text":"Hel"}}\n\n' +
      'event: content_block_delta\ndata: {"delta":{"type":"text_delta","text":"lo"}}\n\n' +
      'event: message_delta\ndata: {"usage":{"output_tokens":2}}\n\n' +
      'event: message_stop\ndata: {}\n\n';
    const chunks = await collect(anthropicAdapter.parseStream(streamFromString(sse)));
    const texts = chunks.filter((c) => c.type === 'text').map((c: any) => c.delta);
    expect(texts).toEqual(['Hel', 'lo']);
    expect(chunks.find((c) => c.type === 'usage')).toEqual({
      type: 'usage',
      usage: { prompt: 7, completion: 2 },
    });
    expect(chunks.at(-1)).toEqual({ type: 'done' });
  });

  it('surfaces error events', async () => {
    const sse =
      'event: error\ndata: {"error":{"message":"overloaded"}}\n\n';
    const chunks = await collect(anthropicAdapter.parseStream(streamFromString(sse)));
    expect(chunks[0]).toMatchObject({ type: 'error', message: 'overloaded' });
  });
});

describe('anthropicAdapter.mapError', () => {
  it('detects invalid key on 401', () => {
    expect(anthropicAdapter.mapError(401, 'authentication_error').code).toBe(
      ErrorCode.INVALID_API_KEY,
    );
  });
  it('detects rate limit on 429', () => {
    expect(anthropicAdapter.mapError(429, 'rate_limit_error').code).toBe(
      ErrorCode.RATE_LIMIT,
    );
  });
});
