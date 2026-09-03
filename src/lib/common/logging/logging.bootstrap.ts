import { type Container } from 'extension/common/di';
import {
  type LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

/**
 * Wires the persisted logging configuration into {@link LoggingService}.
 *
 * `LoggingService` cannot inject `LoggingDataRepository` itself as the repository (transitively) depends on
 * `LoggingService`, which `inversify` rejects as a circular dependency. Pushing the repository in here, once all
 * bindings are in place, keeps `LoggingService` at the bottom of the dependency graph.
 *
 * This is a no-op in contexts that don't bind `LoggingDataRepositoryToken` (e.g. offscreen documents), where the
 * default configuration is used instead.
 */
export const configureLoggingService = (container: Container): void => {
  const repository = container.get<LoggingDataRepository>(LoggingDataRepositoryToken, { optional: true });
  if (!repository) {
    return;
  }

  container.get<LoggingService>(LoggingServiceToken).configure(repository);
};
