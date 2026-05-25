/// <reference types="chrome" />

import { handleChatPort, MSG } from '@/shared/messaging/protocol';

console.log('[Luduan] background service worker started');

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === MSG.PORT_CHAT) {
    handleChatPort(port);
  }
});
