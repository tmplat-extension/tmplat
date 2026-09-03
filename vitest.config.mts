import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolveSrc = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

const resolve = {
  alias: {
    extension: resolveSrc('./src/lib'),
  },
};

// Applied to every project. Mocks and stubbed globals reset between tests so that no test can leak state into the
// next one, and `globals: false` keeps `describe`/`it`/`expect` explicitly imported.
const sharedTestConfig = {
  clearMocks: true,
  globals: false,
  restoreMocks: true,
  unstubEnvs: true,
  unstubGlobals: true,
};

// The non-UI trees. These run under `node` because nothing in them needs a DOM; the handful of modules that touch
// DOM globals stub only what they use, which keeps the suite fast and makes the dependency explicit.
const nodeTrees = ['analytics', 'common', 'context-menu', 'oauth', 'tab', 'template', 'url-shortener', 'worker'];

// The trees that genuinely need a DOM: React components, and the content scripts that manipulate the host page.
const domTrees = ['content', 'ui'];

export default defineConfig({
  resolve,
  test: {
    // Persist transformed modules under `node_modules/.vite` so a cold `vitest run` doesn't re-transform the whole
    // module graph every time. The cache is keyed on file content and invalidated when dependencies are reinstalled.
    fsModuleCache: true,
    // On CI also emit a JUnit report so the run can be uploaded as an artifact and inspected after the fact, plus
    // inline annotations on the failing lines. Locally the default reporter is enough and nothing is written to disk.
    outputFile: { junit: './dist/test-results/vitest-junit.xml' },
    reporters: process.env.CI ? ['default', 'junit', 'github-actions'] : ['default'],
    coverage: {
      exclude: ['src/lib/test/**', 'src/lib/**/*.test.ts', 'src/lib/**/*.test.tsx'],
      include: [...nodeTrees, ...domTrees].map((tree) => `src/lib/${tree}/**`),
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './dist/coverage',
    },
    projects: [
      {
        resolve,
        test: {
          ...sharedTestConfig,
          environment: 'node',
          include: nodeTrees.map((tree) => `src/lib/${tree}/**/*.test.ts`),
          // These files share most of their module graph (DI, common utils), which was being re-evaluated from
          // scratch for every one of them. Nothing here keeps mutable module-level state across tests — the browser
          // API fake is reinstalled per test and the two modules that read a global at import time
          // (`system.utils`) reset the registry themselves — so the module graph can safely be shared per worker.
          isolate: false,
          name: 'node',
          setupFiles: ['./src/lib/test/setup.ts'],
        },
      },
      {
        resolve,
        test: {
          ...sharedTestConfig,
          environment: 'jsdom',
          include: domTrees.flatMap((tree) => [`src/lib/${tree}/**/*.test.ts`, `src/lib/${tree}/**/*.test.tsx`]),
          name: 'dom',
          // The default `threads` pool builds a brand new jsdom for every test file, which dominated the run time of
          // this project (~14s of tracked time across 17 files) and triggered Vitest's own performance warning.
          // `vmThreads` runs each file in its own VM context sharing one jsdom per worker, so per-file isolation is
          // preserved while the environment is only constructed once per worker.
          pool: 'vmThreads',
          setupFiles: ['./src/lib/test/setup.ts', './src/lib/test/setup-ui.ts'],
        },
      },
    ],
  },
});
