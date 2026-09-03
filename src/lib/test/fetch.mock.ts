import { type Mock, vi } from 'vitest';

/**
 * Installs a spy in place of the global `fetch`, for testing code that talks to a third-party HTTP API.
 *
 * Vitest unstubs globals after each test (see `vitest.config.mts`), so this must be called from within the test (or
 * a `beforeEach`) that needs it.
 */
export const installFetchMock = (): Mock<typeof fetch> => {
  const mock = vi.fn<typeof fetch>();

  vi.stubGlobal('fetch', mock);

  return mock;
};

/** Builds a successful JSON response, or a failed one when `status` is overridden via `init`. */
export const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

/** Builds a plain text response, as returned by APIs such as da.gd. */
export const textResponse = (body: string, init: ResponseInit = {}): Response =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
    status: 200,
    ...init,
  });

/**
 * Builds a response whose body is not valid JSON, for asserting that a provider treats a malformed body the same as
 * a missing one rather than letting the parse error escape.
 */
export const malformedJsonResponse = (init: ResponseInit = {}): Response =>
  new Response('<html>not json</html>', {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

/** Reads the body that was passed to `fetch` for the given call, as a string. */
export const getRequestBody = (mock: Mock<typeof fetch>, callIndex = 0): string =>
  String(mock.mock.calls[callIndex][1]?.body ?? '');

/** Reads the body that was passed to `fetch` for the given call, parsed as JSON. */
export const getRequestJsonBody = (mock: Mock<typeof fetch>, callIndex = 0): unknown =>
  JSON.parse(getRequestBody(mock, callIndex));

/** Reads the body that was passed to `fetch` for the given call, parsed as URL-encoded form data. */
export const getRequestFormBody = (mock: Mock<typeof fetch>, callIndex = 0): URLSearchParams =>
  new URLSearchParams(getRequestBody(mock, callIndex));

/** Reads the URL that was passed to `fetch` for the given call. */
export const getRequestUrl = (mock: Mock<typeof fetch>, callIndex = 0): string => String(mock.mock.calls[callIndex][0]);

/** Reads the headers that were passed to `fetch` for the given call. */
export const getRequestHeaders = (mock: Mock<typeof fetch>, callIndex = 0): Record<string, string> =>
  (mock.mock.calls[callIndex][1]?.headers ?? {}) as Record<string, string>;
