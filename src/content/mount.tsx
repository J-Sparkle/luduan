import React from 'react';
import { createRoot } from 'react-dom/client';
import { ContentApp } from './ContentApp';

// Tailwind output is injected as a raw CSS string via Vite's `?inline` import.
import tailwind from '@/shared/ui/styles.css?inline';

const HOST_ID = 'luduan-root';

export function mountContentApp(): void {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;
  // Reset host so page styles can't shift our coordinates.
  host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = tailwind;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  mountPoint.id = 'luduan-mount';
  shadow.appendChild(mountPoint);

  createRoot(mountPoint).render(
    <React.StrictMode>
      <ContentApp />
    </React.StrictMode>,
  );
}
