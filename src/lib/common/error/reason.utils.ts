import { any, type ReasonsErrorReducer } from 'allfulfilled';
import { type Logger } from 'extension/common/logging/logger';

/**
 * Creates a {@link ReasonsErrorReducer} for `allFulfilled` that reduces every rejection reason to the first one that is
 * an {@link Error}, logging the full set first so that nothing is lost.
 *
 * `allFulfilled` defaults to `aggregate()`, which is the right choice when the reasons are only ever logged, but wrong
 * anywhere the *identity* of the error matters. An `AggregateError` is not an `ExtensionError`, so it defeats both of
 * the places this codebase recovers a specific error code:
 *
 * - `ExtensionError.fallback(cause, code)` returns `cause` untouched when it is already an `ExtensionError`. Given an
 *   `AggregateError` it instead wraps it, replacing a precise code such as `DAT404000` with a generic fallback.
 * - `useErrorDetail` renders `error.message` only for an `ExtensionError`, and otherwise falls back to a generic
 *   "something went wrong" string, so the user loses the real reason entirely.
 *
 * An `AggregateError` additionally does not survive a message boundary: `MessageService` serializes errors through
 * `ExtensionError.toJSON()`, which carries no `errors` property, so the individual reasons are dropped rather than
 * merely grouped.
 *
 * `any()` is preferred over `first()` because it selects the first reason that is an `Error` rather than whichever
 * reason happens to sit at index 0, so a promise rejected with a non-`Error` cannot mask a real `ExtensionError`
 * raised by one of its siblings. When every reason is an `Error` the two behave identically.
 *
 * Note that this is *not* a return to `Promise.all` semantics: reasons are collected by `Promise.allSettled` in input
 * order, so the error chosen is the earliest by position rather than the first to reject in time. That is deliberate -
 * it makes the reported error deterministic, and therefore reproducible in a bug report.
 *
 * @param logger The {@link Logger} used to report every reason when more than one promise rejected. A single reason is
 * never logged here, since it is the one being propagated and the caller is left to report it.
 * @param message The message to log the reasons against, describing the operation that partially failed.
 * @return A {@link ReasonsErrorReducer} that reduces the reasons to the first that is an {@link Error}.
 */
export const firstError = (logger: Logger, message: string): ReasonsErrorReducer => {
  const reduce = any();

  return (reasons) => {
    if (reasons.length > 1) {
      logger.error(message, { reasons });
    }

    return reduce(reasons);
  };
};
