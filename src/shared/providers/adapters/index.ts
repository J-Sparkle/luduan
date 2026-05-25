import type { ProtocolId, ProviderAdapter } from '../types';
import { openaiAdapter } from './openai';
import { anthropicAdapter } from './anthropic';
import { geminiAdapter } from './gemini';

const registry: Record<ProtocolId, ProviderAdapter | undefined> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  azure: undefined,
  custom: undefined,
};

export function getAdapter(protocol: ProtocolId): ProviderAdapter {
  const adapter = registry[protocol];
  if (!adapter) throw new Error(`Adapter not implemented for protocol: ${protocol}`);
  return adapter;
}

export { openaiAdapter, anthropicAdapter, geminiAdapter };
