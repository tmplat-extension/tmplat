import { describe, expect, it } from 'vitest';
import { BackgroundWorker } from 'extension/worker/background/background-worker';
import { container } from 'extension/worker/background/background-worker.config';
import { WorkerToken } from 'extension/worker/worker';

/*
 * `inversify` resolves lazily, so a missing or misdirected binding is invisible to both `tsc` and every other unit
 * test - it only surfaces at runtime, where in a service worker it means a dead extension. Resolving the entry token
 * builds the whole transitive constructor-injection graph, turning that class of failure into a build failure.
 *
 * The assertion deliberately mirrors what `index.ts` does, rather than enumerating bindings: `inversify` exposes no
 * way to enumerate a container, and a hand-maintained token list would rot exactly when it matters - when someone
 * adds a dependency and forgets to bind it.
 *
 * A container is a module-level singleton that eagerly constructs repositories, so it reads the `browser` global
 * while it is being *imported*. That used to force a dynamic `import()` inside `beforeAll`, after an explicit
 * `installBrowserApiMock()` - which billed the entire transitive module graph (for the UI containers, all of
 * React/MUI) against a timeout. Moving it from the 5s `testTimeout` to the 10s `hookTimeout` only widened the
 * window; under CPU contention these suites still timed out. `src/lib/test/setup.ts` now installs the fake at module
 * scope, so a static import is safe, and the transform cost lands in collection where no timeout bounds it.
 */
describe('background worker container', () => {
  it('resolves the worker entry point with its full dependency graph', () => {
    expect(container.get(WorkerToken)).toBeInstanceOf(BackgroundWorker);
  });
});
