const STORAGE_KEY = 'luduan/last-model';

export interface LastModel {
  providerId: string;
  modelName: string;
}

export async function loadLastModel(): Promise<LastModel | undefined> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] as LastModel | undefined;
}

export async function saveLastModel(m: LastModel): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: m });
}
