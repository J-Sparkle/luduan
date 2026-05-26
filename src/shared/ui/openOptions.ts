/**
 * Opens the extension's Options page. Tries `chrome.runtime.openOptionsPage`
 * first (the official MV3 path), falling back to opening the bundled HTML in
 * a new tab if it's somehow unavailable (e.g. very old Chrome, or the page
 * is invoked from a context where runtime is undefined).
 */
export function openOptions(): void {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
      return;
    }
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      const url = chrome.runtime.getURL('src/options/index.html');
      window.open(url, '_blank');
      return;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Luduan] openOptions failed:', e);
  }
}
