import type { ProtocolId } from '@/shared/providers/types';

export interface StoredProvider {
  id: string;
  name: string;
  protocol: ProtocolId;
  baseUrl: string;
  apiKey: string;
  extraHeaders?: Record<string, string>;
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
