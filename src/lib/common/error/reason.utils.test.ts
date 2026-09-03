import { allFulfilled } from 'allfulfilled';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExtensionError } from 'extension/common/error/extension-error';
import { firstError } from 'extension/common/error/reason.utils';
import { createLoggerMock, type LoggerMock } from 'extension/test/logger.mock';

describe('firstError', () => {
  let logger: LoggerMock;

  beforeEach(() => {
    logger = createLoggerMock();
  });

  it('propagates a lone rejection reason untouched', async () => {
    const cause = ExtensionError.from('DAT404000', 'templates');

    await expect(allFulfilled([Promise.reject(cause)], firstError(logger, 'failed'))).rejects.toBe(cause);
  });

  it('does not log when only one promise rejected, since that reason is propagated', async () => {
    await allFulfilled([Promise.reject(new Error('boom'))], firstError(logger, 'failed')).catch(() => undefined);

    expect(logger.error).not.toHaveBeenCalled();
  });

  // The whole point of the reducer: an `ExtensionError` must survive so `ExtensionError.fallback` passes it through
  // and `useErrorDetail` can render its specific message, rather than both seeing an opaque `AggregateError`.
  it('preserves an ExtensionError so its code survives ExtensionError.fallback', async () => {
    const cause = ExtensionError.from('DAT404000', 'templates');

    const error = await allFulfilled(
      [Promise.reject(cause), Promise.reject(new Error('boom'))],
      firstError(logger, 'failed'),
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ExtensionError);
    expect(ExtensionError.fallback(error, 'MIG500300').code).toBe('DAT404000');
  });

  it('skips a non-Error reason so it cannot mask a real Error raised by a sibling', async () => {
    const cause = ExtensionError.from('DAT404000', 'templates');

    await expect(
      allFulfilled([Promise.reject('not an error'), Promise.reject(cause)], firstError(logger, 'failed')),
    ).rejects.toBe(cause);
  });

  it('falls back to the first reason when none of them are Errors', async () => {
    await expect(
      allFulfilled([Promise.reject('first'), Promise.reject('second')], firstError(logger, 'failed')),
    ).rejects.toBe('first');
  });

  it('selects by input order rather than by which rejected first in time', async () => {
    const slow = new Error('index 0');
    const quick = new Error('index 1');

    await expect(
      allFulfilled(
        [
          new Promise((_resolve, reject) => setTimeout(() => reject(slow), 20)),
          new Promise((_resolve, reject) => setTimeout(() => reject(quick), 1)),
        ],
        firstError(logger, 'failed'),
      ),
    ).rejects.toBe(slow);
  });

  it('logs every reason when more than one promise rejected, so the discarded ones are not lost', async () => {
    const first = new Error('first');
    const second = new Error('second');

    await allFulfilled([Promise.reject(first), Promise.reject(second)], firstError(logger, 'failed to do it')).catch(
      () => undefined,
    );

    expect(logger.error).toHaveBeenCalledWith('failed to do it', { reasons: [first, second] });
  });

  it('ignores fulfilled promises entirely', async () => {
    const cause = new Error('boom');

    await expect(
      allFulfilled([Promise.resolve('ok'), Promise.reject(cause)], firstError(logger, 'failed')),
    ).rejects.toBe(cause);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves with every value, in input order, when nothing rejects', async () => {
    await expect(
      allFulfilled([Promise.resolve('a'), Promise.resolve('b')], firstError(logger, 'failed')),
    ).resolves.toEqual(['a', 'b']);
  });
});
