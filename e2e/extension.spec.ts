import { expect, test } from './fixtures';

// The single most valuable e2e assertion in the repo: that the built artifact is a loadable extension at all. No unit
// test can catch a malformed manifest, a service worker that throws on registration, or a bundling error.
test.describe('extension loading', () => {
  test('registers the background service worker', async ({ serviceWorker, extensionId }) => {
    expect(extensionId).toMatch(/^[a-z]{32}$/);
    expect(serviceWorker.url()).toContain('lib/worker/background.js');
  });

  test('exposes the manifest that was built from package.json', async ({ serviceWorker }) => {
    const manifest = await serviceWorker.evaluate(() => chrome.runtime.getManifest());

    expect(manifest.manifest_version).toBe(3);
    // The build injects the real version, so `0.0.0` would mean the injection step silently regressed
    expect(manifest.version).not.toBe('0.0.0');
  });

  // Proves the real storage path that `FakeDataStorage` only approximates in unit tests. Seeding happens
  // asynchronously after the worker registers, so this has to poll rather than read once.
  test('seeds default data into chrome.storage on install', async ({ serviceWorker }) => {
    await expect
      .poll(async () => {
        const stored = await serviceWorker.evaluate(() => chrome.storage.sync.get());

        return Object.keys(stored).toSorted();
      })
      .toEqual(['analytics', 'logging', 'migration', 'notification', 'template']);

    await expect
      .poll(async () => {
        const stored = await serviceWorker.evaluate(() => chrome.storage.local.get());

        return Object.keys(stored).toSorted();
      })
      .toEqual(['appearance', 'oauth', 'url_shortener']);
  });
});
