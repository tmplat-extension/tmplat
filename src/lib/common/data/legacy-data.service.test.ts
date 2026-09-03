import { describe, expect, it, vi } from 'vitest';
import { LegacyDataService } from 'extension/common/data/legacy-data.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { FakeDomStorage } from 'extension/test/storage-area.fake';

/**
 * `DomDataStorage` reads `window[storageName]` in its constructor and throws if it is absent, so `window` must be
 * stubbed before the lazy getters are touched.
 */
const stubWindow = (localStorage = new FakeDomStorage(), sessionStorage = new FakeDomStorage()) => {
  vi.stubGlobal('window', { localStorage, sessionStorage });
  return { localStorage, sessionStorage };
};

const createService = () => new LegacyDataService(createLoggingServiceMock() as unknown as LoggingService);

describe('LegacyDataService', () => {
  it('exposes localStorage as the local data storage', async () => {
    const { localStorage } = stubWindow();
    localStorage.setItem('links', JSON.stringify({ title: true }));
    const service = createService();

    await expect(service.local.get('links')).resolves.toEqual({ title: true });
  });

  it('exposes sessionStorage as the session data storage', async () => {
    const { sessionStorage } = stubWindow();
    sessionStorage.setItem('scratch', JSON.stringify('value'));
    const service = createService();

    await expect(service.session.get('scratch')).resolves.toBe('value');
  });

  it('writes through to the underlying DOM storage', async () => {
    const { localStorage } = stubWindow();
    const service = createService();

    await service.local.set('menu', { enabled: true });

    expect(localStorage.getItem('menu')).toBe(JSON.stringify({ enabled: true }));
  });

  it('keeps local and session storage isolated from each other', async () => {
    stubWindow();
    const service = createService();

    await service.local.set('shared', 'local-value');
    await service.session.set('shared', 'session-value');

    await expect(service.local.get('shared')).resolves.toBe('local-value');
    await expect(service.session.get('shared')).resolves.toBe('session-value');
  });

  describe('caching', () => {
    it('returns the same local instance across calls rather than constructing a new one', () => {
      stubWindow();
      const service = createService();

      expect(service.local).toBe(service.local);
    });

    it('returns the same session instance across calls', () => {
      stubWindow();
      const service = createService();

      expect(service.session).toBe(service.session);
    });

    it('constructs a logger once per storage area, not once per access', () => {
      stubWindow();
      const logging = createLoggingServiceMock();
      const service = new LegacyDataService(logging as unknown as LoggingService);

      void service.local;
      void service.local;
      void service.session;

      // Caching matters beyond allocation: `DomDataStorage` holds its own change-listener array, so a fresh
      // instance per access would silently drop any listener registered against an earlier one
      const names = logging.getLogger.mock.calls.map(([name]) => name);
      expect(names).toEqual(['DomDataStorage.localStorage', 'DomDataStorage.sessionStorage']);
    });

    it('registers change listeners against the cached instance', async () => {
      stubWindow();
      const service = createService();
      const listener = vi.fn();

      // Asserted observably: a listener added via one `service.local` access must still fire for a write made
      // through a later access. Were the getter to construct a fresh instance each time, the listener would be
      // stranded on a discarded object and silently never fire again
      service.local.addChangeListener(listener);
      await service.local.set('menu', { enabled: true });

      expect(listener).toHaveBeenCalledWith({ menu: { newValue: { enabled: true } } });
    });
  });

  it('defers construction until a storage area is accessed', () => {
    vi.stubGlobal('window', undefined);

    // Constructing the service must not touch `window`, otherwise merely injecting it into a worker or content
    // script (where DOM storage may be unavailable) would throw
    expect(() => createService()).not.toThrow();
  });
});
