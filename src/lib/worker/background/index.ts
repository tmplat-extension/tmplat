import { container } from 'extension/worker/background/background-worker.config';
import { Worker, WorkerToken } from 'extension/worker/worker';

const worker = container.get<Worker>(WorkerToken);
(async () => {
  await worker.run();
})();
