/**
 * Server-Sent Events parsing utilities.
 *
 * Supports two styles:
 * - `sseLines(stream)`         → strips `data: ` prefix, yields raw payload strings
 *                                (skips comments, empty keep-alives, and the `[DONE]` sentinel
 *                                is yielded as-is so callers can detect it).
 * - `sseEvents(stream)`        → yields { event, data } objects; data is JSON-parsed.
 * - `jsonArrayStream(stream)`  → for Gemini's `?alt=sse` and raw JSON-array streaming.
 */

export async function* readLines(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        if (buffer.length > 0) yield buffer;
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      let nlIdx: number;
      while ((nlIdx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nlIdx).replace(/\r$/, '');
        buffer = buffer.slice(nlIdx + 1);
        yield line;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Yields the raw payload of each SSE `data:` line.
 * Multi-line `data:` blocks are concatenated by newline per the SSE spec, and
 * blank lines are treated as event boundaries (so the accumulated data is
 * flushed). Comments (lines starting with `:`) and non-data fields are ignored.
 */
export async function* sseLines(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, void> {
  let dataBuf: string[] = [];
  for await (const line of readLines(stream)) {
    if (line === '') {
      if (dataBuf.length > 0) {
        yield dataBuf.join('\n');
        dataBuf = [];
      }
      continue;
    }
    if (line.startsWith(':')) continue;
    if (line.startsWith('data:')) {
      dataBuf.push(line.slice(5).replace(/^ /, ''));
    }
    // We intentionally ignore non-data fields here; use sseEvents for those.
  }
  if (dataBuf.length > 0) yield dataBuf.join('\n');
}

export interface SSEEvent {
  event: string;
  data: unknown;
  id?: string;
}

/**
 * Yields full SSE events with their `event:` name and JSON-parsed `data:`.
 * Used by Anthropic which sends typed events like `content_block_delta`.
 */
export async function* sseEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent, void, void> {
  let eventName = 'message';
  let id: string | undefined;
  let dataBuf: string[] = [];

  const flush = (): SSEEvent | null => {
    if (dataBuf.length === 0) return null;
    const raw = dataBuf.join('\n');
    dataBuf = [];
    const evt = { event: eventName, id, data: tryJson(raw) } as SSEEvent;
    eventName = 'message';
    id = undefined;
    return evt;
  };

  for await (const line of readLines(stream)) {
    if (line === '') {
      const evt = flush();
      if (evt) yield evt;
      continue;
    }
    if (line.startsWith(':')) continue;
    const colonIdx = line.indexOf(':');
    const field = colonIdx < 0 ? line : line.slice(0, colonIdx);
    const value = colonIdx < 0 ? '' : line.slice(colonIdx + 1).replace(/^ /, '');
    switch (field) {
      case 'event':
        eventName = value;
        break;
      case 'data':
        dataBuf.push(value);
        break;
      case 'id':
        id = value;
        break;
      // 'retry' ignored
    }
  }
  const evt = flush();
  if (evt) yield evt;
}

function tryJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
