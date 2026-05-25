import { useEffect, useRef, useState } from 'react';
import { MSG, type ChatPortMessage, type ChatPortRequest } from '@/shared/messaging/protocol';
import type { TranslateTask } from '@/shared/prompts';

export interface TranslationState {
  status: 'idle' | 'starting' | 'streaming' | 'done' | 'error';
  text: string;
  model?: string;
  error?: string;
}

/**
 * Opens a port to the background and streams translation chunks.
 * `task` may change over time (e.g. user switches target language) — each new
 * task starts a fresh port and aborts the previous one.
 */
export function useTranslateStream(task: TranslateTask | null): TranslationState {
  const [state, setState] = useState<TranslationState>({ status: 'idle', text: '' });
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    if (!task) {
      setState({ status: 'idle', text: '' });
      return;
    }

    setState({ status: 'starting', text: '' });
    portRef.current?.disconnect();
    const port = chrome.runtime.connect({ name: MSG.PORT_CHAT });
    portRef.current = port;

    port.onMessage.addListener((msg: ChatPortMessage) => {
      if ('type' in msg && msg.type === 'start') {
        setState((s) => ({ ...s, status: 'streaming', model: msg.modelName }));
        return;
      }
      if (msg.type === 'text') {
        setState((s) => ({ ...s, status: 'streaming', text: s.text + msg.delta }));
        return;
      }
      if (msg.type === 'error') {
        setState((s) => ({ ...s, status: 'error', error: msg.message }));
        return;
      }
      if (msg.type === 'done') {
        setState((s) => ({ ...s, status: 'done' }));
      }
    });

    port.onDisconnect.addListener(() => {
      setState((s) =>
        s.status === 'streaming' || s.status === 'starting'
          ? { ...s, status: 'done' }
          : s,
      );
    });

    const req: ChatPortRequest = { type: 'translate', task };
    port.postMessage(req);

    return () => {
      port.disconnect();
    };
  }, [task?.text, task?.targetLang, task?.style]);

  return state;
}
