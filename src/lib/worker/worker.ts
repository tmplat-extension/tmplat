export const WorkerToken = Symbol('WorkerToken');

export interface Worker {
  run(): Promise<void>;
}
