import type { AuthStyle, ProtocolId } from '@/shared/providers/types';

export interface ProviderParams {
  /** Sampling temperature. Leave undefined to let the model use its default
   *  (some gateways reject the parameter entirely — e.g. Claude Opus 4.7 via
   *  internal proxies). */
  temperature?: number;
  /** Nucleus sampling cutoff (0-1). Optional. */
  topP?: number;
  /** Max output tokens. Falls back to 1024 if undefined. */
  maxTokens?: number;
}

export interface StoredProvider {
  id: string;
  name: string;
  protocol: ProtocolId;
  baseUrl: string;
  apiKey: string;
  authStyle?: AuthStyle;
  extraHeaders?: Record<string, string>;
  params?: ProviderParams;
  /** Model names the user enabled, in priority order. */
  models: string[];
  enabled: boolean;
}

const STORAGE_KEY = 'luduan/providers';

export async function loadProviders(): Promise<StoredProvider[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return (data[STORAGE_KEY] as StoredProvider[]) ?? [];
}

export async function saveProviders(list: StoredProvider[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: list });
}

export async function upsertProvider(p: StoredProvider): Promise<StoredProvider[]> {
  const list = await loadProviders();
  const idx = list.findIndex((x) => x.id === p.id);
  if (idx >= 0) list[idx] = p;
  else list.push(p);
  await saveProviders(list);
  return list;
}

export async function deleteProvider(id: string): Promise<StoredProvider[]> {
  const list = (await loadProviders()).filter((p) => p.id !== id);
  await saveProviders(list);
  return list;
}

export function newProviderId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
