import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// The e2e suite is only meaningful against a current build, and a stale `dist/temp` produces confusing failures that
// look like product bugs. Building here rather than documenting it as a prerequisite makes that impossible.
export default async function globalSetup(): Promise<void> {
  // Escape hatch for fast local iteration when `dist/temp` is already current
  if (process.env.E2E_SKIP_BUILD === 'true') {
    console.log('[e2e] Skipping build (E2E_SKIP_BUILD=true)');

    return;
  }

  console.log('[e2e] Building extension into dist/temp...');

  await execFileAsync('npm', ['run', 'build:dev'], { cwd: path.resolve(__dirname, '..') });
}
