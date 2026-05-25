import { describe, it, expect } from 'vitest';
import { sseLines, sseEvents, readLines } from '../sse';
import { streamFromString, streamFromChunks, collect } from './_helpers';

describe('readLines', () => {
  it('splits on newlines and survives chunked input', async () => {
    const stream = streamFromChunks(['hel', 'lo\nwor', 'ld\n', 'end']);
    expect(await collect(readLines(stream))).toEqual(['hello', 'world', 'end']);
  });

  it('strips trailing CR', async () => {
    const stream = streamFromString('a\r\nb\r\n');
    expect(await collect(readLines(stream))).toEqual(['a', 'b']);
  });
});

describe('sseLines', () => {
  it('extracts data payloads and skips comments/keepalives', async () => {
    const sse =
      ': keepalive\n' +
      'data: hello\n' +
      '\n' +
      'data: {"x":1}\n' +
      '\n' +
      'data: [DONE]\n' +
      '\n';
    expect(await collect(sseLines(streamFromString(sse)))).toEqual([
      'hello',
      '{"x":1}',
      '[DONE]',
    ]);
  });

  it('concatenates multi-line data with newlines', async () => {
    const sse = 'data: line1\ndata: line2\n\n';
    expect(await collect(sseLines(streamFromString(sse)))).toEqual(['line1\nline2']);
  });

  it('survives chunk boundaries inside a payload', async () => {
    const stream = streamFromChunks(['data: he', 'llo\n', '\n', 'data: world\n\n']);
    expect(await collect(sseLines(stream))).toEqual(['hello', 'world']);
  });
});

describe('sseEvents', () => {
  it('parses event + data fields and json payloads', async () => {
    const sse =
      'event: greet\ndata: {"msg":"hi"}\n\n' +
      'event: bye\ndata: {"msg":"cya"}\n\n';
    const events = await collect(sseEvents(streamFromString(sse)));
    expect(events).toEqual([
      { event: 'greet', id: undefined, data: { msg: 'hi' } },
      { event: 'bye', id: undefined, data: { msg: 'cya' } },
    ]);
  });

  it('falls back to string if data is not JSON', async () => {
    const sse = 'event: raw\ndata: plain text\n\n';
    const events = await collect(sseEvents(streamFromString(sse)));
    expect(events[0]).toEqual({ event: 'raw', id: undefined, data: 'plain text' });
  });
});
