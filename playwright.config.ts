import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Playwright loads this config as CommonJS (the package has no `"type": "module"`), so `__dirname` is used rather
// than `import.meta.url`.
const resolveRoot = (relativePath: string): string => path.resolve(__dirname, relativePath);

// The extension is loaded from the unpacked dev build rather than the zipped production artifact, because Chrome can
// only `--load-extension` a directory. `globalSetup` rebuilds it so a run can never silently test a stale bundle.
export const EXTENSION_PATH = resolveRoot('dist/temp');

export const FIXTURE_BASE_URL = 'http://localhost:4321';

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  globalSetup: resolveRoot('e2e/global-setup.ts'),
  // Artefacts live under `dist/` so they are covered by the existing gitignore entry and cleared by `npm run clean`
  outputDir: resolveRoot('dist/test-results'),
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: resolveRoot('dist/playwright-report') }]]
    : [['list']],
  retries: process.env.CI ? 1 : 0,
  testDir: resolveRoot('e2e'),
  // An extension is a single browser-wide install, and several flows assert on shared state such as
  // `chrome.storage`, so the suite is serialised rather than sharded across workers.
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: FIXTURE_BASE_URL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx http-server ${resolveRoot('e2e/fixture-pages')} -p 4321 -s`,
    reuseExistingServer: !process.env.CI,
    url: FIXTURE_BASE_URL,
  },
});
