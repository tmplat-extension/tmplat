import 'extension/common/system/browser-api.polyfill';

import { container } from 'extension/worker/background/background-worker.config';
import { type Worker, WorkerToken } from 'extension/worker/worker';

const worker = container.get<Worker>(WorkerToken);
(async () => {
  await worker.run();
})();
