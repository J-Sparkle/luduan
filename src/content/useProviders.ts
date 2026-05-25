import { useEffect, useState } from 'react';
import { loadProviders, type StoredProvider } from '@/shared/store/providers';

/**
 * Loads the provider list from `chrome.storage.local` and keeps it in sync
 * via the storage change listener — so the translation card immediately
 * reflects edits made in another tab's options page (no reload needed).
 */
export function useProviders(): StoredProvider[] {
  const [providers, setProviders] = useState<StoredProvider[]>([]);

  useEffect(() => {
    let alive = true;
    loadProviders().then((list) => {
      if (alive) setProviders(list);
    });
    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local') return;
      const change = changes['luduan/providers'];
      if (!change) return;
      setProviders((change.newValue as StoredProvider[]) ?? []);
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      alive = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  return providers;
}
