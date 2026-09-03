import { describe, expect, it, vi } from 'vitest';
import * as system from 'extension/common/system/system.utils';

// `system.utils` re-reads `navigator` on every call, so each test only has to stub the global before exercising the
// helpers — no module reset is needed. Both the modern `userAgentData` path and the legacy `navigator.platform`
// fallback are covered. Vitest unstubs globals after each test (see `vitest.config.mts`).
const useNavigator = (navigatorStub: unknown): void => {
  vi.stubGlobal('navigator', navigatorStub);
};

const windowsNavigator = {
  platform: 'Windows',
  userAgentData: {
    platform: 'Windows',
    brands: [
      { brand: 'Chromium', version: '120' },
      { brand: 'Google Chrome', version: '120' },
    ],
    getHighEntropyValues: async () => ({ fullVersionList: [{ brand: 'Google Chrome', version: '120.0.1.2' }] }),
  },
};

const macNavigator = {
  platform: 'macOS',
  userAgentData: {
    platform: 'macOS',
    brands: [{ brand: 'Chromium', version: '120' }],
    getHighEntropyValues: async () => ({ uaFullVersion: '120.0.9.9' }),
  },
};

const keyboardEvent = (modifiers: Partial<KeyboardEvent>): KeyboardEvent =>
  ({ altKey: false, ctrlKey: false, shiftKey: false, ...modifiers }) as KeyboardEvent;

describe('system.utils with userAgentData (Windows)', () => {
  it('reports the platform as the OS', () => {
    useNavigator(windowsNavigator);
    expect(system.getOs()).toBe('Windows');
  });

  it('reports the last brand as the browser', () => {
    useNavigator(windowsNavigator);
    expect(system.getBrowserInfo()).toEqual({ name: 'Google Chrome', version: '120' });
  });

  it('uses the Ctrl+Alt shortcut modifier', () => {
    useNavigator(windowsNavigator);
    expect(system.getShortcutModifier()).toBe('Ctrl+Alt+');
  });

  it('detects the shortcut modifier from ctrl+alt only', () => {
    useNavigator(windowsNavigator);
    expect(system.isShortcutModifierActive(keyboardEvent({ altKey: true, ctrlKey: true }))).toBe(true);
    expect(system.isShortcutModifierActive(keyboardEvent({ shiftKey: true, altKey: true }))).toBe(false);
  });

  it('resolves the full browser version from the high-entropy list', async () => {
    useNavigator(windowsNavigator);
    await expect(system.getFullBrowserInfo()).resolves.toEqual({ name: 'Google Chrome', version: '120.0.1.2' });
  });
});

describe('system.utils with userAgentData (macOS)', () => {
  it('uses the mac shortcut modifier', () => {
    useNavigator(macNavigator);
    expect(system.getShortcutModifier()).toBe('⇧⌥');
  });

  it('detects the shortcut modifier from shift+alt only', () => {
    useNavigator(macNavigator);
    expect(system.isShortcutModifierActive(keyboardEvent({ shiftKey: true, altKey: true }))).toBe(true);
    expect(system.isShortcutModifierActive(keyboardEvent({ ctrlKey: true, altKey: true }))).toBe(false);
  });

  it('falls back to uaFullVersion when no full version list is present', async () => {
    useNavigator(macNavigator);
    await expect(system.getFullBrowserInfo()).resolves.toEqual({ name: 'Chromium', version: '120.0.9.9' });
  });

  it('falls back to the low-entropy brand version when high-entropy values are unavailable', async () => {
    useNavigator({
      platform: 'macOS',
      userAgentData: {
        platform: 'macOS',
        brands: [{ brand: 'Chromium', version: '120' }],
        getHighEntropyValues: async () => {
          throw new Error('denied');
        },
      },
    });
    await expect(system.getFullBrowserInfo()).resolves.toEqual({ name: 'Chromium', version: '120' });
  });
});

describe('system.utils without userAgentData', () => {
  const legacyNavigator = { platform: 'MacIntel', userAgentData: undefined };

  it('reports the legacy platform as the OS', () => {
    useNavigator(legacyNavigator);
    expect(system.getOs()).toBe('MacIntel');
  });

  it('detects mac via the platform prefix', () => {
    useNavigator(legacyNavigator);
    expect(system.getShortcutModifier()).toBe('⇧⌥');
  });

  it('has no browser info', () => {
    useNavigator(legacyNavigator);
    expect(system.getBrowserInfo()).toBeUndefined();
  });

  it('has no full browser info', async () => {
    useNavigator(legacyNavigator);
    await expect(system.getFullBrowserInfo()).resolves.toBeUndefined();
  });
});
