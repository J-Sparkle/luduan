import { mountContentApp } from './mount';

// Avoid double injection across iframes / soft navigations.
if (!(window as any).__LUDUAN_INJECTED__) {
  (window as any).__LUDUAN_INJECTED__ = true;
  mountContentApp();
}
