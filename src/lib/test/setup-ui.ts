import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library mounts into a container appended to `document.body`. Vitest's `restoreMocks`/`unstubGlobals`
// don't know about it, so it has to be unmounted explicitly or components leak between tests.
afterEach(() => {
  cleanup();
});
